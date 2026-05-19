/**
 * Tests for the stored auth token fallback behavior.
 *
 * When a user has authToken + authEmail in localStorage but no active
 * session cookie, the app should still authenticate via X-Auth-Token
 * headers and load protected pages without redirecting to sign-in.
 */
import { expect, test } from "@playwright/test";
import { TEST_PASSWORD } from "../helpers";

test.describe("Public Forms - Token Fallback Auth", () => {
    test.use({ storageState: undefined }); // Start with no session

    test("app loads a protected page when only localStorage credentials are present", async ({
        page,
    }) => {
        // First, sign in via API to get a valid token
        const loginRes = await page.request.post("/api/v1/users/login", {
            data: {
                user: {
                    email: "vipul@saeloun.com",
                    password: TEST_PASSWORD,
                    locale: "en-US",
                },
            },
        });

        expect(loginRes.ok(), `Login failed: ${loginRes.status()}`).toBeTruthy();
        const payload = await loginRes.json();
        const token = payload.user?.token;
        const email = payload.user?.email;
        expect(token).toBeTruthy();
        expect(email).toBeTruthy();

        // Navigate to a blank page to set up localStorage without any session
        await page.goto("/login");
        await page.waitForLoadState("domcontentloaded");

        // Clear all cookies (remove session) but set localStorage credentials
        await page.context().clearCookies();
        await page.evaluate(
            ({ token, email }) => {
                window.localStorage.clear();
                window.sessionStorage.clear();
                window.localStorage.setItem("authToken", JSON.stringify(token));
                window.localStorage.setItem("authEmail", JSON.stringify(email));
            },
            { token, email },
        );

        // Navigate to a protected page
        await page.goto("/time-tracking");

        // Should NOT redirect to sign-in — the token fallback should authenticate
        await expect(page).not.toHaveURL(/\/login|\/sign_in/, { timeout: 15_000 });

        // Should load the time tracking page content
        await expect(
            page.getByRole("heading", { name: /time tracking/i }),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("app redirects to sign-in when localStorage has invalid token", async ({
        page,
    }) => {
        await page.goto("/login");
        await page.waitForLoadState("domcontentloaded");

        // Clear cookies and set invalid localStorage credentials
        await page.context().clearCookies();
        await page.evaluate(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.localStorage.setItem("authToken", JSON.stringify("invalid-token-xyz"));
            window.localStorage.setItem("authEmail", JSON.stringify("nonexistent@example.com"));
        });

        // Navigate to a protected page
        await page.goto("/dashboard");

        // Should eventually redirect to sign-in since the token is invalid
        await expect(page).toHaveURL(/\/login|\/sign_in|user\/sign_in/, { timeout: 15_000 });
    });

    test("legacy session marker is not treated as a valid token", async ({
        page,
    }) => {
        await page.goto("/login");
        await page.waitForLoadState("domcontentloaded");

        // Set the legacy "session" marker — this should NOT be sent as X-Auth-Token
        await page.context().clearCookies();
        await page.evaluate(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.localStorage.setItem("authToken", JSON.stringify("session"));
            window.localStorage.setItem("authEmail", JSON.stringify("vipul@saeloun.com"));
        });

        // Navigate to a protected page
        await page.goto("/dashboard");

        // With "session" as token and no cookie, should redirect to sign-in
        await expect(page).toHaveURL(/\/login|\/sign_in|user\/sign_in/, { timeout: 15_000 });
    });
});
