import { expect, test } from "@playwright/test";

test.describe("Employment Settings — Edit Navigation", () => {
    test("clicking edit navigates to edit page", async ({ page }) => {
        await page.goto("/settings/employment");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText(/employment details/i).first(),
        ).toBeVisible({ timeout: 15_000 });

        const editBtn = page.getByRole("button", { name: /edit/i }).first();
        const editLink = page.getByRole("link", { name: /edit/i }).first();
        const editElement = editBtn.or(editLink);

        await expect(editElement).toBeVisible({ timeout: 10_000 });
        await editElement.click();

        await expect(page).toHaveURL(/\/settings\/employment\/edit/);
    });

    test("edit page has form fields", async ({ page }) => {
        await page.goto("/settings/employment/edit");
        await page.waitForLoadState("networkidle");

        // Should show the employment edit form with input fields
        await expect(
            page.getByText(/employment details/i).first(),
        ).toBeVisible({ timeout: 15_000 });

        // Should have at least one input or select field
        const hasFormFields = await page
            .locator("input, select, [role='combobox']")
            .first()
            .isVisible()
            .catch(() => false);
        expect(hasFormFields).toBeTruthy();
    });
});
