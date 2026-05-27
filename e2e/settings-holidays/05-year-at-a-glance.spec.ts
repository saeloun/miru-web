/**
 * Holidays Settings — Year at a Glance.
 * Covers: calendar grid rendering, holiday highlighting, month labels, weekday headers.
 */
import { test, expect } from "@playwright/test";
import {
    goToHolidays,
    goToHolidaysAndWaitFor,
    upsertHolidays,
    cleanupHolidaysByName,
    uniqueHolidayName,
} from "./helpers";

const TEST_YEAR = new Date().getFullYear();

test.describe("Holidays Settings — Year at a Glance", () => {
    test("calendar grid renders 12 months", async ({ page }) => {
        await goToHolidays(page);
        await page.getByRole("button", { name: /year at a glance/i }).click();

        const calendar = page.locator("[data-testid='holidays-calendar']");
        await expect(calendar).toBeVisible({ timeout: 10_000 });

        const monthCards = calendar.locator("> div");
        await expect(monthCards).toHaveCount(12);
    });

    test("weekday headers are visible in each month", async ({ page }) => {
        await goToHolidays(page);
        await page.getByRole("button", { name: /year at a glance/i }).click();

        const calendar = page.locator("[data-testid='holidays-calendar']");
        await expect(calendar).toBeVisible();

        const firstMonth = calendar.locator("> div").first();
        await expect(firstMonth.getByText("S").first()).toBeVisible();
        await expect(firstMonth.getByText("M").first()).toBeVisible();
    });

    test("holiday days are highlighted on the calendar", async ({ page }) => {
        const name = uniqueHolidayName("HiLt");
        await upsertHolidays(page, TEST_YEAR, {
            nationalHolidays: [{ name, date: `${TEST_YEAR}-06-15` }],
        });

        try {
            // Use goToHolidaysAndWaitFor on the public tab first to confirm data loaded
            await goToHolidaysAndWaitFor(page, name);

            // Now switch to glance tab
            await page.getByRole("button", { name: /year at a glance/i }).click();

            const holidayDay = page.locator(
                `[data-testid="holiday-calendar-day-${TEST_YEAR}-06-15"]`,
            );
            await expect(holidayDay).toBeVisible({ timeout: 10_000 });
        } finally {
            await cleanupHolidaysByName(page, TEST_YEAR, [name]);
        }
    });

    test("newly created holiday appears on the calendar", async ({ page }) => {
        const name = uniqueHolidayName("Glnc");
        await upsertHolidays(page, TEST_YEAR, {
            nationalHolidays: [{ name, date: `${TEST_YEAR}-08-25` }],
        });

        try {
            await goToHolidaysAndWaitFor(page, name);
            await page.getByRole("button", { name: /year at a glance/i }).click();

            await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

            await expect(
                page.locator(`[data-testid="holiday-calendar-day-${TEST_YEAR}-08-25"]`),
            ).toBeVisible();
        } finally {
            await cleanupHolidaysByName(page, TEST_YEAR, [name]);
        }
    });

    test("holiday names are listed under months", async ({ page }) => {
        const name = uniqueHolidayName("Lstd");
        await upsertHolidays(page, TEST_YEAR, {
            nationalHolidays: [{ name, date: `${TEST_YEAR}-06-20` }],
        });

        try {
            await goToHolidaysAndWaitFor(page, name);
            await page.getByRole("button", { name: /year at a glance/i }).click();

            await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
        } finally {
            await cleanupHolidaysByName(page, TEST_YEAR, [name]);
        }
    });

    test("both public and optional holidays appear on the calendar", async ({ page }) => {
        const pubName = uniqueHolidayName("PGl");
        const optName = uniqueHolidayName("OGl");

        await upsertHolidays(page, TEST_YEAR, {
            enableOptional: true,
            totalOptional: 2,
            nationalHolidays: [{ name: pubName, date: `${TEST_YEAR}-08-26` }],
            optionalHolidays: [{ name: optName, date: `${TEST_YEAR}-08-27` }],
        });

        try {
            // Wait for the public holiday to be visible on the public tab
            await goToHolidaysAndWaitFor(page, pubName);
            await page.getByRole("button", { name: /year at a glance/i }).click();

            await expect(page.getByText(pubName)).toBeVisible({ timeout: 10_000 });
            await expect(page.getByText(optName)).toBeVisible({ timeout: 10_000 });
        } finally {
            await cleanupHolidaysByName(page, TEST_YEAR, [pubName, optName]);
        }
    });
});
