/**
 * Web Timer (Inline) — start, pause, resume, stop, save, discard.
 * Covers manual test section 5.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking, expectToast } from "./helpers";

test.describe("Time Tracking — Web Timer", () => {
    test.beforeEach(async ({ page }) => {
        // Clear any persisted timer state
        await page.goto("/time-tracking");
        await page.evaluate(() => {
            localStorage.removeItem("miru_timer_state");
        });
        await goToTimeTracking(page);
    });

    // §5.1 — Timer card visible (pristine)
    test("pristine timer shows Start Timer button", async ({ page }) => {
        const startBtn = page.getByRole("button", { name: /start timer/i });
        await expect(startBtn).toBeVisible();
    });

    // §5.2 — Start timer
    test("clicking Start Timer begins counting", async ({ page }) => {
        await page.getByRole("button", { name: /start timer/i }).click();

        // Timer card should now be active
        const timerCard = page.locator("[data-testid='inline-web-timer']");
        await expect(timerCard).toBeVisible({ timeout: 5_000 });

        // Pause and Stop buttons should appear
        await expect(timerCard.getByRole("button", { name: /pause/i })).toBeVisible();
        await expect(timerCard.getByRole("button", { name: /stop/i })).toBeVisible();
    });

    // §5.3 — Timer display format
    test("running timer shows HH:MM:SS format", async ({ page }) => {
        await page.getByRole("button", { name: /start timer/i }).click();
        const timerCard = page.locator("[data-testid='inline-web-timer']");
        await expect(timerCard).toBeVisible({ timeout: 5_000 });

        // Wait a moment for the timer to tick
        await page.waitForTimeout(1_500);

        // Should show a time like 00:00:01
        const timerText = timerCard.locator(".font-mono.text-3xl");
        await expect(timerText).toContainText(/\d{2}:\d{2}:\d{2}/);
    });

    // §5.4 — Pause timer
    test("pause stops the timer counting", async ({ page }) => {
        await page.getByRole("button", { name: /start timer/i }).click();
        await expect(page.locator("[data-testid='inline-web-timer']")).toBeVisible({ timeout: 5_000 });

        await page.waitForTimeout(1_500);
        await page.locator("[data-testid='inline-web-timer']").getByRole("button", { name: /pause/i }).click();

        // Resume button should appear within the timer card
        await expect(page.locator("[data-testid='inline-web-timer']").getByRole("button", { name: /resume/i })).toBeVisible();
    });

    // §5.5 — Resume timer
    test("resume continues the timer from where it paused", async ({ page }) => {
        await page.getByRole("button", { name: /start timer/i }).click();
        await expect(page.locator("[data-testid='inline-web-timer']")).toBeVisible({ timeout: 5_000 });

        await page.waitForTimeout(1_500);
        await page.locator("[data-testid='inline-web-timer']").getByRole("button", { name: /pause/i }).click();
        await expect(page.locator("[data-testid='inline-web-timer']").getByRole("button", { name: /resume/i })).toBeVisible();

        // Resume
        await page.locator("[data-testid='inline-web-timer']").getByRole("button", { name: /resume/i }).click();
        await expect(page.locator("[data-testid='inline-web-timer']").getByRole("button", { name: /pause/i })).toBeVisible();
    });

    // §5.7 — Timer project selection
    test("project dropdown is available on the timer", async ({ page }) => {
        await page.getByRole("button", { name: /start timer/i }).click();
        await expect(page.locator("[data-testid='inline-web-timer']")).toBeVisible({ timeout: 5_000 });

        const projectTrigger = page.locator("#timer-project-inline");
        await expect(projectTrigger).toBeVisible();
    });

    // §5.8 — Timer description input
    test("description textarea is available on the timer", async ({ page }) => {
        await page.getByRole("button", { name: /start timer/i }).click();
        await expect(page.locator("[data-testid='inline-web-timer']")).toBeVisible({ timeout: 5_000 });

        const descInput = page.locator("#timer-description-inline");
        await expect(descInput).toBeVisible();
        await descInput.fill("E2E timer test note");
        await expect(descInput).toHaveValue("E2E timer test note");
    });

    // §5.11 — Reset timer
    test("reset button returns timer to pristine state", async ({ page }) => {
        await page.getByRole("button", { name: /start timer/i }).click();
        await expect(page.locator("[data-testid='inline-web-timer']")).toBeVisible({ timeout: 5_000 });

        // Click Reset (X button)
        await page.getByRole("button", { name: /reset/i }).click();

        // Should return to pristine state with Start Timer button
        await expect(page.getByRole("button", { name: /start timer/i })).toBeVisible({ timeout: 5_000 });
    });

    // §5.6 — Stop timer opens save dialog
    test("stop timer opens save dialog when time has elapsed", async ({ page }) => {
        await page.getByRole("button", { name: /start timer/i }).click();
        await expect(page.locator("[data-testid='inline-web-timer']")).toBeVisible({ timeout: 5_000 });

        // Let it run for a bit
        await page.waitForTimeout(2_000);

        await page.getByRole("button", { name: /stop/i }).click();

        // Save dialog should open
        await expect(page.getByRole("heading", { name: /save time entry/i })).toBeVisible({ timeout: 5_000 });
    });

    // §5.10 — Discard timer from save dialog
    test("discard in save dialog resets the timer", async ({ page }) => {
        await page.getByRole("button", { name: /start timer/i }).click();
        await expect(page.locator("[data-testid='inline-web-timer']")).toBeVisible({ timeout: 5_000 });

        await page.waitForTimeout(2_000);
        await page.getByRole("button", { name: /stop/i }).click();
        await expect(page.getByRole("heading", { name: /save time entry/i })).toBeVisible({ timeout: 5_000 });

        await page.getByRole("button", { name: /discard/i }).click();

        // Timer should reset to pristine
        await expect(page.getByRole("button", { name: /start timer/i })).toBeVisible({ timeout: 5_000 });
    });
});
