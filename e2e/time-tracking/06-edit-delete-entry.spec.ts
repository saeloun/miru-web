/**
 * Edit & Delete Entry — modify existing entries, remove them.
 * Covers manual test sections 7 and 8.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking, createTimesheetEntry, deleteTimesheetEntry } from "./helpers";

test.describe("Time Tracking — Edit & Delete Entry", () => {
    // §7.1 — Edit button on entry card (hover)
    test("edit button appears on entry card hover", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-Edit-${Date.now()}` });
        try {
            await goToTimeTracking(page);
            // Click Today to ensure we're on the right day
            await page.locator("[data-testid='time-nav-today']").click();
            await page.waitForTimeout(500);

            const noteEl = page.locator("[data-testid='time-entry-note']").filter({ hasText: entry.note });
            await expect(noteEl).toBeVisible({ timeout: 10_000 });

            // Hover over the parent card to reveal action buttons
            const card = noteEl.locator("xpath=ancestor::div[contains(@class,'group')]").first();
            await card.hover();

            const editBtn = card.locator("button[title*='dit' i]").first();
            await expect(editBtn).toBeVisible({ timeout: 5_000 });
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    // §7.2 — Click edit opens form pre-filled
    test("clicking edit opens the form with pre-filled values", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-EditPre-${Date.now()}`, duration: 90 });
        try {
            await goToTimeTracking(page);
            await page.locator("[data-testid='time-nav-today']").click();
            await page.waitForTimeout(500);

            const noteEl = page.locator("[data-testid='time-entry-note']").filter({ hasText: entry.note });
            await expect(noteEl).toBeVisible({ timeout: 10_000 });

            const card = noteEl.locator("xpath=ancestor::div[contains(@class,'group')]").first();
            await card.hover();

            const editBtn = card.locator("button[title*='dit' i]").first();
            await editBtn.click();

            await expect(page.getByRole("button", { name: /update entry/i })).toBeVisible({ timeout: 5_000 });
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    // §7.5 — Cancel edit
    test("cancel edit closes the form without changes", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-EditCancel-${Date.now()}` });
        try {
            await goToTimeTracking(page);
            await page.locator("[data-testid='time-nav-today']").click();
            await page.waitForTimeout(500);

            const noteEl = page.locator("[data-testid='time-entry-note']").filter({ hasText: entry.note });
            await expect(noteEl).toBeVisible({ timeout: 10_000 });

            const card = noteEl.locator("xpath=ancestor::div[contains(@class,'group')]").first();
            await card.hover();

            const editBtn = card.locator("button[title*='dit' i]").first();
            await editBtn.click();
            await expect(page.getByRole("button", { name: /update entry/i })).toBeVisible({ timeout: 5_000 });

            await page.getByRole("button", { name: /cancel/i }).click();

            await expect(page.getByRole("button", { name: /add entry/i })).toBeVisible();
            await expect(page.locator("[data-testid='time-entry-note']").filter({ hasText: entry.note })).toBeVisible();
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    // §8.2 — Click delete removes entry
    test("clicking delete removes the entry from the list", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-Del-${Date.now()}` });

        await goToTimeTracking(page);
        await page.locator("[data-testid='time-nav-today']").click();
        await page.waitForTimeout(500);

        const noteEl = page.locator("[data-testid='time-entry-note']").filter({ hasText: entry.note });
        await expect(noteEl).toBeVisible({ timeout: 10_000 });

        const card = noteEl.locator("xpath=ancestor::div[contains(@class,'group')]").first();
        await card.hover();

        const deleteBtn = card.locator("button[title*='elete' i]").first();
        await deleteBtn.click();

        // Wait for the specific note element to disappear
        await expect(
            page.locator("[data-testid='time-entry-note']").filter({ hasText: entry.note }),
        ).not.toBeVisible({ timeout: 10_000 });
    });
});
