/**
 * Holidays Settings — Public Holidays CRUD.
 * Covers: read mode table, edit mode, add/delete/save/cancel, validation.
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
// Use a year with no seed data for empty-state tests
const EMPTY_YEAR = new Date().getFullYear() + 2;

test.describe("Holidays Settings — Public Holidays", () => {
    test("displays public holidays in a table in read mode", async ({ page }) => {
        const name = uniqueHolidayName("Tbl");
        await upsertHolidays(page, TEST_YEAR, {
            nationalHolidays: [{ name, date: `${TEST_YEAR}-08-20` }],
        });

        try {
            await goToHolidaysAndWaitFor(page, name);
            await expect(page.locator("th").first()).toBeVisible();
        } finally {
            await cleanupHolidaysByName(page, TEST_YEAR, [name]);
        }
    });

    test("empty state when no public holidays exist", async ({ page }) => {
        await goToHolidays(page);
        await page.locator("select").selectOption(String(EMPTY_YEAR));
        await expect(
            page.getByText("No public holidays configured"),
        ).toBeVisible({ timeout: 10_000 });
    });

    test("entering edit mode shows form rows and action buttons", async ({ page }) => {
        await goToHolidays(page);

        await page.getByRole("button", { name: /edit/i }).click();
        await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible();
        await expect(page.getByRole("button", { name: "Add Holiday" })).toBeVisible();

        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("add holiday button creates a new empty row", async ({ page }) => {
        await goToHolidays(page);

        await page.getByRole("button", { name: /edit/i }).click();
        await expect(page.getByRole("button", { name: "Add Holiday" })).toBeVisible({ timeout: 5_000 });

        // Count existing name inputs
        const beforeCount = await page.locator("input[placeholder='Enter holiday name']").count();

        await page.getByRole("button", { name: "Add Holiday" }).click();

        // A new row should appear
        const afterCount = await page.locator("input[placeholder='Enter holiday name']").count();
        expect(afterCount).toBe(beforeCount + 1);

        // The new row should have empty inputs
        const lastNameInput = page.locator("input[placeholder='Enter holiday name']").last();
        await expect(lastNameInput).toHaveValue("");

        const lastDateInput = page.locator("input[placeholder='Select date']").last();
        await expect(lastDateInput).toHaveValue("");

        // A delete button should exist for the new row
        const deleteButtons = page.locator("button[aria-label='Delete holiday']");
        expect(await deleteButtons.count()).toBe(afterCount);

        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("delete button removes a row in edit mode", async ({ page }) => {
        const name = uniqueHolidayName("Del");
        await upsertHolidays(page, TEST_YEAR, {
            nationalHolidays: [{ name, date: `${TEST_YEAR}-08-22` }],
        });

        try {
            await goToHolidaysAndWaitFor(page, name);

            await page.getByRole("button", { name: /edit/i }).click();
            await expect(page.getByRole("button", { name: "Add Holiday" })).toBeVisible({ timeout: 5_000 });

            // Count existing rows
            const beforeCount = await page.locator("input[placeholder='Enter holiday name']").count();
            expect(beforeCount).toBeGreaterThan(0);

            // Click the last delete button
            const deleteButtons = page.locator("button[aria-label='Delete holiday']");
            await deleteButtons.last().click();

            // One fewer row
            const afterCount = await page.locator("input[placeholder='Enter holiday name']").count();
            expect(afterCount).toBe(beforeCount - 1);

            await page.getByRole("button", { name: /cancel/i }).click();
        } finally {
            await cleanupHolidaysByName(page, TEST_YEAR, [name]);
        }
    });

    test("cancel discards unsaved changes", async ({ page }) => {
        const name = uniqueHolidayName("Keep");
        await upsertHolidays(page, TEST_YEAR, {
            nationalHolidays: [{ name, date: `${TEST_YEAR}-08-28` }],
        });

        try {
            await goToHolidaysAndWaitFor(page, name);

            await page.getByRole("button", { name: /edit/i }).click();
            await expect(page.getByRole("button", { name: "Add Holiday" })).toBeVisible({ timeout: 5_000 });

            await page.getByRole("button", { name: "Add Holiday" }).click();

            await page.getByRole("button", { name: /cancel/i }).click();

            await expect(page.getByRole("button", { name: /^edit$/i })).toBeVisible({ timeout: 10_000 });

            await expect(page.getByText(name)).toBeVisible();
        } finally {
            await cleanupHolidaysByName(page, TEST_YEAR, [name]);
        }
    });

    test("validation error for empty name on save", async ({ page }) => {
        await goToHolidays(page);

        await page.getByRole("button", { name: /edit/i }).click();
        await expect(page.getByRole("button", { name: "Add Holiday" })).toBeVisible({ timeout: 5_000 });

        await page.getByRole("button", { name: "Add Holiday" }).click();

        // Open the date picker
        const dateInput = page.locator("input[placeholder='Select date']").last();
        await dateInput.click();

        const anyDay = page.locator(".react-datepicker__day:not(.react-datepicker__day--outside-month)").nth(9);
        await expect(anyDay).toBeVisible({ timeout: 5_000 });
        await anyDay.click();

        // Save without filling name
        await page.getByRole("button", { name: /save changes/i }).click();

        await expect(
            page.locator(".text-destructive").first(),
        ).toBeVisible({ timeout: 10_000 });

        await page.getByRole("button", { name: /cancel/i }).click({ timeout: 10_000 });
    });
});
