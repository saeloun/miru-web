/**
 * Page Load & Layout — basic rendering, view toggles, error state.
 * Covers manual test section 1.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking } from "./helpers";

test.describe("Time Tracking — Page Load", () => {
    // §1.1 — Page loads successfully
    test("page loads without errors", async ({ page }) => {
        await goToTimeTracking(page);
        // Description text visible on desktop
        await expect(page.getByText(/log work by week or month/i)).toBeVisible();
    });

    // §1.4 — Error state
    test("shows error state when API fails", async ({ page }) => {
        await page.route("**/api/v1/time-tracking*", route =>
            route.fulfill({ status: 500, body: "Internal Server Error" }),
        );
        await page.goto("/time-tracking");
        await expect(
            page.locator("[data-testid='time-tracking-runtime-error']"),
        ).toBeVisible({ timeout: 15_000 });
    });

    // §1.5 — View toggle buttons visible
    test("week and month toggle buttons are visible", async ({ page }) => {
        await goToTimeTracking(page);
        const tablist = page.locator("[role='tablist']");
        await expect(tablist).toBeVisible();
        await expect(tablist.getByText("Week")).toBeVisible();
        await expect(tablist.getByText("Month")).toBeVisible();
    });

    // §1.6 — Default view is Week
    test("default view is week", async ({ page }) => {
        await goToTimeTracking(page);
        // The Week button should have the default (non-outline) variant
        const weekBtn = page.locator("[role='tablist'] button[data-view='week']");
        await expect(weekBtn).toBeVisible();
    });
});
