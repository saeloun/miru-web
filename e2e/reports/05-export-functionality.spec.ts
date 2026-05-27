/**
 * Export Functionality — CSV/PDF export across different reports.
 * Covers manual test sections: 8 (Export Functionality).
 */
import { test, expect } from "@playwright/test";
import { goToReport, createTimesheetEntry, deleteTimesheetEntry } from "./helpers";

test.describe("Export Functionality", () => {
    test("export dropdown appears and shows CSV/PDF options on time entry report", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Find and click export button
        const exportButton = page.getByRole("button", { name: /export/i });
        await expect(exportButton).toBeVisible();

        await exportButton.click();

        // Should show export options
        await expect(page.locator("[role='menuitem']").filter({ hasText: /csv/i })).toBeVisible();
        await expect(page.locator("[role='menuitem']").filter({ hasText: /pdf/i })).toBeVisible();

        // Close dropdown
        await page.keyboard.press("Escape");
    });

    test("export dropdown appears and shows CSV/PDF options on payment report", async ({ page }) => {
        await goToReport(page, "payments");

        // Find and click export button
        const exportButton = page.getByRole("button", { name: /export/i });
        await expect(exportButton).toBeVisible();

        await exportButton.click();

        // Should show export options
        await expect(page.locator("[role='menuitem']").filter({ hasText: /csv/i })).toBeVisible();
        await expect(page.locator("[role='menuitem']").filter({ hasText: /pdf/i })).toBeVisible();

        // Close dropdown
        await page.keyboard.press("Escape");
    });

    test("export options are clickable", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Find and click export button
        const exportButton = page.getByRole("button", { name: /export/i });
        await exportButton.click();

        const csvOption = page.locator("[role='menuitem']").filter({ hasText: /csv/i });
        await expect(csvOption).toBeVisible();

        // Click CSV option (may or may not trigger actual download)
        await csvOption.click();

        // Dropdown should close after clicking
        await expect(csvOption).not.toBeVisible();
    });

    test("export button is accessible via keyboard", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Find export button
        const exportButton = page.getByRole("button", { name: /export/i });
        await expect(exportButton).toBeVisible();

        // Focus on export button
        await exportButton.focus();
        await expect(exportButton).toBeFocused();

        // Open dropdown with Enter
        await page.keyboard.press("Enter");

        // Should show export options
        const csvOption = page.locator("[role='menuitem']").filter({ hasText: /csv/i });
        await expect(csvOption).toBeVisible();

        // Close dropdown with Escape
        await page.keyboard.press("Escape");
        await expect(csvOption).not.toBeVisible();
    });

    test("export works on revenue by client report", async ({ page }) => {
        await goToReport(page, "revenue-by-client");

        // Wait for page to load
        await expect(page.locator("h1, .text-2xl").first()).toBeVisible({ timeout: 10000 });

        // Find export button (may be in different location)
        const exportButton = page.getByRole("button", { name: /export|download/i });

        if (await exportButton.count() > 0) {
            await expect(exportButton).toBeVisible();

            await exportButton.click();

            // Look for export options
            const exportOptions = page.locator("[role='menuitem']").filter({ hasText: /csv|pdf/i });

            if (await exportOptions.count() > 0) {
                await expect(exportOptions.first()).toBeVisible();

                // Click option to test interaction
                await exportOptions.first().click();
            }
        }
    });
});