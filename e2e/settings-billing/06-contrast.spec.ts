/**
 * Billing Settings — WCAG AA Contrast Checks.
 * Covers: card headers, plan labels, buttons, muted text, pricing text.
 */
import { test, expect } from "@playwright/test";
import {
    goToBilling,
    contrastRatio,
    getColors,
    WCAG_AA_NORMAL,
    WCAG_AA_LARGE,
} from "./helpers";

test.describe("Billing Settings — Contrast Checks", () => {
    test("Membership card title meets WCAG AA contrast", async ({ page }) => {
        await goToBilling(page);

        const title = page.getByText(/membership/i).first();
        await expect(title).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(title);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Membership title contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("Current Plan label meets WCAG AA contrast", async ({ page }) => {
        await goToBilling(page);

        const label = page.getByText(/current plan/i);
        await expect(label).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(label);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Current Plan label contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("hero title meets WCAG AA contrast", async ({ page }) => {
        await goToBilling(page);

        const heroTitle = page.getByText(/pick the package that fits now/i);
        await expect(heroTitle).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(heroTitle);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Hero title contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("Free plan card heading meets WCAG AA contrast", async ({ page }) => {
        await goToBilling(page);

        const heading = page.getByRole("heading", { name: "Free" }).first();
        await expect(heading).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(heading);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Free plan heading contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("Pro plan card heading meets WCAG AA contrast", async ({ page }) => {
        await goToBilling(page);

        const heading = page.getByRole("heading", { name: "Pro" }).first();
        await expect(heading).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(heading);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Pro plan heading contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("$0 price text meets WCAG AA contrast", async ({ page }) => {
        await goToBilling(page);

        const price = page.getByText("$0").first();
        await expect(price).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(price);
        const ratio = contrastRatio(fg, bg);
        // Price text is 2xl font-semibold — likely large text
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `$0 price contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("feature table header meets WCAG AA contrast", async ({ page }) => {
        await goToBilling(page);

        const header = page.locator("th").first();
        await expect(header).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(header);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Table header contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });

    test("highlight card title meets WCAG AA contrast", async ({ page }) => {
        await goToBilling(page);

        const title = page.getByText(/more seats without admin pain/i);
        await expect(title).toBeVisible();

        const { fg, bg, isLargeText } = await getColors(title);
        const ratio = contrastRatio(fg, bg);
        const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
        expect(
            ratio,
            `Highlight title contrast ${ratio.toFixed(2)} < ${threshold}`,
        ).toBeGreaterThanOrEqual(threshold);
    });
});
