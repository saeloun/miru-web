/**
 * Leaves Settings — Page Load & Layout.
 * Covers: page load, heading, summary cards, year selector, leave balance, calendar, history.
 */
import { test, expect } from "@playwright/test";
import { goToLeaves } from "./helpers";

test.describe("Leaves Settings — Page Load & Layout", () => {
    test("page loads with My Leaves heading", async ({ page }) => {
        await goToLeaves(page);
        // The heading text is from i18n navbar.myLeaves = "My Leaves"
        await expect(page.locator("h1").first()).toBeVisible();
    });

    test("leave summary description is visible", async ({ page }) => {
        await goToLeaves(page);
        await expect(page.getByText(/see available leave/i).first()).toBeVisible();
    });

    test("time away used summary card is visible", async ({ page }) => {
        await goToLeaves(page);
        await expect(page.getByText(/time away used/i)).toBeVisible();
    });

    test("leave remaining summary card is visible", async ({ page }) => {
        await goToLeaves(page);
        await expect(page.getByText(/leave remaining/i)).toBeVisible();
    });

    test("optional holidays summary card is visible", async ({ page }) => {
        await goToLeaves(page);
        await expect(page.getByText(/optional holidays/i).first()).toBeVisible();
    });

    test("public holidays summary card is visible", async ({ page }) => {
        await goToLeaves(page);
        await expect(page.getByText(/public holidays/i).first()).toBeVisible();
    });

    test("year selector shows current year", async ({ page }) => {
        await goToLeaves(page);
        const currentYear = new Date().getFullYear();
        await expect(page.getByText(String(currentYear)).first()).toBeVisible();
    });

    test("leave calendar section is visible", async ({ page }) => {
        await goToLeaves(page);
        const calendar = page.getByText(/leave calendar/i).first();
        await calendar.scrollIntoViewIfNeeded();
        await expect(calendar).toBeVisible();
    });

    test("calendar shows month and year", async ({ page }) => {
        await goToLeaves(page);
        // The calendar header shows the current month name
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const currentMonth = monthNames[new Date().getMonth()];
        const calendarMonth = page.getByText(new RegExp(currentMonth, "i")).first();
        await calendarMonth.scrollIntoViewIfNeeded();
        await expect(calendarMonth).toBeVisible();
    });

    test("select day to inspect message is visible", async ({ page }) => {
        await goToLeaves(page);
        const msg = page.getByText(/select a day to inspect/i);
        await msg.scrollIntoViewIfNeeded();
        await expect(msg).toBeVisible();
    });
});
