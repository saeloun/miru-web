/**
 * Preferences Settings — WCAG AA Contrast Checks.
 * Covers: page title, card headers, preference labels, description text.
 */
import { test, expect } from "@playwright/test";
import { goToPreferences, contrastRatio, getColors, WCAG_AA_NORMAL, WCAG_AA_LARGE } from "./helpers";

test.describe("Preferences Settings — Contrast Checks", () => {
    test("page title meets WCAG AA contrast", async ({ page }) => {
        await goToPreferences(page);
        const title = page.locator("h1").filter({ hasText: /email preferences/i });
        await expect(title).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(title);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Title contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("Timesheet Notifications header meets WCAG AA contrast", async ({ page }) => {
        await goToPreferences(page);
        const header = page.getByText(/timesheet notifications/i).first();
        await expect(header).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(header);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Timesheet header contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("Billing Notifications header meets WCAG AA contrast", async ({ page }) => {
        await goToPreferences(page);
        const header = page.getByText(/billing notifications/i).first();
        await expect(header).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(header);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Billing header contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("preference toggle label meets WCAG AA contrast", async ({ page }) => {
        await goToPreferences(page);
        const label = page.getByText(/weekly timesheet reminder/i);
        await expect(label).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(label);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Toggle label contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("Email Delivery Settings header meets WCAG AA contrast", async ({ page }) => {
        await goToPreferences(page);
        const header = page.getByText(/email delivery settings/i);
        await expect(header).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(header);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Delivery header contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });
});
