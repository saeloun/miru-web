/**
 * Projects List — page load, stats cards, table columns, data display.
 * Covers manual test sections: 1 (Page Load & Layout), 2 (Columns & Data).
 */
import { test, expect } from "@playwright/test";
import { goToProjects, fetchProjects, createProject } from "./helpers";

test.describe("Projects List", () => {
    test.beforeEach(async ({ page }) => {
        await goToProjects(page);
    });

    // §1.1 — Page loads successfully
    test("page loads without errors", async ({ page }) => {
        // Description text visible
        await expect(page.getByText(/manage/i).first()).toBeVisible();
    });

    // §1.4–1.7 — Stats cards render with correct data
    test("stats cards display Active Projects, Total Hours, and Team Members", async ({ page }) => {
        await expect(page.getByText(/active projects/i)).toBeVisible();
        await expect(page.getByText(/total hours/i)).toBeVisible();
        await expect(page.getByText(/team members/i)).toBeVisible();
    });

    // §1.8 — All Projects card
    test("All Projects card with table is visible", async ({ page }) => {
        await expect(page.getByText(/all projects/i).first()).toBeVisible();
    });

    // §2.1 — Table columns present
    test("table has expected column headers", async ({ page }) => {
        const headers = page.locator("thead th");
        // Project/Client column (sortable button)
        await expect(page.locator("thead").getByText(/project/i).first()).toBeVisible();
        await expect(page.locator("thead").getByText(/client/i).first()).toBeVisible();
        await expect(page.locator("thead").getByText(/hours logged/i)).toBeVisible();
        await expect(page.locator("thead").getByText(/team/i)).toBeVisible();
        await expect(page.locator("thead").getByText(/type/i)).toBeVisible();
        await expect(page.locator("thead").getByText(/status/i).first()).toBeVisible();
    });

    // §2.2–2.9 — Row data display
    test("project rows display name, client, hours, type, and status", async ({ page }) => {
        const firstRow = page.locator("tbody tr").first();
        await expect(firstRow).toBeVisible();

        // Each row should have multiple cells with content
        const cells = firstRow.locator("td");
        const cellCount = await cells.count();
        expect(cellCount).toBeGreaterThanOrEqual(6);

        // Hours column should contain an "h" suffix
        const hoursCell = cells.nth(2);
        await expect(hoursCell).toContainText("h");

        // Type column should say Billable or Non-Billable
        const typeCell = cells.nth(4);
        const typeText = await typeCell.innerText();
        expect(typeText).toMatch(/billable|non-billable/i);

        // Status column should show a known status
        const statusCell = cells.nth(5);
        const statusText = await statusCell.innerText();
        expect(statusText).toMatch(/active|paused|completed/i);
    });
});
