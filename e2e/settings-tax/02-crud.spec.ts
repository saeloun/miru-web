import { expect, test } from "@playwright/test";

test.describe("Tax Configuration Settings — CRUD", () => {
    test("can create a percentage tax configuration", async ({ page }) => {
        await page.goto("/settings/tax-configuration");
        await page.waitForLoadState("networkidle");
        await expect(page.locator("#tax-name")).toBeVisible({ timeout: 15_000 });

        const taxName = `E2E Tax ${Date.now()}`;

        // Fill the form
        await page.locator("#tax-name").fill(taxName);
        await page.locator("#tax-value").fill("18");

        // Submit
        await page.getByRole("button", { name: /save/i }).click();

        // The new tax should appear in the list
        await expect(page.getByText(taxName)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText("18%")).toBeVisible();
    });

    test("can create a flat amount tax configuration", async ({ page }) => {
        await page.goto("/settings/tax-configuration");
        await page.waitForLoadState("networkidle");
        await expect(page.locator("#tax-name")).toBeVisible({ timeout: 15_000 });

        const taxName = `E2E Flat Tax ${Date.now()}`;

        // Fill the form
        await page.locator("#tax-name").fill(taxName);

        // Change type to flat
        const selectTrigger = page.locator("[role='combobox']").first();
        await selectTrigger.click();
        await page.getByRole("option", { name: /flat amount/i }).click();

        await page.locator("#tax-value").fill("25");

        // Submit
        await page.getByRole("button", { name: /save/i }).click();

        // The new tax should appear in the list
        await expect(page.getByText(taxName)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(/flat 25/i)).toBeVisible();
    });

    test("can delete a tax configuration", async ({ page }) => {
        await page.goto("/settings/tax-configuration");
        await page.waitForLoadState("networkidle");
        await expect(page.locator("#tax-name")).toBeVisible({ timeout: 15_000 });

        const taxName = `E2E Delete Tax ${Date.now()}`;

        // Create one first
        await page.locator("#tax-name").fill(taxName);
        await page.locator("#tax-value").fill("5");
        await page.getByRole("button", { name: /save/i }).click();
        await expect(page.getByText(taxName)).toBeVisible({ timeout: 10_000 });

        // Delete it
        const row = page.locator("div").filter({ hasText: taxName }).last();
        await row.getByRole("button", { name: /delete/i }).click();

        // Should be gone
        await expect(page.getByText(taxName)).not.toBeVisible({ timeout: 10_000 });
    });

    test("form resets after successful save", async ({ page }) => {
        await page.goto("/settings/tax-configuration");
        await page.waitForLoadState("networkidle");
        await expect(page.locator("#tax-name")).toBeVisible({ timeout: 15_000 });

        const taxName = `E2E Reset ${Date.now()}`;

        await page.locator("#tax-name").fill(taxName);
        await page.locator("#tax-value").fill("10");
        await page.getByRole("button", { name: /save/i }).click();

        // After save, the name field should be cleared
        await expect(page.locator("#tax-name")).toHaveValue("", { timeout: 10_000 });
    });
});
