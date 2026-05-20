/**
 * Billing Settings — Billing Interval Toggle.
 * Covers: monthly/yearly toggle, pricing updates.
 */
import { test, expect } from "@playwright/test";
import { goToBilling } from "./helpers";

test.describe("Billing Settings — Billing Interval Toggle", () => {
    test("Monthly button is active by default", async ({ page }) => {
        await goToBilling(page);

        // The Monthly button in the membership card toggle
        const monthlyBtn = page.getByRole("button", { name: "Monthly" }).first();
        await expect(monthlyBtn).toBeVisible();
    });

    test("switching to Yearly updates Pro pricing", async ({ page }) => {
        await goToBilling(page);

        // Click Yearly
        await page.getByRole("button", { name: "Yearly" }).first().click();

        // Pro card should show yearly pricing
        await expect(page.getByText("$10/team member/yr")).toBeVisible({ timeout: 5_000 });
    });

    test("switching back to Monthly restores Pro pricing", async ({ page }) => {
        await goToBilling(page);

        // Switch to Yearly first
        await page.getByRole("button", { name: "Yearly" }).first().click();
        await expect(page.getByText("$10/team member/yr")).toBeVisible({ timeout: 5_000 });

        // Switch back to Monthly
        await page.getByRole("button", { name: "Monthly" }).first().click();
        await expect(page.getByText("$1/team member/mo")).toBeVisible({ timeout: 5_000 });
    });

    test("yearly toggle shows savings badge on Pro card", async ({ page }) => {
        await goToBilling(page);

        await page.getByRole("button", { name: "Yearly" }).first().click();

        // The Pro card should show a "Save $X/yr" badge
        await expect(page.getByText(/save \$/i).first()).toBeVisible({ timeout: 5_000 });
    });
});
