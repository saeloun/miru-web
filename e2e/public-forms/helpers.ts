import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { expect, Locator, Page } from "@playwright/test";

export const TEST_PASSWORD = process.env.SEED_PASSWORD || "Miru@Dev2026!";
export const DISPOSABLE_AUTH_PASSWORD = "CodexAuth!2026";
const SEED_PASSWORD_CANDIDATES = Array.from(
    new Set(
        [
            process.env.SEED_PASSWORD,
            process.env.MIRU_E2E_PASSWORD,
            "password",
            "Miru@Dev2026!",
        ].filter(Boolean),
    ),
) as string[];

type AuthRole = "admin" | "owner" | "book_keeper" | "employee" | "client";

type CreateAuthFixtureOptions = {
    confirmed?: boolean;
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    role?: AuthRole | null;
    totpEnabled?: boolean;
    withResetPasswordToken?: boolean;
};

export type AuthFixture = {
    companyId: number | null;
    confirmed: boolean;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    resetPasswordToken: string | null;
    role: AuthRole | null;
    totpEnabled: boolean;
    userId: number;
};

let authCounter = 0;

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
        },
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

export function uniqueAuthEmail(prefix = "e2e-public-forms"): string {
    authCounter += 1;
    return `${prefix}-${Date.now().toString(36)}-${process.pid}-${authCounter}-${randomUUID().slice(0, 8)}@example.com`;
}

export async function createAuthFixture(
    options: CreateAuthFixtureOptions = {},
): Promise<AuthFixture> {
    const fixture = {
        confirmed: options.confirmed ?? true,
        email: options.email || uniqueAuthEmail(),
        firstName: options.firstName || "Codex",
        lastName: options.lastName || "Tester",
        password: options.password || DISPOSABLE_AUTH_PASSWORD,
        role: options.role ?? null,
        totpEnabled: options.totpEnabled ?? false,
        withResetPasswordToken: options.withResetPasswordToken ?? false,
    };

    const rubyCode = `
require "json"

company = nil

if ${fixture.role ? "true" : "false"}
      company = Company.create!(
        name: "AuthWS-#{Time.now.to_i}-#{rand(999)}",
    business_phone: "+12125551234",
    base_currency: "USD",
    standard_price: 100,
    fiscal_year_end: "December",
    date_format: "MM-DD-YYYY",
    country: "US",
    timezone: "Eastern Time (US & Canada)",
    working_days: "5",
    working_hours: "40"
  )

  company.addresses.create!(
    address_type: "current",
    address_line_1: "100 Test Street",
    address_line_2: "Suite 200",
    city: "Brooklyn",
    state: "NY",
    country: "US",
    pin: "11201"
  )
end

user = User.create!(
  first_name: ${rubyLiteral(fixture.firstName)},
  last_name: ${rubyLiteral(fixture.lastName)},
  email: ${rubyLiteral(fixture.email)},
  password: ${rubyLiteral(fixture.password)},
  password_confirmation: ${rubyLiteral(fixture.password)},
  confirmed_at: ${fixture.confirmed ? "Time.current" : "nil"},
  locale: "en-US",
  current_workspace_id: company&.id
)

if company
  Employment.create!(company: company, user: user)
  user.add_role(${rubyLiteral(fixture.role)}, company)
  user.update!(current_workspace_id: company.id)
end

if ${fixture.totpEnabled ? "true" : "false"}
  user.update!(
    otp_secret: ::ROTP::Base32.random_base32,
    otp_required_for_login: true
  )
end

reset_password_token = ${fixture.withResetPasswordToken ? "user.send(:set_reset_password_token)" : "nil"}

puts({
  companyId: company&.id,
  confirmed: user.confirmed?,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  password: ${rubyLiteral(fixture.password)},
  resetPasswordToken: reset_password_token,
  role: ${rubyLiteral(fixture.role)},
  totpEnabled: user.totp_enabled?,
  userId: user.id
}.to_json)
`;

    return runRailsJson<AuthFixture>(rubyCode);
}

export async function deleteAuthFixture(
    fixture: Pick<AuthFixture, "companyId" | "userId"> | null | undefined,
) {
    if (!fixture) return;

    runRailsJson<{ deleted: boolean }>(`
require "json"

user = User.find_by(id: ${rubyLiteral(fixture.userId)})
user&.destroy!

company = Company.find_by(id: ${rubyLiteral(fixture.companyId)})
company&.destroy!

puts({ deleted: true }.to_json)
`);
}

export async function deleteUserByEmail(email: string) {
    runRailsJson<{ deleted: boolean }>(`
require "json"

user = User.find_by(email: ${rubyLiteral(email)})
user&.destroy!

puts({ deleted: true }.to_json)
`);
}

