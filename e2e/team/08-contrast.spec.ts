/**
 * Contrast — WCAG AA color contrast checks on key team page elements.
 * Covers manual test section 13.
 */
import { test, expect } from "@playwright/test";
import { goToTeam, contrastRatio, WCAG_AA_NORMAL, WCAG_AA_LARGE } from "./helpers";

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

test.describe("Team — Contrast Checks", () => {
    test("description subtitle meets WCAG AA contrast", async ({ page }) => {
        await goToTeam(page);
        const subtitle = page.getByText(/team overview/i).first();
        await expect(subtitle).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, subtitle);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Subtitle contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    test("stats card value text meets WCAG AA contrast", async ({ page }) => {
        await goToTeam(page);
        const statValue = page.locator(".text-2xl.font-bold").first();
        await expect(statValue).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, statValue);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Stats value contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    test("Invite Member button text meets WCAG AA contrast", async ({ page }) => {
        await goToTeam(page);
        const btn = page.getByRole("button", { name: /invite member/i });
        await expect(btn).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, btn);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Invite button contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    test("member name text in table meets WCAG AA contrast", async ({ page }) => {
        await goToTeam(page);
        const nameEl = page.locator("tbody tr").first().locator("td").first().locator("p.font-medium").first();
        await expect(nameEl).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, nameEl);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Member name contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });

    test("member email text meets WCAG AA contrast", async ({ page }) => {
        await goToTeam(page);
        const emailEl = page.locator("tbody tr").first().locator("td").first().locator("[class*='muted']").first();
        await expect(emailEl).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(page, emailEl);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(ratio, `Email contrast ${ratio.toFixed(2)} < ${threshold}`).toBeGreaterThanOrEqual(threshold);
    });
});
