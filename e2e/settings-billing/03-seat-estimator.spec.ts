/**
 * Billing Settings — Seat Estimator.
 * Covers: slider interaction, estimated spend, recommendations.
 */
import { test, expect } from "@playwright/test";
import { goToBilling } from "./helpers";

test.describe("Billing Settings — Seat Estimator", () => {
    test("seat slider is visible with aria-label", async ({ page }) => {
        await goToBilling(page);

        const slider = page.locator("[aria-label='Estimated seat count']");
        await expect(slider).toBeVisible({ timeout: 10_000 });
    });

    test("estimated seats count is displayed", async ({ page }) => {
        await goToBilling(page);

        // The estimated seats number should be visible
        await expect(page.getByText(/estimated seats/i)).toBeVisible();
    });

    test("estimated Pro spend is displayed", async ({ page }) => {
        await goToBilling(page);

        await expect(page.getByText(/estimated pro spend/i)).toBeVisible();
    });

    test("yearly discount section is displayed", async ({ page }) => {
        await goToBilling(page);

        await expect(page.getByText(/yearly discount/i).first()).toBeVisible();
    });

    test("recommendation section is displayed", async ({ page }) => {
        await goToBilling(page);

        await expect(page.getByText(/recommended/i).first()).toBeVisible();
    });
});