export async function getCurrentTotpCode(email: string) {
    const result = runRailsJson<{ code: string }>(`
require "json"

user = User.find_by!(email: ${rubyLiteral(email)})
code = ::ROTP::TOTP.new(user.otp_secret, issuer: User::TOTP_ISSUER).now

puts({ code: code }.to_json)
`);

    return result.code;
}

export async function goToSignIn(page: Page, path = "/user/sign_in") {
    await page.goto(path);
    await expect(
        page.getByRole("heading", { name: /sign in to your workspace/i }),
    ).toBeVisible({ timeout: 15_000 });
}

export async function goToSignUp(page: Page) {
    await page.goto("/signup");
    await expect(
        page.getByRole("heading", { name: /create your workspace/i }),
    ).toBeVisible({ timeout: 15_000 });
}

export async function goToForgotPassword(page: Page) {
    await page.goto("/password/new");
    await expect(
        page.getByRole("heading", { name: /forgot password/i }),
    ).toBeVisible({ timeout: 15_000 });
}

export async function goToResetPassword(
    page: Page,
    resetPasswordToken = "invalid-token",
) {
    await page.goto(
        `/password/edit?reset_password_token=${encodeURIComponent(
            resetPasswordToken,
        )}`,
    );
    await expect(
        page.getByRole("heading", { name: /reset password/i }),
    ).toBeVisible({ timeout: 15_000 });
}

export async function goToEmailConfirmation(
    page: Page,
    email = "codex@example.com",
) {
    await page.goto(
        `/email_confirmation?email=${encodeURIComponent(email)}`,
    );
    await expect(
        page.getByRole("heading", { name: /email verification/i }),
    ).toBeVisible({ timeout: 15_000 });
}

export async function goToEmailVerificationSuccess(page: Page) {
    await page.goto("/email_verification_success");
    await expect(
        page.getByRole("heading", { name: /email verification successful/i }),
    ).toBeVisible({ timeout: 15_000 });
}

export async function fillSignInForm(
    page: Page,
    values: { email?: string; password?: string },
) {
    if (values.email !== undefined) {
        await page.getByLabel(/^Email$/i).fill(values.email);
    }

    if (values.password !== undefined) {
        await page.getByLabel(/^Password$/i).fill(values.password);
    }
}

export async function fillSignUpForm(
    page: Page,
    values: {
        confirmPassword?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        password?: string;
        agreeToTerms?: boolean;
    },
) {
    if (values.firstName !== undefined) {
        await page.getByLabel(/first name/i).fill(values.firstName);
    }

    if (values.lastName !== undefined) {
        await page.getByLabel(/last name/i).fill(values.lastName);
    }

    if (values.email !== undefined) {
        await page.getByLabel(/^Email$/i).fill(values.email);
    }

    if (values.password !== undefined) {
        await page.getByLabel(/^Password$/i).fill(values.password);
    }

    if (values.confirmPassword !== undefined) {
        await page
            .getByLabel(/confirm password/i)
            .fill(values.confirmPassword);
    }

    if (values.agreeToTerms !== undefined) {
        const checkbox = page.locator("#termsOfService");
        const isChecked = await checkbox.isChecked();

        if (isChecked !== values.agreeToTerms) {
            await checkbox.focus();
            await page.keyboard.press("Space");
        }
    }
}

export async function signInAs(
    page: Page,
    email: string,
    password = TEST_PASSWORD,
) {
    await goToSignIn(page);
    await fillSignInForm(page, { email, password });
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(/\/(dashboard|payments|time-tracking|invoices)/, {
        timeout: 15_000,
    });
}

export async function signInWithSeedUser(
    page: Page,
    email = "supriya@saeloun.com",
) {
    for (const password of SEED_PASSWORD_CANDIDATES) {
        await goToSignIn(page);
        await fillSignInForm(page, { email, password });
        await page.getByRole("button", { name: /^sign in$/i }).click();

        try {
            await page.waitForURL(/\/(dashboard|payments|time-tracking|invoices)/, {
                timeout: 8_000,
            });
            return password;
        } catch {
            const invalidCredentials = await page
                .getByText(/invalid email or password/i)
                .first()
                .isVisible()
                .catch(() => false);

            if (!invalidCredentials) {
                throw new Error(
                    `Seed sign-in failed before credential validation using password candidate "${password}"`,
                );
            }
        }
    }

    throw new Error(
        "Unable to sign in with the seeded admin account using the known local password candidates.",
    );
}

export async function expectToast(page: Page, text: string | RegExp) {
    const toast = page
        .locator("[data-sonner-toast]")
        .filter({ hasText: text })
        .first();
    await expect(toast).toBeVisible({ timeout: 10_000 });
}

