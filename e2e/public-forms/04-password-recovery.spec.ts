import { expect, test } from "@playwright/test";
import {
    createAuthFixture,
    deleteAuthFixture,
    expectToast,
    goToForgotPassword,
    goToResetPassword,
    uniqueAuthEmail,
} from "./helpers";

test.describe("Public Forms - Password Recovery", () => {
    test("existing users can request a reset link and resend it", async ({
        page,
    }) => {
        const fixture = await createAuthFixture({ confirmed: true });

        try {
            await goToForgotPassword(page);
            await page.locator("#email").fill(fixture.email);
            await page
                .getByRole("button", { name: /send reset link/i })
                .click();

            await expect(
                page.getByRole("heading", {
                    name: /password reset link sent/i,
                }),
            ).toBeVisible();
            await expect(page.getByText(fixture.email)).toBeVisible();

            await page.getByRole("button", { name: /resend/i }).click();
            await expectToast(
                page,
                /instructions for resetting your password have been sent to your email/i,
            );
        } finally {
            await deleteAuthFixture(fixture);
        }
    });

    test("unknown emails still get the generic forgot-password success state", async ({
        page,
    }) => {
        const email = uniqueAuthEmail("forgot-password-unknown");

        await goToForgotPassword(page);
        await page.locator("#email").fill(email);
        await page.getByRole("button", { name: /send reset link/i }).click();

        await expect(
            page.getByRole("heading", { name: /password reset link sent/i }),
        ).toBeVisible();
        await expect(page.getByText(email)).toBeVisible();
    });

    test("forgot-password validation catches malformed email input", async ({
        page,
    }) => {
        await goToForgotPassword(page);
        await page.locator("#email").fill("bad-email");
        await page.getByRole("button", { name: /send reset link/i }).click();

        await expect(page.getByText(/invalid email id/i)).toBeVisible();
    });

    test("reset password surfaces server errors for invalid tokens", async ({
        page,
    }) => {
        await goToResetPassword(page, "not-a-real-token");
        await page.getByLabel(/^password$/i).fill("Password123!");
        await page.getByLabel(/confirm password/i).fill("Password123!");

        await page
            .getByRole("button", { name: /^reset password$/i })
            .click();

        await expect(
            page.getByText(/reset password token is invalid/i).first(),
        ).toBeVisible();
    });

    test("valid reset-password tokens update the password and return to dashboard", async ({
        page,
    }) => {
        const newPassword = `MiruReset!${Date.now().toString(36)}Aa1`;
        const fixture = await createAuthFixture({
            confirmed: true,
            role: "admin",
            withResetPasswordToken: true,
        });

        try {
            await goToResetPassword(page, fixture.resetPasswordToken || "");
            await page.getByLabel(/^password$/i).fill(newPassword);
            await page
                .getByLabel(/confirm password/i)
                .fill(newPassword);

            await page
                .getByRole("button", { name: /^reset password$/i })
                .click();

            await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });
            await expect(page).toHaveURL(/\/dashboard$/);
        } finally {
            await deleteAuthFixture(fixture);
        }
    });
});
