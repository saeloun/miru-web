/**
 * Profile Settings — WCAG AA Contrast Checks.
 * Covers: card headers, labels, user name, buttons.
 */
import { test, expect } from "@playwright/test";
import { goToProfile, goToProfileEdit, contrastRatio, getColors, WCAG_AA_NORMAL, WCAG_AA_LARGE } from "./helpers";

test.describe("Profile Settings — Contrast Checks", () => {
    test("Personal Information card header meets WCAG AA contrast", async ({ page }) => {
        await goToProfile(page);
        const header = page.getByText(/personal information/i).first();
        await expect(header).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(header);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Card header contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("user name heading meets WCAG AA contrast", async ({ page }) => {
        await goToProfile(page);
        const heading = page.locator("h2").first();
        await expect(heading).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(heading);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Name heading contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("field label text meets WCAG AA contrast", async ({ page }) => {
        await goToProfile(page);
        const label = page.getByText(/phone number/i).first();
        await expect(label).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(label);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Label contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("Social Profiles card header meets WCAG AA contrast", async ({ page }) => {
        await goToProfile(page);
        const header = page.getByText(/social profiles/i);
        await expect(header).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(header);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Social card header contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("Security card header meets WCAG AA contrast", async ({ page }) => {
        await goToProfile(page);
        const header = page.getByText(/security/i).first();
        await expect(header).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(header);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Security header contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("Change Password button meets WCAG AA contrast", async ({ page }) => {
        await goToProfile(page);
        const btn = page.getByRole("button", { name: /change password/i });
        await expect(btn).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(btn);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Button contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("edit page form label meets WCAG AA contrast", async ({ page }) => {
        await goToProfileEdit(page);
        const label = page.locator("label[for='first_name']");
        await expect(label).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(label);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Edit form label contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });
});
