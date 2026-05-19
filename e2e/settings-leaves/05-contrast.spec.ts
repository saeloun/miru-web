/**
 * Leaves Settings — WCAG AA Contrast Checks.
 * Covers: page heading, summary card labels, summary card values, calendar title.
 */
import { test, expect } from "@playwright/test";
import { goToLeaves, contrastRatio, getColors, WCAG_AA_NORMAL, WCAG_AA_LARGE } from "./helpers";

test.describe("Leaves Settings — Contrast Checks", () => {
    test("page heading meets WCAG AA contrast", async ({ page }) => {
        await goToLeaves(page);
        const heading = page.locator("h1").first();
        await expect(heading).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(heading);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Heading contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("summary card label meets WCAG AA contrast", async ({ page }) => {
        await goToLeaves(page);
        const label = page.getByText(/time away used/i);
        await expect(label).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(label);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Card label contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("summary card value meets WCAG AA contrast", async ({ page }) => {
        await goToLeaves(page);
        // The value is the large text next to the label — find the first .text-xl.font-semibold
        const value = page.locator(".text-xl.font-semibold").first();
        await expect(value).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(value);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Card value contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("Leave calendar heading meets WCAG AA contrast", async ({ page }) => {
        await goToLeaves(page);
        const heading = page.getByText(/leave calendar/i).first();
        await heading.scrollIntoViewIfNeeded();
        await expect(heading).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(heading);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Calendar heading contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("year selector text meets WCAG AA contrast", async ({ page }) => {
        await goToLeaves(page);
        const yearText = page.getByText(String(new Date().getFullYear())).first();
        await expect(yearText).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(yearText);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Year text contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });
});
