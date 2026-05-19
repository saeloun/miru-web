/**
 * Expenses — WCAG AA color contrast checks on key elements.
 * Covers manual test section: 15 (WCAG AA Color Contrast).
 *
 * Uses getComputedStyle to measure foreground vs background contrast ratios.
 * WCAG AA requires ≥4.5 for normal text and ≥3.0 for large text (≥18px bold or ≥24px).
 */
import { test, expect } from "@playwright/test";
import {
    goToExpenses,
    createExpense,
    deleteExpense,
    contrastRatio,
    getColors,
    WCAG_AA_NORMAL,
    WCAG_AA_LARGE,
} from "./helpers";

test.describe("Expenses — Contrast Checks", () => {
    test("page subtitle meets WCAG AA contrast", async ({ page }) => {
        await goToExpenses(page);
        const subtitle = page.getByText(/track and manage/i);
        await expect(subtitle).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, subtitle);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Subtitle contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("stats card title text meets WCAG AA contrast", async ({ page }) => {
        await goToExpenses(page);
        const cardTitle = page.getByText(/total expenses/i);
        await expect(cardTitle).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, cardTitle);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Card title contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("stats card value (currency amount) meets WCAG AA contrast", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-ContrastVal-${Date.now()}`, amount: 100 });
        try {
            await goToExpenses(page);

            // The large currency value in the stats card
            const cardValue = page.locator(".text-2xl.font-semibold").first();
            await expect(cardValue).toBeVisible();

            const { fg, bg, isLargeText } = await getColors(page, cardValue);
            const ratio = contrastRatio(fg, bg);
            // 2xl text is large text
            const threshold = WCAG_AA_LARGE;
            expect(
                ratio,
                `Card value contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
            ).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("table header text meets WCAG AA contrast", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-ContrastHdr-${Date.now()}` });
        try {
            await goToExpenses(page);

            // Get a column header text element
            const headerText = page.locator("th, [role='columnheader']")
                .getByText(/description/i)
                .first();
            await expect(headerText).toBeVisible();

            const { fg, bg, isLargeText } = await getColors(page, headerText);
            const ratio = contrastRatio(fg, bg);
            const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
            expect(
                ratio,
                `Header contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
            ).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("table cell description text meets WCAG AA contrast", async ({ page }) => {
        const desc = `E2E-ContrastCell-${Date.now()}`;
        const expense = await createExpense(page, { description: desc });
        try {
            await goToExpenses(page);

            const cellText = page.getByText(desc);
            await expect(cellText).toBeVisible({ timeout: 10_000 });

            const { fg, bg, isLargeText } = await getColors(page, cellText);
            const ratio = contrastRatio(fg, bg);
            const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
            expect(
                ratio,
                `Cell text contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
            ).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("status badge text meets WCAG AA contrast", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-ContrastBadge-${Date.now()}` });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const badge = row.getByText(/submitted/i);
            await expect(badge).toBeVisible();

            const { fg, bg, isLargeText } = await getColors(page, badge);
            const ratio = contrastRatio(fg, bg);
            const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
            expect(
                ratio,
                `Badge contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
            ).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("Add Expense button text meets WCAG AA contrast", async ({ page }) => {
        await goToExpenses(page);

        const addBtn = page.getByRole("button", { name: /add expense/i });
        await expect(addBtn).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, addBtn);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Add Expense button contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("muted text (e.g., vendor dash) meets WCAG AA contrast", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-ContrastMuted-${Date.now()}` });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            // Find a muted text element (vendor "—" or date text)
            const mutedText = row.locator(".text-muted-foreground").first();
            if (await mutedText.isVisible()) {
                const { fg, bg, isLargeText } = await getColors(page, mutedText);
                const ratio = contrastRatio(fg, bg);
                const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
                expect(
                    ratio,
                    `Muted text contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
                ).toBeGreaterThanOrEqual(threshold);
            }
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("type badge text meets WCAG AA contrast", async ({ page }) => {
        const expense = await createExpense(page, {
            description: `E2E-ContrastType-${Date.now()}`,
            expense_type: "business",
        });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const typeBadge = row.getByText(/business/i);
            await expect(typeBadge).toBeVisible();

            const { fg, bg, isLargeText } = await getColors(page, typeBadge);
            const ratio = contrastRatio(fg, bg);
            const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
            expect(
                ratio,
                `Type badge contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
            ).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteExpense(page, expense.id);
        }
    });
});
