import { expect, test } from "@playwright/test";
import { goToForgotPassword, goToSignIn, goToSignUp } from "./helpers";

test.describe("Public Forms - Responsive & Accessibility", () => {
    test("mobile sign-in keeps the essential controls visible", async ({
        page,
    }) => {
        await page.setViewportSize({ height: 844, width: 390 });
        await goToSignIn(page);

        await expect(
            page.getByRole("heading", { name: /sign in to your workspace/i }),
        ).toBeVisible();
        await expect(page.getByLabel(/^email$/i)).toBeVisible();
        await expect(page.getByLabel(/^password$/i)).toBeVisible();
        await expect(
            page.getByRole("heading", {
                name: /one place for time, invoices, and payments/i,
            }),
        ).not.toBeVisible();
    });

    test("theme toggle and locale picker remain usable on public auth pages", async ({
        page,
    }) => {
        await goToSignIn(page);

        const themeToggle = page.getByRole("button", {
            name: /switch to .* mode/i,
        });
        await expect(themeToggle).toBeVisible();

        const initialTheme = await page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
        );
        await themeToggle.click();
        await expect
            .poll(() =>
                page.evaluate(() =>
                    document.documentElement.classList.contains("dark"),
                ),
            )
            .toBe(!initialTheme);

        const localePicker = page.locator("#auth-locale");
        await localePicker.selectOption("hi");
        await expect(localePicker).toHaveValue("hi");
    });

    test("sign-up controls expose accessible labels and password-toggle semantics", async ({
        page,
    }) => {
        await goToSignUp(page);

        const termsCheckbox = page.locator("#termsOfService");
        await termsCheckbox.focus();
        await page.keyboard.press("Space");
        await expect(termsCheckbox).toBeChecked();

        const passwordInput = page.locator("#password");
        await passwordInput.fill("Password123!");
        const visibilityButton = page.locator(
            "xpath=//input[@id='password']/following-sibling::button[1]",
        );
        await visibilityButton.focus();

        await expect(visibilityButton).toBeFocused();
        await expect(visibilityButton).toHaveAttribute("aria-label", "Show password");
        await expect(visibilityButton).toHaveAttribute("aria-pressed", "false");
    });

    test("forgot-password view keeps recovery navigation keyboard-accessible", async ({
        page,
    }) => {
        await goToForgotPassword(page);

        await page.locator("#email").focus();
        await page.keyboard.press("Tab");
        await expect(
            page.getByRole("button", { name: /send reset link/i }),
        ).toBeFocused();

        await page.keyboard.press("Tab");
        await expect(
            page.getByRole("link", { name: /back to login/i }),
        ).toBeFocused();
    });
});
