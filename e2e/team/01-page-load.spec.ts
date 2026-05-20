/**
 * Page Load & Layout — team page loads, stats cards, error state.
 * Covers manual test sections 1 and 2.
 */
import { test, expect } from "@playwright/test";
import { goToTeam } from "./helpers";

test.describe("Team Page Load & Layout", () => {
    test("page loads without errors", async ({ page }) => {
        await goToTeam(page);
        await expect(page.getByText(/team overview/i).first()).toBeVisible();
    });

    test("shows error state when API fails", async ({ page }) => {
        await page.route("**/api/v1/team*", route =>
            route.fulfill({ status: 500, body: "Internal Server Error" }),
        );
        await page.goto("/team");
        await expect(page.getByText(/failed to load team members/i)).toBeVisible({ timeout: 15_000 });
    });

    test("stats cards display Total Members, Total Hours, and Active Projects", async ({ page }) => {
        await goToTeam(page);
        await expect(page.getByText(/total members/i)).toBeVisible();
        await expect(page.getByText(/total hours/i)).toBeVisible();
        await expect(page.getByText(/active projects/i)).toBeVisible();
    });

    test("team table is visible with data", async ({ page }) => {
        await goToTeam(page);
        await expect(page.locator("table")).toBeVisible();
    });

    /**
     * Regression test for: Team Status column shows empty badges
     * Related issue: Status column not visible — jbuilder sends boolean instead of string
     * This test will FAIL on the broken code and PASS once the fix lands.
     */
    test("status column shows valid status badges (Active or Invited)", async ({ page }) => {
        await goToTeam(page);

        // Every row in the table should have a status badge with recognizable text
        const rows = page.locator("tbody tr");
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);

        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            // The status badge should contain "Active", "Inactive", or "Invited" — never empty or "true"/"false"
            const statusCell = row.locator("td").nth(5); // Status is the 6th column (0-indexed)
            const badgeText = await statusCell.innerText();
            expect(
                badgeText.trim(),
                `Row ${i} status badge is empty or invalid: "${badgeText}"`,
            ).toMatch(/^(Active|Inactive|Invited)$/i);
        }
    });

    /**
     * Regression test for: Hours and Billable columns always show 0.0h / 0%
     * Related issue: Backend does not compute hoursLogged, billableHours, or projects for team members
     * This test will FAIL on the broken code and PASS once the fix lands.
     *
     * Requires: at least one team member with logged timesheet entries in the seed data.
     */
    test("hours column shows non-zero values for members with timesheet entries", async ({ page }) => {
        await goToTeam(page);

        const rows = page.locator("tbody tr");
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);

        // Collect all hours values from the Hours column (5th column, 0-indexed = 4)
        let hasNonZeroHours = false;
        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            const hoursCell = row.locator("td").nth(4); // Hours is the 5th column
            const hoursText = await hoursCell.innerText();
            // Should contain a number like "12.5h" — extract the numeric part
            const match = hoursText.match(/([\d.]+)h/);
            if (match && parseFloat(match[1]) > 0) {
                hasNonZeroHours = true;
                break;
            }
        }

        expect(
            hasNonZeroHours,
            "At least one team member should have non-zero hours logged, but all show 0.0h. " +
            "The backend may not be returning hoursLogged data in the team API response.",
        ).toBe(true);
    });

    /**
     * Regression test for: Total Hours stats card always shows 0h
     * Related issue: Same root cause — backend doesn't send hours data
     */
    test("Total Hours stats card shows non-zero value when members have entries", async ({ page }) => {
        await goToTeam(page);

        // Find the Total Hours card value
        const totalHoursCard = page.locator("div").filter({ hasText: /total hours/i }).first();
        await expect(totalHoursCard).toBeVisible();

        const cardText = await totalHoursCard.innerText();
        // Extract the hours number — should not be "0h"
        const match = cardText.match(/(\d+)h/);
        expect(
            match && parseInt(match[1]) > 0,
            `Total Hours stats card shows "${cardText}" — expected a non-zero value. ` +
            "The backend may not be returning hoursLogged data in the team API response.",
        ).toBe(true);
    });
});
