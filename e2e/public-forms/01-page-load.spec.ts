import { expect, test } from "@playwright/test";
import {
    goToEmailConfirmation,
    goToForgotPassword,
    goToResetPassword,
    goToSignIn,
    goToSignUp,
} from "./helpers";

test.describe("Public Forms - Page Load", () => {
    test("root and /login both land on the sign-in form", async ({ page }) => {
        await page.goto("/");
        await page.waitForURL(/\/user\/sign_in$/, { timeout: 15_000 });
        await expect(
            page.getByRole("heading", { name: /sign in to your workspace/i }),
        ).toBeVisible();

        await goToSignIn(page, "/login");
        await expect(
            page.getByRole("button", { name: /continue with google/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: /continue with github/i }),
        ).toBeVisible();
        await expect(page.locator("#auth-locale")).toBeVisible();
    });

    test("sign-up route renders all public account creation controls", async ({
        page,
    }) => {
        await goToSignUp(page);

        await expect(page.getByLabel(/first name/i)).toBeVisible();
        await expect(page.getByLabel(/last name/i)).toBeVisible();
        await expect(page.getByLabel(/^email$/i)).toBeVisible();
        await expect(page.getByLabel(/^password$/i)).toBeVisible();
        await expect(page.getByLabel(/confirm password/i)).toBeVisible();
        await expect(page.locator("#termsOfService")).toBeVisible();
        await expect(
            page.getByRole("button", { name: /create account/i }),
        ).toBeVisible();
    });

    test("forgot and reset password routes render their recovery forms", async ({
        page,
    }) => {
        await goToForgotPassword(page);
        await expect(page.locator("#email")).toBeVisible();
        await expect(
            page.getByRole("button", { name: /send reset link/i }),
        ).toBeVisible();
        await expect(page.getByRole("link", { name: /back to login/i })).toBeVisible();

        await goToResetPassword(page);
        await expect(page.getByLabel(/^password$/i)).toBeVisible();
        await expect(page.getByLabel(/confirm password/i)).toBeVisible();
        await expect(
            page.getByRole("button", { name: /^reset password$/i }),
        ).toBeDisabled();
    });

    test("email confirmation page renders the email-aware resend state", async ({
        page,
    }) => {
        await goToEmailConfirmation(page, "public.forms@example.com");

        await expect(
            page.getByText(/public\.forms@example\.com/i),
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: /resend/i }),
        ).toBeVisible();
    });

    test("public auth routes link cleanly between sign in, sign up, and recovery", async ({
        page,
    }) => {
        await goToSignIn(page);
        await page.getByRole("link", { name: /forgot password/i }).click();
        await expect(page).toHaveURL(/\/password\/new$/);

        await page.getByRole("link", { name: /back to login/i }).click();
        await expect(page).toHaveURL(/\/login$/);

        await page.getByRole("link", { name: /sign up/i }).click();
        await expect(page).toHaveURL(/\/signup$/);
    });
});
