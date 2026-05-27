import { execFileSync } from "node:child_process";

import { expect, test, type Page } from "@playwright/test";

import { signInAs } from "../public-forms/helpers";

type MixedRoleFixture = {
    adminCompanyId: number;
    employeeCompanyId: number;
    email: string;
    password: string;
    userId: number;
};

function rubyLiteral(value: unknown): string {
    if (value === null || value === undefined) return "nil";

    return JSON.stringify(value);
}

function runRailsJson<T>(rubyCode: string): T {
    const output = execFileSync(
        "mise",
        ["exec", "--", "bundle", "exec", "rails", "runner", rubyCode],
        {
            cwd: process.cwd(),
            encoding: "utf8",
        }
    );

    const lastLine = output
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .at(-1);

    if (!lastLine) {
        throw new Error("rails runner did not return JSON output");
    }

    return JSON.parse(lastLine) as T;
}

function uniqueMixedRoleEmail() {
    return `e2e-mixed-role-${Date.now().toString(36)}@example.com`;
}

async function createMixedRoleFixture(): Promise<MixedRoleFixture> {
    const email = uniqueMixedRoleEmail();
    const password = "CodexMixedRole!2026";

    return runRailsJson<MixedRoleFixture>(`
require "json"

admin_company = Company.create!(
  name: "Mixed Role Admin Workspace",
  business_phone: "+12125550101",
  base_currency: "USD",
  standard_price: 100,
  fiscal_year_end: "December",
  date_format: "MM-DD-YYYY",
  country: "US",
  timezone: "Eastern Time (US & Canada)",
  working_days: "5",
  working_hours: "40"
)
admin_company.addresses.create!(
  address_type: "current",
  address_line_1: "101 Admin Street",
  city: "Brooklyn",
  state: "NY",
  country: "US",
  pin: "11201"
)

employee_company = Company.create!(
  name: "Mixed Role Employee Workspace",
  business_phone: "+12125550102",
  base_currency: "USD",
  standard_price: 100,
  fiscal_year_end: "December",
  date_format: "MM-DD-YYYY",
  country: "US",
  timezone: "Eastern Time (US & Canada)",
  working_days: "5",
  working_hours: "40"
)
employee_company.addresses.create!(
  address_type: "current",
  address_line_1: "202 Employee Street",
  city: "Brooklyn",
  state: "NY",
  country: "US",
  pin: "11201"
)

user = User.create!(
  first_name: "Mixed",
  last_name: "Role",
  email: ${rubyLiteral(email)},
  password: ${rubyLiteral(password)},
  password_confirmation: ${rubyLiteral(password)},
  confirmed_at: Time.current,
  locale: "en-US",
  current_workspace_id: admin_company.id
)

Employment.create!(company: admin_company, user: user)
Employment.create!(company: employee_company, user: user)
user.add_role(:admin, admin_company)
user.add_role(:employee, employee_company)

puts({
  adminCompanyId: admin_company.id,
  employeeCompanyId: employee_company.id,
  email: user.email,
  password: ${rubyLiteral(password)},
  userId: user.id
}.to_json)
`);
}

async function deleteMixedRoleFixture(
    fixture: MixedRoleFixture | null | undefined
) {
    if (!fixture) return;

    runRailsJson<{ deleted: boolean }>(`
require "json"

User.find_by(id: ${rubyLiteral(fixture.userId)})&.destroy!
Company.find_by(id: ${rubyLiteral(fixture.adminCompanyId)})&.destroy!
Company.find_by(id: ${rubyLiteral(fixture.employeeCompanyId)})&.destroy!

puts({ deleted: true }.to_json)
`);
}

async function switchWorkspace(page: Page, workspaceId: number) {
    const response = await page.request.put(
        `/api/v1/workspaces/${workspaceId}`
    );
    expect(
        response.ok(),
        `Failed to switch workspace: ${response.status()}`
    ).toBeTruthy();
}

async function currentSessionState(page: Page) {
    const response = await page.request.get("/api/v1/users/_me");
    expect(
        response.ok(),
        `Failed to fetch current session state: ${response.status()}`
    ).toBeTruthy();

    return await response.json();
}

test.describe("Navigation — Mixed Workspace Roles", () => {
    test.use({ storageState: undefined });

    test("the same user gets admin access in one workspace and employee access in another", async ({
        page,
    }) => {
        const fixture = await createMixedRoleFixture();

        try {
            await signInAs(page, fixture.email, fixture.password);

            let session = await currentSessionState(page);
            expect(session.company.id).toBe(fixture.adminCompanyId);
            expect(session.company_role).toBe("admin");

            const workspacesResponse = await page.request.get("/api/v1/workspaces");
            expect(workspacesResponse.ok()).toBeTruthy();
            const workspaces = (await workspacesResponse.json()).workspaces;
            expect(workspaces).toHaveLength(2);

            await page.goto("/settings/notifications");
            await expect(page).toHaveURL(/\/settings\/notifications$/);

            await page.goto("/settings/organization");
            await expect(page).toHaveURL(/\/settings\/organization$/);

            await page.goto("/team");
            await expect(page).toHaveURL(/\/team(?:$|[/?#])/);

            await switchWorkspace(page, fixture.employeeCompanyId);

            session = await currentSessionState(page);
            expect(session.company.id).toBe(fixture.employeeCompanyId);
            expect(session.company_role).toBe("employee");

            await page.goto("/dashboard");
            await page.waitForURL(/\/time-tracking$/, { timeout: 15_000 });

            await page.goto("/settings/notifications");
            await expect(page).toHaveURL(/\/settings\/notifications$/);

            await page.goto("/settings/organization", {
                waitUntil: "domcontentloaded",
            }).catch(() => { });
            await page.waitForURL(/\/error$/, { timeout: 15_000 });

            await page.goto("/team", {
                waitUntil: "domcontentloaded",
            }).catch(() => { });
            await page.waitForURL(/\/time-tracking$/, { timeout: 15_000 });

            await switchWorkspace(page, fixture.adminCompanyId);

            session = await currentSessionState(page);
            expect(session.company.id).toBe(fixture.adminCompanyId);
            expect(session.company_role).toBe("admin");

            await page.goto("/dashboard");
            await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });

            await page.goto("/settings/organization");
            await expect(page).toHaveURL(/\/settings\/organization$/);
        } finally {
            await deleteMixedRoleFixture(fixture);
        }
    });
});
