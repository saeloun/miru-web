/**
 * Navigation test helpers.
 */
import { Locator, Page, expect, request } from "@playwright/test";
import { TEST_PASSWORD } from "../helpers";

const BASE_URL = "http://127.0.0.1:3000";

export type SeedRole = "owner" | "admin" | "book_keeper" | "employee" | "client";

const ROLE_AUTH_STATE_CACHE: Partial<Record<SeedRole, { cookies: any[] }>> = {};

export const SEED_ROLE_USERS: Record<
    SeedRole,
    {
        defaultPath: string;
        defaultUrlPattern: RegExp;
        email: string;
        label: string;
    }
> = {
    owner: {
        defaultPath: "/dashboard",
        defaultUrlPattern: /\/dashboard$/,
        email: "vipul@saeloun.com",
        label: "Owner",
    },
    admin: {
        defaultPath: "/dashboard",
        defaultUrlPattern: /\/dashboard$/,
        email: "supriya@saeloun.com",
        label: "Admin",
    },
    book_keeper: {
        defaultPath: "/payments",
        defaultUrlPattern: /\/payments$/,
        email: "accounts@saeloun.com",
        label: "Book Keeper",
    },
    employee: {
        defaultPath: "/time-tracking",
        defaultUrlPattern: /\/time-tracking$/,
        email: "sonam@saeloun.com",
        label: "Employee",
    },
    client: {
        defaultPath: "/invoices",
        defaultUrlPattern: /\/invoices(?:$|[/?#])/,
        email: "oliver@example.com",
        label: "Client",
    },
};

export async function signInAsSeedUser(
    page: Page,
    role: SeedRole,
    password = TEST_PASSWORD,
) {
    const user = SEED_ROLE_USERS[role];

    const cachedState = ROLE_AUTH_STATE_CACHE[role];
    await page.context().clearCookies();
    await page.goto("/user/sign_in");
    await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
    });

    if (cachedState?.cookies?.length) {
        await page.context().addCookies(cachedState.cookies);
        await page.goto("/");

        try {
            await page.waitForURL(user.defaultUrlPattern, { timeout: 5_000 });
            return;
        } catch {
            ROLE_AUTH_STATE_CACHE[role] = undefined;
            await page.context().clearCookies();
        }
    }

    const apiContext = await request.newContext({
        baseURL: BASE_URL,
    });

    try {
        const response = await apiContext.post("/api/v1/users/login", {
            data: {
                user: {
                    email: user.email,
                    locale: "en-US",
                    password,
                },
            },
        });

        expect(
            response.ok(),
            `${user.label} login failed with status ${response.status()}`,
        ).toBeTruthy();

        const body = await response.json();
        expect(body.requires_passkey).not.toBeTruthy();
        expect(body.requires_totp).not.toBeTruthy();
        expect(body.company_role).toBe(role);

        const requestState = await apiContext.storageState();
        ROLE_AUTH_STATE_CACHE[role] = {
            cookies: requestState.cookies,
        };
        await page.context().addCookies(requestState.cookies);
    } finally {
        await apiContext.dispose();
    }

    await page.goto("/");
    await page.waitForURL(user.defaultUrlPattern, { timeout: 15_000 });
}

export async function expectVisibleHref(page: Page, href: string) {
    await expect(page.locator(`a[href="${href}"]:visible`).first()).toBeVisible({
        timeout: 15_000,
    });
}

export async function expectHiddenHref(page: Page, href: string) {
    await expect(page.locator(`a[href="${href}"]:visible`)).toHaveCount(0);
}

export async function goToAndExpectResolvedRoute(
    page: Page,
    path: string,
    expectedUrlPattern: RegExp,
    readyLocator?: Locator,
) {
    await page.goto(path);
    await page.waitForURL(expectedUrlPattern, { timeout: 15_000 });

    if (readyLocator) {
        await expect(readyLocator).toBeVisible({ timeout: 15_000 });
    }
}

/**
 * Navigate to a page and verify it doesn't 404.
 * Checks that the page loads without showing a "not found" or error state.
 */
export async function expectValidRoute(page: Page, path: string) {
    await page.goto(path);
    await page.waitForLoadState("domcontentloaded");

    // Give the SPA router time to settle
    await page.waitForTimeout(1_000);

    const url = page.url();
    const bodyText = await page.locator("body").innerText();

    // Check the URL didn't redirect to a catch-all 404 page
    const is404 = bodyText.match(/not found|404|page doesn't exist|no match/i) &&
        !bodyText.match(/no results|no clients|no projects|no team|no invoices|no entries/i);

    return { url, is404: Boolean(is404), bodyText };
}
