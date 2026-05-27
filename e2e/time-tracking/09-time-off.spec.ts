/**
 * Time Off Entry — Mark Time Off button and form toggle.
 * Covers manual test section 13.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking } from "./helpers";

test.describe("Time Tracking — Time Off", () => {
    // §13.1 — Mark Time Off button visible
    test("Mark Time Off button is visible", async ({ page }) => {
        await goToTimeTracking(page);
        const timeOffBtn = page.locator("[data-testid='mark-time-off-button']");
        await expect(timeOffBtn).toBeVisible();
    });

    // §13.3 — Time off form hides Add Entry
    test("opening time off form hides Add Entry and Mark Time Off buttons", async ({ page }) => {
        await goToTimeTracking(page);
        await page.locator("[data-testid='mark-time-off-button']").click();

        // Both buttons should be hidden when a form is open
        await expect(page.getByRole("button", { name: /add entry/i })).not.toBeVisible();
        await expect(page.locator("[data-testid='mark-time-off-button']")).not.toBeVisible();
    });
});
