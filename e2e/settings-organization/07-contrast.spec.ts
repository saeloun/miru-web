/**
 * Organization Settings — WCAG AA Contrast Checks.
 * Covers: card headers, field labels, field values, buttons, badge.
 */
import { test, expect } from "@playwright/test";
import {
    goToOrgSettings,
    goToOrgEdit,
    contrastRatio,
    getColors,
    WCAG_AA_NORMAL,
    WCAG_AA_LARGE,
} from "./helpers";

test.describe("Organization Settings — Contrast Checks", () => {
    // --- Details page ---

    test("Edit Settings button text meets WCAG AA contrast", async ({ page }) => {
        await goToOrgSettings(page);

        const btn = page.getByRole("button", { name: /edit settings/i });
        await expect(btn).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(btn);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Edit Settings button contrast ${ratio.toFixed(2)} < ${threshold} (fg=${fg}, bg=${bg})`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("Company Profile card header meets WCAG AA contrast", async ({ page }) => {
        await goToOrgSettings(page);

        const header = page.getByText(/company profile/i);
        await expect(header).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(header);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Card header contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("company name heading meets WCAG AA contrast", async ({ page }) => {
        await goToOrgSettings(page);

        const heading = page.locator("h2").first();
        await expect(heading).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(heading);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Company name contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("field label text meets WCAG AA contrast", async ({ page }) => {
        await goToOrgSettings(page);

        const label = page.getByText(/business phone/i);
        await expect(label).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(label);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Field label contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("standard rate value meets WCAG AA contrast", async ({ page }) => {
        await goToOrgSettings(page);

        // The rate is displayed as a large bold number
        const rateValue = page.getByText(/\/ hour/i).locator("xpath=preceding-sibling::span").first();
        // Fallback: just check the rate container
        const rateContainer = page.getByText(/\/ hour/i).locator("..").locator("span").first();
        const target = (await rateValue.count()) > 0 ? rateValue : rateContainer;
        await expect(target).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(target);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Rate value contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    // --- Edit page ---

    test("Cancel button text meets WCAG AA contrast", async ({ page }) => {
        await goToOrgEdit(page);

        const btn = page.getByRole("button", { name: /cancel/i });
        await expect(btn).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(btn);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Cancel button contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("form section header meets WCAG AA contrast", async ({ page }) => {
        await goToOrgEdit(page);

        // Look for a section title — they use h3 with uppercase text
        const sectionHeader = page.locator("h3").filter({ hasText: /company/i }).first();
        await expect(sectionHeader).toBeVisible({ timeout: 10_000 });

        const { fg, bg, isLargeText } = await getColors(sectionHeader);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Section header contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("form label text meets WCAG AA contrast", async ({ page }) => {
        await goToOrgEdit(page);

        // Find a label element
        const label = page.locator("label").filter({ hasText: /company name/i }).first();
        await expect(label).toBeVisible({ timeout: 10_000 });

        const { fg, bg, isLargeText } = await getColors(label);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Form label contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });
});
