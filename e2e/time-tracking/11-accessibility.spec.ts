/**
 * Accessibility — aria attributes, roles, keyboard navigation.
 * Covers manual test section 19.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking } from "./helpers";

test.describe("Time Tracking — Accessibility", () => {
    test.beforeEach(async ({ page }) => {
        await goToTimeTracking(page);
    });

    // §19.2 — Day selector aria labels
    test("day selector buttons have aria-label and aria-pressed", async ({ page }) => {
        const dayButtons = page.locator("button[aria-pressed]");
        const count = await dayButtons.count();
        expect(count).toBe(7);

        for (let i = 0; i < count; i++) {
            const btn = dayButtons.nth(i);
            const label = await btn.getAttribute("aria-label");
            expect(label).toBeTruthy();
            expect(label).toMatch(/select/i);

            const pressed = await btn.getAttribute("aria-pressed");
            expect(["true", "false"]).toContain(pressed);
        }
    });

    // §19.3 — View toggle has tablist role
    test("view toggle container has role=tablist", async ({ page }) => {
        const tablist = page.locator("[role='tablist']");
        await expect(tablist).toBeVisible();
    });

    // §19.4 — Form labels
    test("entry form inputs have associated labels", async ({ page }) => {
        await page.getByRole("button", { name: /add entry/i }).click();

        // Client label
        await expect(page.locator("label[for='client']")).toBeVisible();
        // Project label
        await expect(page.locator("label[for='project']")).toBeVisible();
        // Duration label
        await expect(page.getByText(/time spent/i)).toBeVisible();
    });

    // §19.5 — Timer test IDs
    test("timer has data-testid when active", async ({ page }) => {
        // Clear timer state
        await page.evaluate(() => localStorage.removeItem("miru_timer_state"));
        await page.reload();
        await goToTimeTracking(page);

        await page.getByRole("button", { name: /start timer/i }).click();
        await expect(page.locator("[data-testid='inline-web-timer']")).toBeVisible({ timeout: 5_000 });

        // Cleanup: reset timer
        await page.getByRole("button", { name: /reset/i }).click();
    });
});
