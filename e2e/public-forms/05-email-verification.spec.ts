import { expect, test } from "@playwright/test";
import {
    createAuthFixture,
    deleteAuthFixture,
    expectToast,
    goToEmailConfirmation,
    goToEmailVerificationSuccess,
} from "./helpers";

test.describe("Public Forms - Email Verification", () => {
    test("email confirmation page can resend confirmation instructions", async ({
        page,
    }) => {
        const fixture = await createAuthFixture({ confirmed: false });

        try {
            await goToEmailConfirmation(page, fixture.email);
            await page.getByRole("button", { name: /resend/i }).click();

            await expectToast(
                page,
                new RegExp(`A confirmation email has been sent to ${fixture.email}`, "i"),
            );
        } finally {
            await deleteAuthFixture(fixture);
        }
    });

    test("email verification success returns users to sign in", async ({
        page,
    }) => {
        await goToEmailVerificationSuccess(page);
        await page.getByRole("button", { name: /continue/i }).click();

        await page.waitForURL(/\/user\/sign_in$/, { timeout: 15_000 });
        await expect(page).toHaveURL(/\/user\/sign_in$/);
    });
});
