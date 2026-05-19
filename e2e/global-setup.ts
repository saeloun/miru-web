/**
 * Authenticates once and saves session state so every test file reuses
 * the same logged-in cookie jar.
 */
import { execFileSync } from "node:child_process";
import { test as setup, expect, request } from "@playwright/test";
import { TEST_PASSWORD } from "./helpers";

const AUTH_FILE = "e2e/.auth/admin.json";
const BASE_URL = "http://127.0.0.1:3000";
const GLOBAL_ADMIN_EMAIL = "codex.e2e.admin@saeloun.example";

function ensureGlobalAdminCredentials() {
    const rubyCode = `
require "json"

password = ${JSON.stringify(TEST_PASSWORD)}
owner = User.find_by!(email: "vipul@saeloun.com")
company = owner.current_workspace || owner.companies.first

user = User.find_or_initialize_by(email: ${JSON.stringify(GLOBAL_ADMIN_EMAIL)})
user.first_name = "Codex"
user.last_name = "Admin"
user.password = password if user.new_record?
user.password_confirmation = password if user.new_record?
user.confirmed_at ||= Time.current
user.locale ||= "en-US"
user.current_workspace_id = company.id
user.save!

Employment.find_or_create_by!(company: company, user: user)
user.add_role(:admin, company) unless user.has_role?(:admin, company)

puts({
  email: user.email,
  password: password,
  company_id: company.id
}.to_json)
`;

    const output = execFileSync(
        "mise",
        ["exec", "--", "bundle", "exec", "rails", "runner", rubyCode],
        {
            cwd: process.cwd(),
            encoding: "utf8",
        },
    );

    const lastLine = output
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .at(-1);

    if (!lastLine) throw new Error("Failed to provision global admin credentials");
    return JSON.parse(lastLine) as { email: string; password: string; company_id: number };
}

setup("authenticate as admin", async ({ page }) => {
    const credentials = ensureGlobalAdminCredentials();
    const apiContext = await request.newContext({
        baseURL: BASE_URL,
    });

    try {
        const response = await apiContext.post("/api/v1/users/login", {
            data: {
                user: {
                    email: credentials.email,
                    password: credentials.password,
                    locale: "en-US",
                },
            },
        });

        expect(
            response.ok(),
            `Admin login failed with status ${response.status()}`
        ).toBeTruthy();

        const authPayload = await response.json();
        expect(authPayload.requires_passkey).not.toBeTruthy();
        expect(authPayload.requires_totp).not.toBeTruthy();
        expect(authPayload.user?.token).toBeTruthy();

        const requestState = await apiContext.storageState();
        await page.context().addCookies(requestState.cookies);

        // Seed the same auth-related localStorage the web sign-in flow writes.
        await page.goto("/");
        await page.evaluate(payload => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.localStorage.setItem(
                "authToken",
                JSON.stringify(payload.user.token)
            );
            window.localStorage.setItem(
                "authEmail",
                JSON.stringify(payload.user.email)
            );
            window.localStorage.setItem("user", JSON.stringify(payload.user));
            window.localStorage.setItem(
                "company_role",
                payload.company_role || ""
            );
            if (payload.company) {
                window.localStorage.setItem(
                    "company",
                    JSON.stringify(payload.company)
                );
            }
            window.localStorage.setItem("miru-locale", "en-US");
        }, authPayload);

        await page.goto("/dashboard");
        await page.waitForResponse(
            response =>
                response.url().includes("/api/v1/users/_me") &&
                response.status() === 200,
            { timeout: 15_000 }
        );
        await page.waitForURL("**/dashboard", { timeout: 15_000 });
    } finally {
        await apiContext.dispose();
    }

    await page.context().storageState({ path: AUTH_FILE });
});
