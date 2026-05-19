/**
 * Empty State — when no payments exist.
 * Covers manual test section 5.
 *
 * The /payments route renders PaymentsTable which uses React Query.
 * fetchPayments catches errors and returns empty data, so a 500 mock
 * triggers the empty state just like an empty response.
 * Empty state text: "No payments have been recorded yet"
 */
import { test, expect } from "@playwright/test";

test.describe("Payments — Empty & Error States", () => {
    test("shows empty state when API returns no payments", async ({ page }) => {
        await page.route("**/api/v1/payments*", route =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ payments: [], baseCurrency: "USD", total: 0 }),
            }),
        );

        await page.goto("/payments");
        await page.waitForLoadState("networkidle");
        // Exact text from en.ts: "No payments have been recorded yet"
        await expect(
            page.getByText(/no payments have been recorded yet/i),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("empty state shows Add Manual Entry button", async ({ page }) => {
        await page.route("**/api/v1/payments*", route =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ payments: [], baseCurrency: "USD", total: 0 }),
            }),
        );

        await page.goto("/payments");
        await page.waitForLoadState("networkidle");
        await expect(
            page.getByText(/no payments have been recorded yet/i),
        ).toBeVisible({ timeout: 15_000 });

        const addBtn = page.getByRole("button", { name: /add.*entry|record.*payment/i }).first();
        await expect(addBtn).toBeVisible();
    });
});
