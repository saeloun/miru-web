import { expect, test } from "@playwright/test";
import {
    WCAG_AA_LARGE,
    WCAG_AA_NORMAL,
    contrastRatio,
    fillSignInForm,
    fillSignUpForm,
    getElementContrast,
    goToEmailConfirmation,
    goToSignIn,
    goToSignUp,
} from "./helpers";

async function expectAccessibleContrast(page, locator, label: string) {
    await expect(locator).toBeVisible();

    const { backgroundColor, foregroundColor, isLargeText } =
        await getElementContrast(page, locator);
    const ratio = contrastRatio(foregroundColor, backgroundColor);
    const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;

    expect(
        ratio,
        `${label} contrast ${ratio.toFixed(2)} is below ${threshold} (fg=${foregroundColor}, bg=${backgroundColor})`,
    ).toBeGreaterThanOrEqual(threshold);
}

test.describe("Public Forms - Contrast", () => {
    test("sign-in heading meets WCAG AA contrast", async ({ page }) => {
        await goToSignIn(page);
        await expectAccessibleContrast(
            page,
            page.getByRole("heading", { name: /sign in to your workspace/i }),
            "sign-in heading",
        );
    });

    test("sign-in description text meets WCAG AA contrast", async ({ page }) => {
        await goToSignIn(page);
        await expectAccessibleContrast(
            page,
            page.getByText(/track work, send invoices, and keep cash flow clear/i),
            "sign-in description",
        );
    });

    test("enabled sign-in button text meets WCAG AA contrast", async ({
        page,
    }) => {
        await goToSignIn(page);
        await fillSignInForm(page, {
            email: "vipul@saeloun.com",
            password: "Password123!",
        });

        await expectAccessibleContrast(
            page,
            page.getByRole("button", { name: /^sign in$/i }),
            "sign-in submit button",
        );
    });

    test("sign-up legal links meet WCAG AA contrast", async ({ page }) => {
        await goToSignUp(page);
        await fillSignUpForm(page, {
            agreeToTerms: false,
            confirmPassword: "Password123!",
            email: "contrast@example.com",
            firstName: "Codex",
            lastName: "Contrast",
            password: "Password123!",
        });

        await expectAccessibleContrast(
            page,
            page.getByRole("button", { name: /^terms of service$/i }).first(),
            "sign-up terms link",
        );
        await expectAccessibleContrast(
            page,
            page.getByRole("button", { name: /^privacy policy$/i }).first(),
            "sign-up privacy link",
        );
    });

    test("email confirmation resend action meets WCAG AA contrast", async ({
        page,
    }) => {
        await goToEmailConfirmation(page, "contrast@example.com");
        await expectAccessibleContrast(
            page,
            page.getByRole("button", { name: /resend/i }),
            "email confirmation resend button",
        );
    });
});
