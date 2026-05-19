/**
 * Contrast — WCAG AA color contrast checks on key client page elements.
 * Covers manual test section 18 (WCAG AA Contrast).
 *
 * Uses getComputedStyle to measure foreground vs background contrast ratios.
 * WCAG AA requires ≥4.5 for normal text and ≥3.0 for large text (≥18px bold or ≥24px).
 */
import { test, expect } from "@playwright/test";
import {
    goToClients,
    createClient,
    deleteClientApi,
    uniqueClientName,
    contrastRatio,
    WCAG_AA_NORMAL,
    WCAG_AA_LARGE,
} from "./helpers";

/**
 * Evaluate fg/bg colors of a locator.
 * Walks up the DOM for a non-transparent bg.
 */
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

test.describe("Clients — Contrast Checks", () => {
    // §18.1 — Description subtitle contrast
    test("description subtitle meets WCAG AA contrast", async ({ page }) => {
        await goToClients(page);
        const subtitle = page.getByText(/manage/i).first();
        await expect(subtitle).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, subtitle);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Subtitle contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    // §18.2 — Stats card value text contrast
    test("stats card value text meets WCAG AA contrast", async ({ page }) => {
        await goToClients(page);
        const statValue = page.locator("[class*='text-2xl'], [class*='text-3xl'], .tabular-nums").first();
        await expect(statValue).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, statValue);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Stats value contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    // §18.6 — Add New Client button text contrast
    test("Add New Client button text meets WCAG AA contrast", async ({ page }) => {
        await goToClients(page);
        const btn = page.getByRole("button", { name: /add new client/i });
        await expect(btn).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, btn);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Add New Client button contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    // §18.4 — Client name text in table contrast
    test("client name text in table meets WCAG AA contrast", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-CtrName") });
        try {
            await goToClients(page);

            const nameEl = page.locator("tbody tr").filter({ hasText: client.name }).locator("td").first().locator("p, span, a").first();
            await expect(nameEl).toBeVisible({ timeout: 10_000 });

            const { fg, bg, isLargeText } = await getColors(page, nameEl);
            const ratio = contrastRatio(fg, bg);
            const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
            expect(
                ratio,
                `Client name contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
            ).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteClientApi(page, client.id);
        }
    });

    // §18.5 — Muted email text contrast
    test("muted email text meets WCAG AA contrast", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-CtrMail") });
        try {
            await goToClients(page);

            const row = page.locator("tbody tr").filter({ hasText: client.name });
            await expect(row).toBeVisible({ timeout: 10_000 });

            // Email is typically the muted text element in the first cell
            const emailEl = row.locator("td").first().locator("[class*='muted'], [class*='text-sm']").first();
            await expect(emailEl).toBeVisible();

            const { fg, bg, isLargeText } = await getColors(page, emailEl);
            const ratio = contrastRatio(fg, bg);
            const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
            expect(
                ratio,
                `Muted email contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
            ).toBeGreaterThanOrEqual(threshold);
        } finally {
            await deleteClientApi(page, client.id);
        }
    });
});
