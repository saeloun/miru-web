/**
 * Holidays Settings — Year Selector.
 * Covers: changing year updates displayed data.
 */
import { test, expect } from "@playwright/test";
import { goToHolidays, upsertHolidays, cleanupHolidaysForYear, uniqueHolidayName } from "./helpers";

test.describe("Holidays Settings — Year Selector", () => {
    test("changing year updates the holiday list", async ({ page }) => {
        const currentYear = new Date().getFullYear();
        const otherYear = currentYear - 1;
        const name = uniqueHolidayName("Prev");

        await upsertHolidays(page, otherYear, {
            nationalHolidays: [{ name, date: `${otherYear}-01-15` }],
        });

        try {
            await goToHolidays(page);

            // Switch to the other year
            await page.locator("select").selectOption(String(otherYear));

            // The component re-renders with cached holidays for the new year
            await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });
        } finally {
            await cleanupHolidaysForYear(page, otherYear);
        }
    });

    test("switching to a year with no holidays shows empty state", async ({ page }) => {
        const currentYear = new Date().getFullYear();
        const emptyYear = currentYear - 2;

        // Ensure the year is clean
        await cleanupHolidaysForYear(page, emptyYear);

        await goToHolidays(page);
        await page.locator("select").selectOption(String(emptyYear));

        // Should show the empty state for public holidays
        await expect(
            page.getByText("No public holidays configured"),
        ).toBeVisible({ timeout: 10_000 });
    });
});
