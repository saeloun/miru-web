import { expect, test } from "@playwright/test";

test.describe("Tax Configuration Settings — Page Load", () => {
    test("tax configuration page loads with heading", async ({ page }) => {
        await page.goto("/settings/tax-configuration");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByRole("heading", { name: /tax configuration/i }),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("tax name input field is present", async ({ page }) => {
        await page.goto("/settings/tax-configuration");
        await page.waitForLoadState("networkidle");

        await expect(page.locator("#tax-name")).toBeVisible({ timeout: 15_000 });
    });

    test("tax type selector is present with percentage and flat options", async ({ page }) => {
        await page.goto("/settings/tax-configuration");
        await page.waitForLoadState("networkidle");

        // The type select trigger should be visible
        const selectTrigger = page.locator("[role='combobox']").first();
        await expect(selectTrigger).toBeVisible({ timeout: 15_000 });

        await selectTrigger.click();
        await expect(page.getByRole("option", { name: /percentage/i })).toBeVisible();
        await expect(page.getByRole("option", { name: /flat amount/i })).toBeVisible();
    });

    test("tax value input field is present", async ({ page }) => {
        await page.goto("/settings/tax-configuration");
        await page.waitForLoadState("networkidle");

        await expect(page.locator("#tax-value")).toBeVisible({ timeout: 15_000 });
    });

    test("save button is present", async ({ page }) => {
        await page.goto("/settings/tax-configuration");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByRole("button", { name: /save/i }),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows empty state or existing configurations", async ({ page }) => {
        await page.goto("/settings/tax-configuration");
        await page.waitForLoadState("networkidle");

        // Should show either "No tax configurations yet" or a list of configs
        const emptyState = page.getByText(/no tax configurations yet/i);
        const configItem = page.locator(".divide-y > div").first();

        await expect(emptyState.or(configItem)).toBeVisible({ timeout: 15_000 });
    });
});
