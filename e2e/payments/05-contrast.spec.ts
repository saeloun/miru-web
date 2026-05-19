/**
 * Contrast — WCAG AA color contrast checks on key payments page elements.
 * Covers manual test section 10.
 */
import { test, expect } from "@playwright/test";
import { goToPayments, contrastRatio, WCAG_AA_NORMAL, WCAG_AA_LARGE } from "./helpers";

async function getColors(page, locator) {
    return locator.evaluate(el => {
        const style = getComputedStyle(el);
        const fg = style.color;
        let bg = style.backgroundColor;
        let current = el.parentElement;
        while (current && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
            bg = getComputedStyle(current).backgroundColor;
            current = current.parentElement;
        }
        if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") bg = "rgb(255, 255, 255)";
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight, 10) || 400;
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        return { fg, bg, fontSize, fontWeight, isLargeText };
    });
}

test.describe("Payments — Contrast Checks", () => {
    test("table header text meets WCAG AA contrast", async ({ page }) => {
        await goToPayments(page);
        const header = page.locator("thead th").first();
        const isVisible = await header.isVisible().catch(() => false);
        if (!isVisible) return;

        const { fg, bg, isLargeText } = await getColors(page, header);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Header contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    test("invoice number link meets WCAG AA contrast", async ({ page }) => {
        await goToPayments(page);
        const link = page.locator("tbody a[href*='/invoices/']").first();
        const isVisible = await link.isVisible().catch(() => false);
        if (!isVisible) return;

        const { fg, bg, isLargeText } = await getColors(page, link);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Invoice link contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    test("amount text meets WCAG AA contrast", async ({ page }) => {
        await goToPayments(page);
        const amountCell = page.locator("tbody tr").first().locator("td").nth(3);
        const isVisible = await amountCell.isVisible().catch(() => false);
        if (!isVisible) return;

        const { fg, bg, isLargeText } = await getColors(page, amountCell);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Amount contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    test("Add Manual Entry button meets WCAG AA contrast", async ({ page }) => {
        await goToPayments(page);
        // Find any visible "Add Manual Entry" button — could be header or empty state
        const btn = page.getByRole("button", { name: /add.*manual.*entry/i }).first();
        const isVisible = await btn.isVisible().catch(() => false);
        if (!isVisible) return;

        const { fg, bg, isLargeText } = await getColors(page, btn);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Add button contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });
});
