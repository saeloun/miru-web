/**
 * Reports Navigation — category filtering, report card navigation, tab switching.
 * Covers manual test sections: 2 (Category Navigation), 3 (Available Reports Section).
 */
import { test, expect } from "@playwright/test";
import { goToReports } from "./helpers";

test.describe("Reports Navigation", () => {
    test.beforeEach(async ({ page }) => {
        await goToReports(page);
    });

    test("category tab filtering works correctly", async ({ page }) => {
        // Start with All Reports (default)
        await expect(page.getByRole("tab", { name: /all reports/i })).toHaveAttribute("data-state", "active");

        // Switch to Time category
        await page.getByRole("tab", { name: /^time$/i }).click();
        await expect(page.getByRole("tab", { name: /^time$/i })).toHaveAttribute("data-state", "active");

        // Should show only time-related reports
        await expect(page.locator("h2").filter({ hasText: /available reports/i })).toBeVisible();
        await expect(page.locator("[role='button']").filter({ hasText: /time reports/i })).toBeVisible();

        // Switch to Financial category
        await page.getByRole("tab", { name: /financial/i }).click();
        await expect(page.getByRole("tab", { name: /financial/i })).toHaveAttribute("data-state", "active");

        // Should show financial reports
        await expect(page.locator("[role='button']").filter({ hasText: /outstanding.*overdue.*invoices/i })).toBeVisible();
        await expect(page.locator("[role='button']").filter({ hasText: /revenue.*client/i })).toBeVisible();
        await expect(page.locator("[role='button']").filter({ hasText: /accounts.*aging/i })).toBeVisible();
        await expect(page.locator("[role='button']").filter({ hasText: /payment.*report/i })).toBeVisible();

        // Switch to Client category
        await page.getByRole("tab", { name: /client/i }).click();
        await expect(page.getByRole("tab", { name: /client/i })).toHaveAttribute("data-state", "active");

        // Should show coming soon section (h2 heading)
        await expect(page.locator("h2").filter({ hasText: /coming soon/i })).toBeVisible();

        // Switch back to All Reports
        await page.getByRole("tab", { name: /all reports/i }).click();
        await expect(page.getByRole("tab", { name: /all reports/i })).toHaveAttribute("data-state", "active");

        // Should show all available reports again
        await expect(page.locator("[role='button']").filter({ hasText: /time reports/i })).toBeVisible();
        await expect(page.locator("[role='button']").filter({ hasText: /payment.*report/i })).toBeVisible();
    });

    test("report card navigation to time entry report", async ({ page }) => {
        // Find and click the Time Reports card
        const timeReportsCard = page.locator("[role='button']").filter({ hasText: /time reports/i });
        await expect(timeReportsCard).toBeVisible();

        await timeReportsCard.click();

        // Should navigate to time entry report page
        await expect(page).toHaveURL(/\/reports\/time-entry/);
        await expect(page.getByText(/time reports/i).first()).toBeVisible();
    });

    test("report card navigation to payment report", async ({ page }) => {
        // Find and click the Payment Report card — use first() since "Payment Report" text may appear in multiple places
        const paymentCard = page.locator("[role='button']").filter({ hasText: /payment.*report/i }).first();
        await expect(paymentCard).toBeVisible();

        await paymentCard.click();

        // Should navigate to payment report page
        await expect(page).toHaveURL(/\/reports\/payments/);
        await expect(page.locator("h1").filter({ hasText: /payment.*report/i })).toBeVisible();
    });

    test("report card navigation to revenue by client report", async ({ page }) => {
        // Find and click the Revenue by Client card
        const revenueCard = page.locator("[role='button']").filter({ hasText: /revenue.*client/i });
        await expect(revenueCard).toBeVisible();

        await revenueCard.click();

        // Should navigate to revenue by client report page
        await expect(page).toHaveURL(/\/reports\/revenue-by-client/);
    });

    test("report card navigation to accounts aging report", async ({ page }) => {
        // Find and click the Accounts Aging card
        const accountsCard = page.locator("[role='button']").filter({ hasText: /accounts.*aging/i });
        await expect(accountsCard).toBeVisible();

        await accountsCard.click();

        // Should navigate to accounts aging report page
        await expect(page).toHaveURL(/\/reports\/accounts-aging/);
    });

    test("report card navigation to outstanding invoices report", async ({ page }) => {
        // Find and click the Outstanding Invoices card
        const invoicesCard = page.locator("[role='button']").filter({ hasText: /outstanding.*overdue.*invoices/i });
        await expect(invoicesCard).toBeVisible();

        await invoicesCard.click();

        // Should navigate to outstanding invoices report page
        await expect(page).toHaveURL(/\/reports\/outstanding-overdue-invoices/);
    });

    test("report card hover effects work", async ({ page }) => {
        const timeReportsCard = page.locator("[role='button']").filter({ hasText: /time reports/i });
        await expect(timeReportsCard).toBeVisible();

        // Hover over the card
        await timeReportsCard.hover();

        // Card should have hover effects (shadow, etc.)
        // We can't easily test CSS changes, but we can ensure the card is still interactive
        await expect(timeReportsCard).toBeVisible();
        await expect(timeReportsCard).toBeEnabled();
    });

    test("keyboard navigation works for report cards", async ({ page }) => {
        // Focus on the first report card directly
        const firstCard = page.locator("[role='button']").first();
        await expect(firstCard).toBeVisible();
        await firstCard.focus();

        // Should be able to activate with Enter
        await page.keyboard.press("Enter");

        // Should navigate to a report page
        await expect(page).toHaveURL(/\/reports\/.+/);
    });

    test("quick actions navigation works", async ({ page }) => {
        // Test weekly timesheet quick action
        const weeklyTimesheetBtn = page.getByRole("button", { name: /generate.*weekly.*timesheet/i });
        await expect(weeklyTimesheetBtn).toBeVisible();

        await weeklyTimesheetBtn.click();
        await expect(page).toHaveURL(/\/reports\/time-entry/);

        // Go back to reports
        await goToReports(page);

        // Test overdue invoices quick action
        const overdueInvoicesBtn = page.getByRole("button", { name: /view.*overdue.*invoices/i });
        await expect(overdueInvoicesBtn).toBeVisible();

        await overdueInvoicesBtn.click();
        await expect(page).toHaveURL(/\/reports\/outstanding-overdue-invoices/);

        // Go back to reports
        await goToReports(page);

        // Test revenue report quick action
        const revenueReportBtn = page.getByRole("button", { name: /monthly.*revenue.*report/i });
        await expect(revenueReportBtn).toBeVisible();

        await revenueReportBtn.click();
        await expect(page).toHaveURL(/\/reports\/revenue-by-client/);
    });

    test("coming soon cards are not clickable", async ({ page }) => {
        // Switch to Client tab to see coming soon items
        await page.getByRole("tab", { name: /client/i }).click();

        // Coming soon cards should be visible but not have role="button"
        const comingSoonSection = page.getByRole("heading", { name: /coming soon/i });
        await expect(comingSoonSection).toBeVisible();

        // Coming soon cards should not be clickable (they don't have role="button")
        const comingSoonCards = page.locator(".opacity-80").filter({ hasText: /team utilization|project profitability|client summary/i });

        if (await comingSoonCards.count() > 0) {
            const firstComingSoonCard = comingSoonCards.first();
            await expect(firstComingSoonCard).toBeVisible();

            // These cards should not have role="button" or be clickable
            const hasButtonRole = await firstComingSoonCard.getAttribute("role");
            expect(hasButtonRole).not.toBe("button");
        }
    });

    test("category badges are displayed correctly", async ({ page }) => {
        // Badge component renders as div.rounded-full.border with variant "outline"
        // Check for category badges on report cards
        await expect(page.locator("[role='button']").filter({ hasText: /time reports/i }).getByText(/^time$/i)).toBeVisible();
        await expect(page.locator("[role='button']").filter({ hasText: /payment.*report/i }).getByText(/^financial$/i)).toBeVisible();

        // Switch to financial category and verify badges
        await page.getByRole("tab", { name: /financial/i }).click();
        await expect(page.locator("[role='button']").filter({ hasText: /payment.*report/i }).getByText(/^financial$/i)).toBeVisible();
    });

    test("export indicators are shown on report cards", async ({ page }) => {
        // Export text is rendered as a span with Download icon inside each card
        // The text "Export" appears inside each available report card
        const exportTexts = page.locator("[role='button']").filter({ hasText: /export/i });
        const exportCount = await exportTexts.count();
        expect(exportCount).toBeGreaterThan(0);
    });
});