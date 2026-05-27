/**
 * Entry Card Display — client, project, duration, note, actions.
 * Covers manual test section 14.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking, createTimesheetEntry, deleteTimesheetEntry } from "./helpers";

test.describe("Time Tracking — Entry Card Display", () => {
    // §14.1 — Entry card shows client and project
    test("entry card displays client and project names", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-Card-${Date.now()}` });
        try {
            await goToTimeTracking(page);
            await page.locator("[data-testid='time-nav-today']").click();
            await page.waitForTimeout(500);

            // Find the specific entry card by its unique note
            const noteEl = page.locator("[data-testid='time-entry-note']").filter({ hasText: entry.note });
            await expect(noteEl).toBeVisible({ timeout: 10_000 });

            // The card containing this note should also have the project and client
            const card = noteEl.locator("xpath=ancestor::div[contains(@class,'group')]").first();
            await expect(card.getByText(entry.project)).toBeVisible();
            await expect(card.getByText(entry.client)).toBeVisible();
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    // §14.2 — Entry card shows duration
    test("entry card displays duration in HH:MM format", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-Dur-${Date.now()}`, duration: 90 });
        try {
            await goToTimeTracking(page);
            await page.locator("[data-testid='time-nav-today']").click();
            await page.waitForTimeout(500);

            const noteEl = page.locator("[data-testid='time-entry-note']").filter({ hasText: entry.note });
            await expect(noteEl).toBeVisible({ timeout: 10_000 });

            // 90 minutes = 01:30 — verify the card contains this text (may be in mobile or desktop container)
            const card = noteEl.locator("xpath=ancestor::div[contains(@class,'group')]").first();
            await expect(card).toContainText("01:30");
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    // §14.3 — Entry card shows note
    test("entry card displays the note text", async ({ page }) => {
        const noteText = `E2E-Note-${Date.now()}`;
        const entry = await createTimesheetEntry(page, { note: noteText });
        try {
            await goToTimeTracking(page);
            await page.locator("[data-testid='time-nav-today']").click();
            await page.waitForTimeout(500);

            await expect(
                page.locator("[data-testid='time-entry-note']").filter({ hasText: noteText }),
            ).toBeVisible({ timeout: 10_000 });
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    // §14.4 — Entry card shows "Time Logged" label
    test("entry card shows Time Logged label on desktop", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-Label-${Date.now()}` });
        try {
            await goToTimeTracking(page);
            await page.locator("[data-testid='time-nav-today']").click();
            await page.waitForTimeout(500);

            await expect(page.getByText(/time logged/i).first()).toBeVisible({ timeout: 10_000 });
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    // §10.1 — Resume button on entry card
    test("resume timer button is visible on entry card", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-Resume-${Date.now()}` });
        try {
            await goToTimeTracking(page);
            await page.locator("[data-testid='time-nav-today']").click();
            await page.waitForTimeout(500);

            const resumeBtn = page.locator("[data-testid='resume-timer-entry']").first();
            await expect(resumeBtn).toBeVisible({ timeout: 10_000 });
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });
});
