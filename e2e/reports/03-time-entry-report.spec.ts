/**
 * Time Entry Report — filters, date ranges, grouping, export, data display.
 * Covers manual test sections: 6 (Individual Report Pages - Time Entry Report).
 */
import { test, expect } from "@playwright/test";
import { goToReport, createTimesheetEntry, deleteTimesheetEntry, expectToast } from "./helpers";

test.describe("Time Entry Report", () => {
    test("time entry report loads with proper header and controls", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Check header
        await expect(page.locator("h1").filter({ hasText: /time reports/i })).toBeVisible();
        await expect(page.getByText(/review.*hours.*logged/i)).toBeVisible();

        // Check main controls — Radix Select triggers have role="combobox"
        await expect(page.locator("[role='combobox']").first()).toBeVisible();
        // Date range button shows date range text with year
        await expect(page.locator("button").filter({ has: page.locator("svg") }).filter({ hasText: /\d{4}|pick.*date/i }).first()).toBeVisible();
    });

    test("date range preset selector works", async ({ page }) => {
        await goToReport(page, "time-entry");

        // The date preset selector is a Radix Select inside the report header
        // Skip the language selector (first combobox) — target by the container
        const headerControls = page.locator(".max-w-7xl, .border-b").filter({ hasText: /time reports/i });
        const presetSelector = headerControls.locator("[role='combobox']").first();
        await expect(presetSelector).toBeVisible();

        // Verify it shows the default value (This Month)
        await expect(presetSelector).toContainText(/this month/i);

        // Click to open dropdown
        await presetSelector.click();
        await page.waitForTimeout(300);

        // Radix Select renders options in a portal with role="listbox"
        const listbox = page.locator("[role='listbox']");
        await expect(listbox).toBeVisible({ timeout: 5000 });

        // Check for preset options
        await expect(listbox.getByText(/Last Month/)).toBeVisible();
        await expect(listbox.getByText(/This Quarter/)).toBeVisible();
        await expect(listbox.getByText(/Custom/)).toBeVisible();

        // Select a different preset
        await listbox.getByText(/Last Month/).click();
    });

    test("custom date range picker works", async ({ page }) => {
        await goToReport(page, "time-entry");

        // The date range button shows dates like "Apr 01, 2026 - Apr 21, 2026" or "Pick a date range"
        // It's a Button inside a PopoverTrigger — find it by the CalendarIcon SVG inside
        const dateRangeButton = page.locator("button").filter({ has: page.locator("svg") }).filter({ hasText: /\d{4}|pick.*date/i }).first();
        await expect(dateRangeButton).toBeVisible();

        await dateRangeButton.click();

        // Calendar popup should appear (Radix Popover renders a grid of day buttons)
        await expect(page.locator("[role='grid']").first()).toBeVisible({ timeout: 5000 });

        // Close the calendar by pressing Escape
        await page.keyboard.press("Escape");
    });

    test("group by selector changes grouping", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Find the group by selector
        const groupBySelector = page.locator("select, [role='combobox']").filter({ hasText: /group.*by|client|project|team/i }).first();
        await expect(groupBySelector).toBeVisible();

        // Click to open dropdown
        await groupBySelector.click();

        // Check for grouping options
        await expect(page.locator("[role='option']").filter({ hasText: /client/i })).toBeVisible();
        await expect(page.locator("[role='option']").filter({ hasText: /project/i })).toBeVisible();
        await expect(page.locator("[role='option']").filter({ hasText: /team.*member/i })).toBeVisible();

        // Select project grouping
        await page.locator("[role='option']").filter({ hasText: /project/i }).click();

        // Selector should update
        await expect(groupBySelector).toContainText(/project/i);
    });

    test("client filter dropdown works", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Client filter is a DropdownMenu with trigger button showing "Clients" or selected count
        const clientFilter = page.getByRole("button").filter({ hasText: /clients/i }).first();
        await expect(clientFilter).toBeVisible();

        await clientFilter.click();

        // DropdownMenu renders DropdownMenuCheckboxItem with role="menuitemcheckbox"
        await expect(page.locator("[role='menuitemcheckbox'], [role='menuitem']").first()).toBeVisible({ timeout: 5000 });

        // Close dropdown
        await page.keyboard.press("Escape");
    });

    test("team member filter dropdown works", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Team member filter is a DropdownMenu with trigger button showing "Team members" or selected count
        const teamFilter = page.getByRole("button").filter({ hasText: /team.*member/i }).first();
        await expect(teamFilter).toBeVisible();

        await teamFilter.click();

        // DropdownMenu renders DropdownMenuCheckboxItem with role="menuitemcheckbox"
        await expect(page.locator("[role='menuitemcheckbox'], [role='menuitem']").first()).toBeVisible({ timeout: 5000 });

        // Close dropdown
        await page.keyboard.press("Escape");
    });

    test("export dropdown provides CSV and PDF options", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Find export button
        const exportButton = page.getByRole("button", { name: /export/i });
        await expect(exportButton).toBeVisible();

        await exportButton.click();

        // Should show export options
        await expect(page.locator("[role='menuitem']").filter({ hasText: /csv/i })).toBeVisible();
        await expect(page.locator("[role='menuitem']").filter({ hasText: /pdf/i })).toBeVisible();

        // Close dropdown
        await page.keyboard.press("Escape");
    });

    test("summary cards display correct information", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Check for summary cards
        await expect(page.getByText(/total hours/i)).toBeVisible();
        await expect(page.getByText(/total entries/i)).toBeVisible();
        await expect(page.getByText(/active.*clients|active.*projects|active.*team/i)).toBeVisible();

        // Cards should have numeric values
        const hoursValue = page.locator(".text-2xl.font-bold").first();
        await expect(hoursValue).toBeVisible();

        // Should show time format (HH:MM)
        const hoursText = await hoursValue.textContent();
        expect(hoursText).toMatch(/\d+:\d+/);
    });

    test("hours chart displays when data is available", async ({ page }) => {
        // Create a test entry to ensure there's data
        const entry = await createTimesheetEntry(page, { note: `E2E-Chart-${Date.now()}`, duration: 120 });

        try {
            await goToReport(page, "time-entry");

            // ChartContainer renders with data-chart attribute
            // The chart section has a Card with "Hours by" title
            const chartCard = page.locator("text=Hours by").first();
            await expect(chartCard).toBeVisible({ timeout: 10000 });

        } finally {
            if (entry?.id) {
                await deleteTimesheetEntry(page, entry.id);
            }
        }
    });

    test("report tables display with correct structure", async ({ page }) => {
        // Create a test entry to ensure there's data
        const entry = await createTimesheetEntry(page, { note: `E2E-Table-${Date.now()}`, duration: 90 });

        try {
            await goToReport(page, "time-entry");

            // Wait for tables to load
            await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });

            // Check table headers using more specific selectors
            await expect(page.locator("th").filter({ hasText: /date/i }).first()).toBeVisible();
            await expect(page.locator("th").filter({ hasText: /team.*member/i }).first()).toBeVisible();
            await expect(page.locator("th").filter({ hasText: /project/i }).first()).toBeVisible();
            await expect(page.locator("th").filter({ hasText: /note/i }).first()).toBeVisible();
            await expect(page.locator("th").filter({ hasText: /hours/i }).first()).toBeVisible();

            // Should have data rows
            await expect(page.locator("tbody tr").first()).toBeVisible();

            // Hours should be in HH:MM format
            const hoursCell = page.locator("td").filter({ hasText: /\d+:\d+/ }).first();
            await expect(hoursCell).toBeVisible();

        } finally {
            if (entry?.id) {
                await deleteTimesheetEntry(page, entry.id);
            }
        }
    });

    test("group totals are displayed correctly", async ({ page }) => {
        // Create a test entry to ensure there's data
        const entry = await createTimesheetEntry(page, { note: `E2E-Total-${Date.now()}`, duration: 150 });

        try {
            await goToReport(page, "time-entry");

            // Wait for data to load
            await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });

            // Look for group total indicators
            await expect(page.locator(".font-bold").filter({ hasText: /total|2:30|1:30|\d+:\d+/i }).first()).toBeVisible();

        } finally {
            if (entry?.id) {
                await deleteTimesheetEntry(page, entry.id);
            }
        }
    });

    test("empty state is handled gracefully", async ({ page }) => {
        // Mock empty response
        await page.route("**/api/v1/reports/time_entries*", route => {
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    reports: [],
                    pagy: { pages: 1, page: 1, first: true, last: true },
                    filterOptions: { clients: [], teamMembers: [], projects: [] },
                    groupByTotalDuration: { groupBy: "client", groupedDurations: {} }
                })
            });
        });

        await goToReport(page, "time-entry");

        // Should show empty state message
        await expect(page.getByText(/no results|no.*data.*available/i)).toBeVisible({ timeout: 10000 });
    });

    test("pagination/infinite scroll works when there's more data", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Scroll to bottom to trigger loading more data
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // If there's pagination, should see loading indicators or page info
        const paginationInfo = page.locator(":has-text('loaded'), :has-text('pages'), :has-text('loading')");

        // This test is conditional - only check if pagination elements exist
        if (await paginationInfo.count() > 0) {
            await expect(paginationInfo.first()).toBeVisible();
        }
    });
});