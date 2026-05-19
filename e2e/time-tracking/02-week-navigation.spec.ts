/**
 * Week View — Header & Navigation.
 * Covers manual test sections 2 and 3.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking } from "./helpers";

test.describe("Time Tracking — Week Navigation", () => {
    test.beforeEach(async ({ page }) => {
        await goToTimeTracking(page);
    });

    // §2.1 — Week header shows date range
    test("week header shows date range with 'Week of'", async ({ page }) => {
        await expect(page.getByText(/week of/i)).toBeVisible();
    });

    // §2.2 — Weekly total hours displayed
    test("weekly total hours box is visible", async ({ page }) => {
        const totalBox = page.locator(".weekly-total");
        await expect(totalBox).toBeVisible();
        await expect(totalBox.getByText(/total/i)).toBeVisible();
        await expect(totalBox.locator(".tabular-nums")).toContainText(/\d{1,3}:\d{2}/);
    });

    // §2.3 — Today button
    test("Today button navigates to current week", async ({ page }) => {
        // Navigate away first
        await page.locator("[data-testid='time-nav-prev']").click();
        await page.waitForTimeout(300);

        // Click Today
        await page.locator("[data-testid='time-nav-today']").click();
        await page.waitForTimeout(300);

        // A day button should be selected
        await expect(page.locator("button[aria-pressed='true']")).toBeVisible();
    });

    // §2.4 — Last Week button (use exact match to avoid "Copy Last Week")
    test("Last Week button navigates to previous week", async ({ page }) => {
        // Get the full header text from the h2 element
        const headerEl = page.locator("h2").filter({ hasText: /week of/i });
        const headerBefore = await headerEl.innerText();

        await page.getByRole("button", { name: "Last Week", exact: true }).click();
        await page.waitForTimeout(500);

        const headerAfter = await headerEl.innerText();
        expect(headerAfter).not.toBe(headerBefore);
    });

    // §2.5 — Next week arrow
    test("next arrow advances the week", async ({ page }) => {
        const headerEl = page.locator("h2").filter({ hasText: /week of/i });
        const headerBefore = await headerEl.innerText();

        await page.locator("[data-testid='time-nav-next']").click();
        await page.waitForTimeout(500);

        const headerAfter = await headerEl.innerText();
        expect(headerAfter).not.toBe(headerBefore);
    });

    // §2.6 — Previous week arrow
    test("prev arrow goes back a week", async ({ page }) => {
        const headerEl = page.locator("h2").filter({ hasText: /week of/i });
        const headerBefore = await headerEl.innerText();

        await page.locator("[data-testid='time-nav-prev']").click();
        await page.waitForTimeout(500);

        const headerAfter = await headerEl.innerText();
        expect(headerAfter).not.toBe(headerBefore);
    });

    // §3.1 — Seven day buttons visible
    test("seven day buttons are visible in the day selector", async ({ page }) => {
        const dayButtons = page.locator("button[aria-pressed]");
        await expect(dayButtons).toHaveCount(7);
    });

    // §3.3 — Selected day indicator
    test("clicking a day button marks it as selected", async ({ page }) => {
        const dayButtons = page.locator("button[aria-pressed]");
        await dayButtons.nth(2).click();
        await expect(dayButtons.nth(2)).toHaveAttribute("aria-pressed", "true");
    });
});
