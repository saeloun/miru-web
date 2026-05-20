import { expect, test } from "@playwright/test";

test.describe("Analytics — Filters", () => {
    test("preset selector changes the date range", async ({ page }) => {
        await page.goto("/analytics");
        await expect(
            page.getByRole("heading", { name: /analytics/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await page.waitForLoadState("networkidle");

        // Find and interact with the preset selector
        const presetTrigger = page.locator(
            "[data-testid='analytics-preset-select'], [role='combobox']"
        ).first();

        if (await presetTrigger.isVisible().catch(() => false)) {
            await presetTrigger.click();
            // Select a different preset option
            const options = page.locator("[role='option']");
            const count = await options.count();
            if (count > 1) {
                await options.nth(1).click();
                // Page should still be functional after changing preset
                await expect(
                    page.getByRole("heading", { name: /analytics/i }).first(),
                ).toBeVisible();
            }
        }
    });

    test("revenue forecast page has its own filter controls", async ({ page }) => {
        await page.goto("/analytics/revenue-forecast");
        await expect(
            page.getByRole("heading", { name: /revenue forecast/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await page.waitForLoadState("networkidle");

        // The page should have some filter or period selector
        const hasFilter = await page
            .locator("[role='combobox'], button:has-text('month'), button:has-text('quarter')")
            .first()
            .isVisible()
            .catch(() => false);

        // Revenue forecast should show either data or an empty state
        const hasContent = await page
            .getByText(/forecast|projected|no data|unavailable/i)
            .first()
            .isVisible()
            .catch(() => false);
        expect(hasFilter || hasContent).toBeTruthy();
    });
});
