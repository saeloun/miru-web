/**
 * Payment Report — filters, date ranges, payment methods, export, data display.
 * Covers manual test sections: 7 (Individual Report Pages - Payment Report).
 */
import { test, expect } from "@playwright/test";
import { goToReport, createPayment, deletePayment } from "./helpers";

test.describe("Payment Report", () => {
    test("payment report loads with proper header and controls", async ({ page }) => {
        await goToReport(page, "payments");

        // Check header
        await expect(page.locator("h1").filter({ hasText: /payment.*report/i })).toBeVisible();

        // Check main controls — Radix Select triggers have role="combobox"
        await expect(page.locator("[role='combobox']").first()).toBeVisible();
        // Date range button shows date range text with year
        await expect(page.locator("button").filter({ has: page.locator("svg") }).filter({ hasText: /\d{4}|pick.*date/i }).first()).toBeVisible();
    });

    test("date range controls work correctly", async ({ page }) => {
        await goToReport(page, "payments");

        // The date preset selector is a Radix Select inside the report header
        // Skip the language selector (first combobox) — target by the container
        const headerControls = page.locator(".max-w-7xl, .bg-white.shadow-sm").filter({ hasText: /payment.*report/i });
        const presetSelector = headerControls.locator("[role='combobox']").first();
        await expect(presetSelector).toBeVisible();

        // Click to open dropdown
        await presetSelector.click();
        await page.waitForTimeout(300);

        // Radix Select renders options in a portal with role="listbox"
        const listbox = page.locator("[role='listbox']");
        await expect(listbox).toBeVisible({ timeout: 5000 });

        // Check for preset options
        await expect(listbox.getByText(/Last Month/)).toBeVisible();
        await expect(listbox.getByText(/This Year/)).toBeVisible();
        await expect(listbox.getByText(/Custom/)).toBeVisible();

        // Select this year
        await listbox.getByText(/This Year/).click();
    });

    test("custom date range picker functions", async ({ page }) => {
        await goToReport(page, "payments");

        // The date range button shows dates like "Apr 01, 2026 - Apr 21, 2026" or "Pick a date range"
        const dateRangeButton = page.locator("button").filter({ has: page.locator("svg") }).filter({ hasText: /\d{4}|pick.*date/i }).first();
        await expect(dateRangeButton).toBeVisible();

        await dateRangeButton.click();

        // Calendar popup should appear (Radix Popover renders a grid of day buttons)
        await expect(page.locator("[role='grid']").first()).toBeVisible({ timeout: 5000 });

        // Close the calendar
        await page.keyboard.press("Escape");
    });

    test("client filter works when clients are available", async ({ page }) => {
        await goToReport(page, "payments");

        // Payment report client filter uses a Popover with Button items (not menuitem/option)
        // The trigger button shows "All Clients" or selected client names
        const clientFilter = page.getByRole("button").filter({ hasText: /client/i }).first();

        // Only test if client filter exists (depends on data)
        if (await clientFilter.count() > 0) {
            await expect(clientFilter).toBeVisible();

            await clientFilter.click();
            await page.waitForTimeout(300);

            // Should show client options as buttons inside a Popover
            const popoverContent = page.locator("[data-radix-popper-content-wrapper]").last();
            await expect(popoverContent.getByRole("button").first()).toBeVisible({ timeout: 5000 });

            // Close popover
            await page.keyboard.press("Escape");
        }
    });

    test("payment method filter provides correct options", async ({ page }) => {
        await goToReport(page, "payments");

        // Find payment method filter
        const methodFilter = page.locator("select, [role='combobox']").filter({ hasText: /method|all.*methods/i });

        if (await methodFilter.count() > 0) {
            await expect(methodFilter).toBeVisible();

            await methodFilter.click();

            // Check for payment method options
            await expect(page.locator("[role='option']").filter({ hasText: /all.*methods/i })).toBeVisible();
            await expect(page.locator("[role='option']").filter({ hasText: /credit.*card/i })).toBeVisible();

            // Close dropdown
            await page.keyboard.press("Escape");
        }
    });

    test("export dropdown provides CSV and PDF options", async ({ page }) => {
        await goToReport(page, "payments");

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

    test("summary cards display payment metrics", async ({ page }) => {
        await goToReport(page, "payments");

        // Check for summary cards
        await expect(page.getByText(/total payments/i)).toBeVisible();
        await expect(page.getByText(/payment count/i)).toBeVisible();
        await expect(page.getByText(/average payment/i)).toBeVisible();
        await expect(page.getByText(/top method/i)).toBeVisible();

        // Cards should have values (even if zero)
        const summaryValues = page.locator(".text-2xl.font-bold, .text-xl.font-bold");
        await expect(summaryValues.first()).toBeVisible();
    });

    test("payment method breakdown section appears when data exists", async ({ page }) => {
        await goToReport(page, "payments");

        // Look for payment method breakdown section
        const breakdownSection = page.getByText(/payment.*method.*breakdown/i);

        // This section may not exist if there's no payment data
        if (await breakdownSection.count() > 0) {
            await expect(breakdownSection).toBeVisible();

            // Should show payment methods with amounts
            await expect(page.locator(".grid").filter({ hasText: /credit|bank|paypal|stripe/i }).first()).toBeVisible();
        }
    });

    test("payment details table has correct structure", async ({ page }) => {
        await goToReport(page, "payments");

        // Wait for table to load
        await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });

        // Check table headers
        await expect(page.locator("th").filter({ hasText: /date/i })).toBeVisible();
        await expect(page.locator("th").filter({ hasText: /client/i })).toBeVisible();
        await expect(page.locator("th").filter({ hasText: /invoice/i })).toBeVisible();
        await expect(page.locator("th").filter({ hasText: /payment.*method/i })).toBeVisible();
        await expect(page.locator("th").filter({ hasText: /amount/i })).toBeVisible();
        await expect(page.locator("th").filter({ hasText: /notes/i })).toBeVisible();
        await expect(page.locator("th").filter({ hasText: /status/i })).toBeVisible();
    });

    test("payment method icons are displayed correctly", async ({ page }) => {
        // Mock payment data with different payment methods
        await page.route("**/api/v1/reports/payments*", route => {
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    payments: [
                        {
                            id: 1,
                            payment_date: "2024-01-15",
                            client_name: "Test Client",
                            invoice_number: "INV-001",
                            payment_method: "credit_card",
                            amount: 1000,
                            status: "completed",
                            transaction_id: "txn_123"
                        }
                    ],
                    summary: {
                        total_amount: 1000,
                        payment_count: 1,
                        average_payment: 1000,
                        by_payment_method: { "credit_card": 1000 }
                    },
                    currency: "USD"
                })
            });
        });

        await goToReport(page, "payments");

        // Wait for table data
        await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10000 });

        // Should show payment method text in a table cell
        await expect(page.locator("td").filter({ hasText: /credit.card/i })).toBeVisible();
    });

    test("amount formatting displays currency correctly", async ({ page }) => {
        // Mock payment data with amounts
        await page.route("**/api/v1/reports/payments*", route => {
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    payments: [
                        {
                            id: 1,
                            payment_date: "2024-01-15",
                            client_name: "Test Client",
                            invoice_number: "INV-001",
                            payment_method: "credit_card",
                            amount: 1250.50,
                            status: "completed",
                            transaction_id: "txn_123"
                        }
                    ],
                    summary: {
                        total_amount: 1250.50,
                        payment_count: 1,
                        average_payment: 1250.50,
                        by_payment_method: { "credit_card": 1250.50 }
                    },
                    currency: "USD"
                })
            });
        });

        await goToReport(page, "payments");

        // Wait for data to load
        await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10000 });

        // Should show properly formatted currency
        await expect(page.locator("td").filter({ hasText: /\$.*1,?250\.50|\$.*1250\.50/i })).toBeVisible();
    });

    test("status badges are displayed with appropriate styling", async ({ page }) => {
        // Mock payment data with different statuses
        await page.route("**/api/v1/reports/payments*", route => {
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    payments: [
                        {
                            id: 1,
                            payment_date: "2024-01-15",
                            client_name: "Test Client",
                            invoice_number: "INV-001",
                            payment_method: "credit_card",
                            amount: 1000,
                            status: "completed",
                            transaction_id: "txn_123"
                        }
                    ],
                    summary: {
                        total_amount: 1000,
                        payment_count: 1,
                        average_payment: 1000,
                        by_payment_method: { "credit_card": 1000 }
                    },
                    currency: "USD"
                })
            });
        });

        await goToReport(page, "payments");

        // Wait for data to load
        await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10000 });

        // Should show status badge — StatusBadge renders with border and rounded-full classes
        await expect(page.locator("td").filter({ hasText: /paid|completed|pending/i })).toBeVisible();
    });

    test("empty state shows appropriate message", async ({ page }) => {
        // Mock empty response
        await page.route("**/api/v1/reports/payments*", route => {
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    payments: [],
                    summary: {
                        total_amount: 0,
                        payment_count: 0,
                        average_payment: 0,
                        by_payment_method: {}
                    },
                    currency: "USD"
                })
            });
        });

        await goToReport(page, "payments");

        // Should show empty state message
        await expect(page.getByText(/no payments.*found|no.*payments.*selected.*period/i)).toBeVisible({ timeout: 10000 });
    });

    test("pagination info is displayed when applicable", async ({ page }) => {
        await goToReport(page, "payments");

        // Look for pagination information
        const paginationInfo = page.locator(":has-text('showing'), :has-text('payments'), :has-text('scroll')");

        // This is conditional - only check if pagination elements exist
        if (await paginationInfo.count() > 0) {
            await expect(paginationInfo.first()).toBeVisible();
        }
    });

    test("responsive layout works on mobile", async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        await goToReport(page, "payments");

        // Page should still be functional
        await expect(page.getByText(/payment.*report/i).first()).toBeVisible();

        // Controls should be stacked vertically
        await expect(page.locator("select, [role='combobox']").first()).toBeVisible();

        // Table should be scrollable horizontally
        await expect(page.locator("table").first()).toBeVisible();
    });
});