export async function mockAuthenticatedDashboard(
    page: Page,
    email = "passkey@example.com",
) {
    await page.route("**/api/v1/dashboard/activities**", route =>
        route.fulfill({
            body: JSON.stringify({
                activities: [],
                has_more: false,
                total_count: 0,
            }),
            contentType: "application/json",
            status: 200,
        }),
    );

    await page.route("**/api/v1/dashboard", route =>
        route.fulfill({
            body: JSON.stringify({
                meta: { currency: "USD" },
                revenue_by_customer: [
                    {
                        id: 1,
                        name: "Codex Client",
                        percentage: 100,
                        revenue: 12_500,
                    },
                ],
                revenue_chart: [
                    {
                        invoices: 3,
                        month: "Apr",
                        monthly_revenue: 12_500,
                        revenue: 12_500,
                    },
                ],
                stats: {
                    active_projects: 2,
                    billable_hours: 160,
                    currency: "USD",
                    hours_trend: 12,
                    projects_trend: 20,
                    revenue_trend: 18,
                    team_size: 5,
                    total_revenue: 12_500,
                },
            }),
            contentType: "application/json",
            status: 200,
        }),
    );

    await page.route("**/api/v1/users/_me", route =>
        route.fulfill({
            body: JSON.stringify({
                company: {
                    id: 999,
                    name: "Codex Workspace",
                },
                company_role: "admin",
                user: {
                    current_workspace_id: 999,
                    email,
                    first_name: "Codex",
                    id: 999,
                    last_name: "Tester",
                    locale: "en-US",
                    token: "mock-token",
                },
            }),
            contentType: "application/json",
            status: 200,
        }),
    );
}

export function parseColor(color: string) {
    const rgbaMatch = color.match(
        /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/,
    );

    if (rgbaMatch) {
        return {
            a: Number(rgbaMatch[4]),
            b: Number(rgbaMatch[3]),
            g: Number(rgbaMatch[2]),
            r: Number(rgbaMatch[1]),
        };
    }

    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

    if (rgbMatch) {
        return {
            a: 1,
            b: Number(rgbMatch[3]),
            g: Number(rgbMatch[2]),
            r: Number(rgbMatch[1]),
        };
    }

    const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);

    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
            hex = hex
                .split("")
                .map(character => `${character}${character}`)
                .join("");
        }

        return {
            a: 1,
            b: parseInt(hex.slice(4, 6), 16),
            g: parseInt(hex.slice(2, 4), 16),
            r: parseInt(hex.slice(0, 2), 16),
        };
    }

    return null;
}

function alphaBlend(
    foreground: { a: number; b: number; g: number; r: number },
    background: { a: number; b: number; g: number; r: number },
) {
    let backgroundRed = background.r;
    let backgroundGreen = background.g;
    let backgroundBlue = background.b;

    if (background.a < 1) {
        backgroundRed = Math.round(background.r * background.a + 255 * (1 - background.a));
        backgroundGreen = Math.round(background.g * background.a + 255 * (1 - background.a));
        backgroundBlue = Math.round(background.b * background.a + 255 * (1 - background.a));
    }

    return {
        b: Math.round(foreground.b * foreground.a + backgroundBlue * (1 - foreground.a)),
        g: Math.round(foreground.g * foreground.a + backgroundGreen * (1 - foreground.a)),
        r: Math.round(foreground.r * foreground.a + backgroundRed * (1 - foreground.a)),
    };
}

export function relativeLuminance(color: { b: number; g: number; r: number }) {
    const [red, green, blue] = [color.r, color.g, color.b].map(channel => {
        const scaled = channel / 255;
        return scaled <= 0.03928
            ? scaled / 12.92
            : Math.pow((scaled + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(
    foregroundColor: string,
    backgroundColor: string,
) {
    const foreground = parseColor(foregroundColor);
    const background = parseColor(backgroundColor);

    if (!foreground || !background) return 1;

    const resolvedBackground = alphaBlend(background, {
        a: 1,
        b: 255,
        g: 255,
        r: 255,
    });
    const resolvedForeground = alphaBlend(foreground, {
        ...resolvedBackground,
        a: 1,
    });

    const first = relativeLuminance(resolvedForeground);
    const second = relativeLuminance(resolvedBackground);
    const lighter = Math.max(first, second);
    const darker = Math.min(first, second);

    return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3;

export async function getElementContrast(page: Page, locator: Locator) {
    return locator.evaluate(element => {
        const style = getComputedStyle(element);
        const foregroundColor = style.color;

        let backgroundColor = style.backgroundColor;
        let currentElement = element.parentElement;

        while (
            currentElement &&
            (backgroundColor === "rgba(0, 0, 0, 0)" ||
                backgroundColor === "transparent")
        ) {
            backgroundColor = getComputedStyle(currentElement).backgroundColor;
            currentElement = currentElement.parentElement;
        }

        if (
            backgroundColor === "rgba(0, 0, 0, 0)" ||
            backgroundColor === "transparent"
        ) {
            backgroundColor = "rgb(255, 255, 255)";
        }

        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const isLargeText =
            fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);

        return {
            backgroundColor,
            fontSize,
            fontWeight,
            foregroundColor,
            isLargeText,
        };
    });
}
