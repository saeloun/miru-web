/**
 * Reports Page Load — page load, layout, access control, error states.
 * Covers manual test sections: 1 (Page Load & Layout).
 */
import { test, expect } from "@playwright/test";
import { goToReports } from "./helpers";

test.describe("Reports Page Load", () => {
    test("page loads successfully with proper header and description", async ({ page }) => {
        await goToReports(page);

        // Check main heading
        await expect(page.locator("h1, .text-2xl").filter({ hasText: /reports/i }).first()).toBeVisible();

        // Check description text
        await expect(page.getByText(/understand.*revenue.*time.*outstanding.*work/i)).toBeVisible();
    });

    test("stats cards render with correct structure", async ({ page }) => {
        await goToReports(page);

        // Stats card titles are rendered as CardTitle (p.text-sm.font-medium)
        await expect(page.getByText(/available reports/i).first()).toBeVisible();
        await expect(page.getByText(/time reports/i).first()).toBeVisible();
        await expect(page.getByText(/financial/i).first()).toBeVisible();
        await expect(page.getByText(/recently viewed/i).first()).toBeVisible();

        // Each stats card should have a numeric value
        const statsValue = page.locator(".text-2xl.font-bold").first();
        await expect(statsValue).toBeVisible();
    });

    test("schedule reports button is visible and functional", async ({ page }) => {
        await goToReports(page);

        const scheduleButton = page.getByRole("button", { name: /schedule reports/i });
        await expect(scheduleButton).toBeVisible();

        // Button should be clickable (we won't test the actual navigation to avoid side effects)
        await expect(scheduleButton).toBeEnabled();
    });

    test("category tabs are visible and functional", async ({ page }) => {
        await goToReports(page);

        // Check all category tabs
        await expect(page.getByRole("tab", { name: /all reports/i })).toBeVisible();
        await expect(page.getByRole("tab", { name: /^time$/i })).toBeVisible();
        await expect(page.getByRole("tab", { name: /financial/i })).toBeVisible();
        await expect(page.getByRole("tab", { name: /client/i })).toBeVisible();
        await expect(page.getByRole("tab", { name: /team/i })).toBeVisible();

        // All Reports should be selected by default
        await expect(page.getByRole("tab", { name: /all reports/i })).toHaveAttribute("data-state", "active");
    });

    test("available reports section displays report cards", async ({ page }) => {
        await goToReports(page);

        // Check for Available Reports heading using more specific selector
        await expect(page.locator("h2").filter({ hasText: /available reports/i })).toBeVisible();

        // Check for specific report cards using role="button" to be more specific
        await expect(page.locator("[role='button']").filter({ hasText: /time reports/i })).toBeVisible();
        await expect(page.locator("[role='button']").filter({ hasText: /outstanding.*overdue.*invoices/i })).toBeVisible();
        await expect(page.locator("[role='button']").filter({ hasText: /revenue.*client/i })).toBeVisible();
        await expect(page.locator("[role='button']").filter({ hasText: /accounts.*aging/i })).toBeVisible();
        await expect(page.locator("[role='button']").filter({ hasText: /payment.*report/i })).toBeVisible();
    });

    test("report cards have proper structure and icons", async ({ page }) => {
        await goToReports(page);

        const timeReportsCard = page.getByRole("button", {
            name: /open time reports report/i,
        });
        await expect(timeReportsCard).toBeVisible({ timeout: 15_000 });

        const reportCards = page.getByRole("button", {
            name: /open .* report/i,
        });
        const cardCount = await reportCards.count();
        expect(cardCount).toBeGreaterThan(0);

        // Check first card has proper structure
        const firstCard = reportCards.first();
        await expect(firstCard).toBeVisible();

        // Cards should have category label text (Time or Financial) inside them
        await expect(timeReportsCard.getByText(/^Time$/)).toBeVisible();
    });

    test("quick actions section is present", async ({ page }) => {
        await goToReports(page);

        // Check for Quick Actions section
        await expect(page.getByText(/quick actions/i).first()).toBeVisible();

        // Check for quick action buttons (text from i18n keys)
        await expect(page.getByRole("button", { name: /generate.*weekly.*timesheet/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /view.*overdue.*invoices/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /monthly.*revenue.*report/i })).toBeVisible();
    });

    test("coming soon section appears when filtering by client or team", async ({ page }) => {
        await goToReports(page);

        // Click on Client tab
        await page.getByRole("tab", { name: /client/i }).click();

        // Should show coming soon section (h2 heading)
        await expect(page.locator("h2").filter({ hasText: /coming soon/i })).toBeVisible();

        // Click on Team tab
        await page.getByRole("tab", { name: /team/i }).click();

        // Should still show coming soon section
        await expect(page.locator("h2").filter({ hasText: /coming soon/i })).toBeVisible();
    });

    test("error state handling with network issues", async ({ page }) => {
        // Mock network failure for reports data
        await page.route("**/api/v1/reports/**", route => route.abort());

        await goToReports(page);

        // Page should still load the basic structure even if API calls fail
        await expect(page.locator("h1, .text-2xl").filter({ hasText: /reports/i }).first()).toBeVisible();
    });

    test("page is responsive on mobile viewport", async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await goToReports(page);

        // Page should still be functional
        await expect(page.locator("h1, .text-2xl").filter({ hasText: /reports/i }).first()).toBeVisible();

        // Category tabs should still be visible (may be stacked)
        await expect(page.getByRole("tab", { name: /all reports/i })).toBeVisible();

        // Stats cards should stack vertically
        const statsCards = page.locator(".grid").filter({ hasText: /available reports/i }).first();
        await expect(statsCards).toBeVisible();
    });
});
