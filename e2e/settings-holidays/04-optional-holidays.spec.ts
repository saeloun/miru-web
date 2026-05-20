/**
 * Holidays Settings — Optional Holidays.
 * Covers: toggle, configuration (total allowed, frequency), CRUD, summary strip.
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
// Use a dedicated year for optional holiday UI mutation tests to avoid parallel interference
const OPT_YEAR = new Date().getFullYear() - 1;
// Use a year with no seed data for empty-state tests
const EMPTY_YEAR = new Date().getFullYear() + 2;

test.describe("Holidays Settings — Optional Holidays", () => {
    test("optional holidays tab shows toggle", async ({ page }) => {
        await goToHolidays(page);
        await page.getByRole("button", { name: /optional holidays/i }).click();

        await expect(
            page.locator("button[type='button'] svg").first(),
        ).toBeVisible();
    });

    test("optional holidays config fields visible in edit mode", async ({ page }) => {
        await goToHolidays(page);
        await page.getByRole("button", { name: /optional holidays/i }).click();

        await page.getByRole("button", { name: /edit/i }).click();

        await expect(page.locator("input[type='number']")).toBeVisible({ timeout: 10_000 });
        await expect(page.locator("#allocationFrequency")).toBeAttached({ timeout: 5_000 });

        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("add and save optional holidays via API, verify in read mode", async ({ page }) => {
        const name = uniqueHolidayName("OptR");
        await upsertHolidays(page, TEST_YEAR, {
            enableOptional: true,
            totalOptional: 3,
            timePeriod: "per_year",
            optionalHolidays: [{ name, date: `${TEST_YEAR}-09-20` }],
        });

        try {
            await goToHolidaysAndWaitFor(page, name, { tab: "optional holidays" });
        } finally {
            await cleanupHolidaysByName(page, TEST_YEAR, [name]);
        }
    });

    test("summary strip shows optional holidays count when enabled", async ({ page }) => {
        await goToHolidays(page);
        await expect(page.getByText(/allowed per employee/i)).toBeVisible({ timeout: 10_000 });
    });

    test("empty state when no optional holidays configured", async ({ page }) => {
        await upsertHolidays(page, EMPTY_YEAR, {
            enableOptional: true,
            totalOptional: 1,
        });

        try {
            await goToHolidays(page);
            await page.locator("select").selectOption(String(EMPTY_YEAR));
            await page.getByRole("button", { name: /optional holidays/i }).click();

            await expect(
                page.getByText("No optional holidays configured"),
            ).toBeVisible({ timeout: 10_000 });
        } finally {
            // No holidays to clean up
        }
    });

    test("add optional holiday button creates a new empty row", async ({ page }) => {
        await goToHolidays(page);

        // Switch to Optional Holidays tab, then enter edit mode
        await page.getByRole("button", { name: /optional holidays/i }).click();
        await page.getByRole("button", { name: /edit/i }).click();

        // Wait for the "Add Optional Holiday" button
        const addBtn = page.getByRole("button", { name: "Add Optional Holiday" });
        await expect(addBtn).toBeVisible({ timeout: 10_000 });

        // Count existing name inputs
        const beforeCount = await page.locator("input[placeholder='Enter holiday name']").count();

        await addBtn.click();

        // A new row should appear
        const afterCount = await page.locator("input[placeholder='Enter holiday name']").count();
        expect(afterCount).toBe(beforeCount + 1);

        // The new row should have empty inputs
        const lastNameInput = page.locator("input[placeholder='Enter holiday name']").last();
        await expect(lastNameInput).toHaveValue("");

        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("delete optional holiday button removes a row in edit mode", async ({ page }) => {
        const name = uniqueHolidayName("DOpt");
        await upsertHolidays(page, OPT_YEAR, {
            enableOptional: true,
            totalOptional: 2,
            optionalHolidays: [{ name, date: `${OPT_YEAR}-10-20` }],
        });

        try {
            await goToHolidaysAndWaitFor(page, name, { tab: "optional holidays", year: OPT_YEAR });

            // Enter edit mode
            await page.getByRole("button", { name: /edit/i }).click();

            // Wait for edit mode inputs to appear
            await expect(page.locator("input[placeholder='Enter holiday name']").first()).toBeVisible({ timeout: 10_000 });

            // Count rows before delete
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
            await cleanupHolidaysByName(page, OPT_YEAR, [name]);
        }
    });
});
