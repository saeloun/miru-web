/**
 * Copy Last Week — duplicate previous week's entries.
 * Covers manual test section 11.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking } from "./helpers";

test.describe("Time Tracking — Copy Last Week", () => {
    // §11.1 — Copy Last Week button visible in week view
    test("Copy Last Week button is visible in week view on desktop", async ({ page }) => {
        await goToTimeTracking(page);
        const copyBtn = page.locator("[data-testid='copy-last-week']");
        await expect(copyBtn).toBeVisible();
    });

    // §11.6 — Not visible in month view
    test("Copy Last Week button is NOT visible in month view", async ({ page }) => {
        await goToTimeTracking(page);
        await page.locator("[role='tablist'] button[data-view='month']").click();
        await page.waitForTimeout(500);

        const copyBtn = page.locator("[data-testid='copy-last-week']");
        await expect(copyBtn).not.toBeVisible();
    });

    // PR #2241 — copy/duplicate shortcut does not navigate away
    test("duplicate/copy button does not navigate away from time-tracking", async ({ page }) => {
        await goToTimeTracking(page);

        const copyBtn = page.getByRole("button", { name: /copy|duplicate/i }).first();
        const hasCopyBtn = await copyBtn.isVisible().catch(() => false);
        if (!hasCopyBtn) return;

        await copyBtn.click();
        await page.waitForTimeout(1_000);
        await expect(page).toHaveURL(/\/time-tracking/);
        await expect(page.getByText(/not found|404|page.*doesn.*exist/i)).not.toBeVisible();
    });
});
