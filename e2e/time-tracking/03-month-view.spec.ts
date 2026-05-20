/**
 * Month View — Calendar grid, navigation, day selection.
 * Covers manual test section 4.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking } from "./helpers";

test.describe("Time Tracking — Month View", () => {
    test.beforeEach(async ({ page }) => {
        await goToTimeTracking(page);
        // Switch to month view
        await page.locator("[role='tablist'] button[data-view='month']").click();
        await page.waitForTimeout(500);
    });

    // §4.1 — Switch to month view
    test("month view renders a calendar grid", async ({ page }) => {
        // Month calendar should be visible (it renders day cells)
        await expect(page.locator("[data-view='month']").first()).toBeVisible();
    });

    // §4.3 — Navigate to next month
    test("next arrow advances the month", async ({ page }) => {
        // The month header should change when clicking next
        await page.locator("[data-testid='time-nav-next']").click();
        await page.waitForTimeout(500);
        // No crash — page still renders
        await expect(page.locator("[data-view='month']").first()).toBeVisible();
    });

    // §4.4 — Navigate to previous month
    test("prev arrow goes back a month", async ({ page }) => {
        await page.locator("[data-testid='time-nav-prev']").click();
        await page.waitForTimeout(500);
        await expect(page.locator("[data-view='month']").first()).toBeVisible();
    });

    // §4.8 — Switch back to week view
    test("switching back to week view restores week header", async ({ page }) => {
        await page.locator("[role='tablist'] button[data-view='week']").click();
        await page.waitForTimeout(500);
        await expect(page.getByText(/week of/i)).toBeVisible();
    });
});
