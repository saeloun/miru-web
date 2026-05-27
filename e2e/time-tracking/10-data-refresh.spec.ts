/**
 * Data Refresh — entries refresh after create/delete, total updates.
 * Covers manual test section 17.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking, createTimesheetEntry, deleteTimesheetEntry } from "./helpers";

test.describe("Time Tracking — Data Refresh", () => {
    // §17.2 — Entries refresh after create
    test("newly created entry appears after navigating back", async ({ page }) => {
        const noteText = `E2E-Refresh-${Date.now()}`;
        const entry = await createTimesheetEntry(page, { note: noteText });
        try {
            // Navigate to time tracking — the entry should be visible
            await goToTimeTracking(page);
            await expect(page.getByText(noteText).first()).toBeVisible({ timeout: 10_000 });
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    // §17.4 — Entries refresh after delete
    test("deleted entry disappears from the list", async ({ page }) => {
        const noteText = `E2E-DelRefresh-${Date.now()}`;
        const entry = await createTimesheetEntry(page, { note: noteText });

        await goToTimeTracking(page);
        await expect(page.getByText(noteText).first()).toBeVisible({ timeout: 10_000 });

        // Delete via API
        await deleteTimesheetEntry(page, entry.id);

        // Navigate away and back
        await page.goto("/dashboard");
        await page.waitForLoadState("networkidle");
        await goToTimeTracking(page);

        // Should no longer be visible
        await expect(page.getByText(noteText)).not.toBeVisible();
    });

    // §17.5 — Weekly total updates after changes
    test("weekly total is displayed and contains a valid time", async ({ page }) => {
        await goToTimeTracking(page);
        const totalBox = page.locator(".weekly-total .tabular-nums");
        await expect(totalBox).toBeVisible();
        const totalText = await totalBox.innerText();
        expect(totalText).toMatch(/\d{1,3}:\d{2}/);
    });
});
