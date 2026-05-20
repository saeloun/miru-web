import { expect, test } from "@playwright/test";
import {
    createAuthFixture,
    deleteAuthFixture,
    deleteUserByEmail,
    fillSignUpForm,
    goToSignUp,
    uniqueAuthEmail,
} from "./helpers";

test.describe("Public Forms - Sign Up", () => {
    test("new users can sign up and are redirected to email confirmation", async ({
        page,
    }) => {
        const email = uniqueAuthEmail("e2e-signup-success");
        const password = `MiruSignup!${Date.now().toString(36)}Aa1`;

        try {
            await goToSignUp(page);
            await fillSignUpForm(page, {
                agreeToTerms: true,
                confirmPassword: password,
                email,
                firstName: "Codex",
                lastName: "Signup",
                password,
            });

            await page.getByRole("button", { name: /create account/i }).click();

            await expect(page).toHaveURL(/\/email_confirmation\?email=/);
            await expect(page.getByText(email)).toBeVisible();
        } finally {
            await deleteUserByEmail(email);
        }
    });

    test("existing emails show the backend duplicate-email validation", async ({
        page,
    }) => {
        const password = `MiruSignup!${Date.now().toString(36)}Aa1`;
        const fixture = await createAuthFixture({
            confirmed: true,
            role: null,
        });

        try {
            await goToSignUp(page);
            await fillSignUpForm(page, {
                agreeToTerms: true,
                confirmPassword: password,
                email: fixture.email,
                firstName: "Codex",
                lastName: "Duplicate",
                password,
            });

            await page.getByRole("button", { name: /create account/i }).click();

            await expect(
                page.getByText(/email id already exists/i).first(),
            ).toBeVisible();
        } finally {
            await deleteAuthFixture(fixture);
        }
    });

    test("client-side validation protects required fields, formatting, and terms", async ({
        page,
    }) => {
        await goToSignUp(page);
        await fillSignUpForm(page, {
            agreeToTerms: false,
            confirmPassword: "Different123!",
            email: "bad-email",
            firstName: "Codex1",
            lastName: "Tester2",
            password: "short",
        });

        await page.getByRole("button", { name: /create account/i }).click();

        await expect(
            page.getByText(/first name must contain only letters/i),
        ).toBeVisible();
        await expect(
            page.getByText(/last name must contain only letters/i),
        ).toBeVisible();
        await expect(
            page.getByText(/invalid email address/i),
        ).toBeVisible();
        await expect(
            page.getByText(/password must be at least 8 characters/i).first(),
        ).toBeVisible();
        await expect(
            page.getByText(/passwords must match/i),
        ).toBeVisible();
    });

    test("terms and privacy modals can be opened and dismissed from sign-up", async ({
        page,
    }) => {
        await goToSignUp(page);

        await page.getByRole("button", { name: /terms of service/i }).click();
        await expect(
            page.getByRole("heading", { name: /terms of service/i }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(
            page.getByRole("heading", { name: /terms of service/i }),
        ).not.toBeVisible();

        await page.getByRole("button", { name: /privacy policy/i }).click();
        await expect(
            page.getByRole("heading", {
                name: /privacy policy for miru inc/i,
            }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(
            page.getByRole("heading", {
                name: /privacy policy for miru inc/i,
            }),
        ).not.toBeVisible();
    });
});
