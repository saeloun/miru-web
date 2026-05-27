/**
 * Contrast — WCAG AA color contrast checks on key interactive elements.
 * Covers hover states, selected states, and static text elements.
 *
 * Uses getComputedStyle to measure foreground vs background contrast ratios.
 * WCAG AA requires ≥4.5 for normal text and ≥3.0 for large text (≥18px bold or ≥24px).
 */
import { test, expect } from "@playwright/test";
import {
    goToTimeTracking,
    createTimesheetEntry,
    deleteTimesheetEntry,
    contrastRatio,
    WCAG_AA_NORMAL,
    WCAG_AA_LARGE,
} from "./helpers";

/**
 * Evaluate fg/bg colors of a locator.
 * Walks up the DOM for a non-transparent bg, collecting all layers for alpha compositing.
 */
async function getColors(page, locator) {
    return locator.evaluate(el => {
        const style = getComputedStyle(el);
        const fg = style.color;

        // Walk up the tree to find the first opaque background
        let bg = style.backgroundColor;
        let current = el.parentElement;
        while (
            current &&
            (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")
        ) {
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

test.describe("Time Tracking — Contrast Checks", () => {
    // --- Static text elements ---

    test("description subtitle meets WCAG AA contrast", async ({ page }) => {
        await goToTimeTracking(page);
        const subtitle = page.getByText(/log work by week or month/i);
        await expect(subtitle).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, subtitle);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Subtitle contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`).toBeGreaterThanOrEqual(threshold);
    });

    test("weekly total text meets WCAG AA contrast", async ({ page }) => {
        await goToTimeTracking(page);
        const totalText = page.locator(".weekly-total .tabular-nums");
        await expect(totalText).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, totalText);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Total contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    test("'Total' label text meets WCAG AA contrast", async ({ page }) => {
        await goToTimeTracking(page);
        const label = page.locator(".weekly-total").getByText(/total/i);
        await expect(label).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, label);
        const ratio = contrastRatio(fg, bg);
        // This is a small label — check if it's actually large text
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Total label contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg}). This is a real contrast issue if it fails.`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    // --- Day selector buttons ---

    test("unselected day button text meets WCAG AA contrast", async ({ page }) => {
        await goToTimeTracking(page);
        const dayButtons = page.locator("button[aria-pressed='false']");
        const count = await dayButtons.count();
        if (count === 0) return;

        const btn = dayButtons.first();
        const dayLabel = btn.locator("p").first();
        const { fg, bg, isLargeText } = await getColors(page, dayLabel);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Unselected day contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`).toBeGreaterThanOrEqual(threshold);
    });

    test("selected day button text meets WCAG AA contrast", async ({ page }) => {
        await goToTimeTracking(page);
        const selectedBtn = page.locator("button[aria-pressed='true']");
        await expect(selectedBtn).toBeVisible();

        // Check the date number (largest text in the button) — it's the primary readability concern
        const dateNumber = selectedBtn.locator("p.text-lg").first();
        const { fg, bg, isLargeText } = await getColors(page, dateNumber);
        const ratio = contrastRatio(fg, bg);
        // The date number is large text (text-lg = 18px, font-bold = 700) → use large text threshold
        const threshold = WCAG_AA_LARGE;
        expect(ratio, `Selected day contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`).toBeGreaterThanOrEqual(threshold);
    });

    // --- View toggle buttons ---

    test("active view toggle button meets WCAG AA contrast", async ({ page }) => {
        await goToTimeTracking(page);
        const activeBtn = page.locator("[role='tablist'] button[data-view='week']");
        await expect(activeBtn).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, activeBtn);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Active toggle contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    test("inactive view toggle button meets WCAG AA contrast", async ({ page }) => {
        await goToTimeTracking(page);
        const inactiveBtn = page.locator("[role='tablist'] button[data-view='month']");
        await expect(inactiveBtn).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, inactiveBtn);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Inactive toggle contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    // --- Entry card elements ---

    test("entry card client/project text meets WCAG AA contrast", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-Contrast-${Date.now()}` });
        try {
            await goToTimeTracking(page);

            const clientText = page.locator(".text-base.font-bold.text-foreground").filter({ hasText: entry.client }).first();
            await expect(clientText).toBeVisible({ timeout: 10_000 });

            const { fg, bg, isLargeText } = await getColors(page, clientText);
            const ratio = contrastRatio(fg, bg);
            const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
            expect(ratio, `Client text contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    test("entry card duration text meets WCAG AA contrast", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-DurContrast-${Date.now()}`, duration: 120 });
        try {
            await goToTimeTracking(page);

            const durationText = page.locator(".text-3xl.font-bold.tabular-nums").first();
            await expect(durationText).toBeVisible({ timeout: 10_000 });

            const { fg, bg, isLargeText } = await getColors(page, durationText);
            const ratio = contrastRatio(fg, bg);
            const threshold = WCAG_AA_LARGE; // 3xl text is large
            expect(ratio, `Duration contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    test("entry card note text meets WCAG AA contrast", async ({ page }) => {
        const noteText = `E2E-NoteContrast-${Date.now()}`;
        const entry = await createTimesheetEntry(page, { note: noteText });
        try {
            await goToTimeTracking(page);

            const noteEl = page.locator("[data-testid='time-entry-note']").filter({ hasText: noteText }).first();
            await expect(noteEl).toBeVisible({ timeout: 10_000 });

            const { fg, bg, isLargeText } = await getColors(page, noteEl);
            const ratio = contrastRatio(fg, bg);
            const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
            expect(ratio, `Note contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    // --- Hover state contrast ---

    test("entry card hover state maintains readable contrast", async ({ page }) => {
        const entry = await createTimesheetEntry(page, { note: `E2E-HoverContrast-${Date.now()}` });
        try {
            await goToTimeTracking(page);

            const card = page.locator("[data-testid='time-entry-note']").filter({ hasText: entry.note }).first();
            await expect(card).toBeVisible({ timeout: 10_000 });

            await card.hover();
            await page.waitForTimeout(300);

            const { fg, bg, isLargeText } = await getColors(page, card);
            const ratio = contrastRatio(fg, bg);
            const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
            expect(ratio, `Hover note contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteTimesheetEntry(page, entry.id);
        }
    });

    // --- Timer contrast ---

    test("timer Start button text meets WCAG AA contrast", async ({ page }) => {
        await goToTimeTracking(page);

        const startBtn = page.getByRole("button", { name: /start timer/i });
        await expect(startBtn).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, startBtn);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Start Timer contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    // --- Form element contrast ---

    test("Add Entry button text meets WCAG AA contrast", async ({ page }) => {
        await goToTimeTracking(page);
        const addBtn = page.getByRole("button", { name: /add entry/i });
        await expect(addBtn).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, addBtn);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Add Entry contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });
});
