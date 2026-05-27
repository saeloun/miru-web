/**
 * Leaves Settings — Calendar Interaction.
 * Covers: calendar rendering, date selection, empty date message.
 */
import { test, expect } from "@playwright/test";
import { goToLeaves } from "./helpers";

test.describe("Leaves Settings — Calendar", () => {
    test("calendar renders with day cells", async ({ page }) => {
        await goToLeaves(page);

        // The calendar should have day cells — look for the calendar component
        const calendarSection = page.getByText(/leave calendar/i).first();
        await calendarSection.scrollIntoViewIfNeeded();

        // Calendar should have day buttons/cells
        const dayCells = page.locator("table td button, [role='gridcell'] button");
        const count = await dayCells.count();
        expect(count).toBeGreaterThan(0);
    });

    test("clicking a date shows the date detail panel", async ({ page }) => {
        await goToLeaves(page);

        // Scroll to the calendar
        const calendarSection = page.getByText(/leave calendar/i).first();
        await calendarSection.scrollIntoViewIfNeeded();

        // Click a day cell in the calendar
        const dayCell = page.locator("table td button, [role='gridcell'] button").first();
        await dayCell.click();

        // The right panel should show a date label (e.g., "Mon, 1 Jan")
        // and either entries or "Nothing booked for this date"
        await expect(
            page.getByText(/nothing booked for this date|recorded time away/i).first(),
        ).toBeVisible({ timeout: 5_000 });
    });

    test("empty date shows nothing booked message", async ({ page }) => {
        await goToLeaves(page);

        // Scroll to calendar
        const calendarSection = page.getByText(/leave calendar/i).first();
        await calendarSection.scrollIntoViewIfNeeded();

        // The detail panel should show "Nothing booked" or "No leave or holiday" for the default date
        // (most dates won't have entries)
        await expect(
            page.getByText(/nothing booked|no leave or holiday/i).first(),
        ).toBeAttached({ timeout: 10_000 });
    });
});
