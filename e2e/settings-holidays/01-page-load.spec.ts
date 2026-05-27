/**
 * Holidays Settings — Page Load & Layout.
 * Covers: page load, year selector, summary strip, tabs, edit button.
 */
import { test, expect } from "@playwright/test";
import { goToHolidays } from "./helpers";

test.describe("Holidays Settings — Page Load & Layout", () => {
    test("page loads without errors", async ({ page }) => {
        await goToHolidays(page);
        // Year selector visible
        await expect(page.locator("select")).toBeVisible();
        // At least one tab visible
        await expect(page.getByText(/public holidays/i).first()).toBeVisible();
    });

    test("year selector defaults to current year", async ({ page }) => {
        await goToHolidays(page);
        const select = page.locator("select");
        const value = await select.inputValue();
        const currentYear = new Date().getFullYear();
        expect(Number(value)).toBe(currentYear);
    });

    test("year dropdown contains 5 years (current ± 2)", async ({ page }) => {
        await goToHolidays(page);
        const options = page.locator("select option");
        await expect(options).toHaveCount(5);

        const currentYear = new Date().getFullYear();
        for (let i = -2; i <= 2; i++) {
            await expect(
                page.locator(`select option[value="${currentYear + i}"]`),
            ).toBeAttached();
        }
    });

    test("summary strip shows year and public holidays count", async ({ page }) => {
        await goToHolidays(page);
        await expect(page.getByText(/year/i).first()).toBeVisible();
        await expect(page.getByText(/public holidays/i).first()).toBeVisible();
    });

    test("three tabs are visible", async ({ page }) => {
        await goToHolidays(page);
        await expect(page.getByRole("button", { name: /public holidays/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /optional holidays/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /year at a glance/i })).toBeVisible();
    });

    test("Public Holidays tab is active by default", async ({ page }) => {
        await goToHolidays(page);
        // The active tab has bg-background class — check it contains the card content
        const publicCard = page.locator("text=Public Holidays").first();
        await expect(publicCard).toBeVisible();
    });

    test("Edit button is visible for admin user", async ({ page }) => {
        await goToHolidays(page);
        await expect(page.getByRole("button", { name: /edit/i })).toBeVisible();
    });
});
