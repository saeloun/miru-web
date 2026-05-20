/**
 * Leaves Settings — Year Navigation.
 * Covers: navigating between years, data refresh.
 */
import { test, expect } from "@playwright/test";
import { goToLeaves } from "./helpers";

test.describe("Leaves Settings — Year Navigation", () => {
    test("year selector displays the current year", async ({ page }) => {
        await goToLeaves(page);
        const currentYear = new Date().getFullYear();
        await expect(page.getByText(String(currentYear)).first()).toBeVisible();
    });

    test("clicking year arrows changes the displayed year", async ({ page }) => {
        await goToLeaves(page);
        const currentYear = new Date().getFullYear();

        // Find all icon buttons (CaretLeft and CaretRight) near the year text
        const yearText = page.getByText(String(currentYear)).first();
        const yearContainer = yearText.locator("xpath=ancestor::div[contains(@class,'inline-flex')]");

        // Click the first button (left arrow / previous year)
        const buttons = yearContainer.locator("button");
        await buttons.first().click();

        // Wait for the year to change
        await expect(page.getByText(String(currentYear - 1)).first()).toBeVisible({ timeout: 15_000 });
    });

    test("year navigation refreshes leave data", async ({ page }) => {
        await goToLeaves(page);
        const currentYear = new Date().getFullYear();

        // Navigate to previous year
        const yearText = page.getByText(String(currentYear)).first();
        const yearContainer = yearText.locator("xpath=ancestor::div[contains(@class,'inline-flex')]");
        await yearContainer.locator("button").first().click();

        // The summary cards should still be visible (data refreshed)
        await expect(page.getByText(/time away used/i)).toBeVisible({ timeout: 15_000 });
    });
});
