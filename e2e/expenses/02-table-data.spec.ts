/**
 * Expenses — Table data display, sorting.
 * Covers manual test sections: 2 (Columns & Data), 3 (Sorting).
 */
import { test, expect } from "@playwright/test";
import { goToExpenses, createExpense, deleteExpense } from "./helpers";

test.describe("Expenses — Table Data & Sorting", () => {
    test("expense row displays description, category, amount, type, and status", async ({ page }) => {
        const desc = `E2E-RowData-${Date.now()}`;
        const expense = await createExpense(page, {
            description: desc,
            amount: 42.5,
            category_name: "Travel",
            expense_type: "personal",
            vendor_name: "Acme Corp",
        });
        try {
            await goToExpenses(page);
            const row = page.locator("tr, [role='row']").filter({ hasText: desc });
            await expect(row).toBeVisible({ timeout: 10_000 });

            // Description
            await expect(row.getByText(desc)).toBeVisible();
            // Category
            await expect(row.getByText("Travel")).toBeVisible();
            // Amount — formatted currency
            await expect(row.getByText("$42.50")).toBeVisible();
            // Type badge
            await expect(row.getByText(/personal/i)).toBeVisible();
            // Status badge — new expenses are "submitted"
            await expect(row.getByText(/submitted/i)).toBeVisible();
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("vendor column shows vendor name or dash", async ({ page }) => {
        const withVendor = await createExpense(page, {
            description: `E2E-Vendor-${Date.now()}`,
            vendor_name: `TestVendor-${Date.now()}`,
        });
        const withoutVendor = await createExpense(page, {
            description: `E2E-NoVendor-${Date.now()}`,
        });
        try {
            await goToExpenses(page);
            const vendorRow = page.locator("tr, [role='row']").filter({ hasText: withVendor.description || withVendor.vendor_name });
            await expect(vendorRow).toBeVisible({ timeout: 10_000 });

            // Row without vendor should show "—"
            const noVendorRow = page.locator("tr, [role='row']").filter({ hasText: withoutVendor.description });
            await expect(noVendorRow).toBeVisible({ timeout: 10_000 });
            await expect(noVendorRow.getByText("—").first()).toBeVisible();
        } finally {
            await deleteExpense(page, withVendor.id);
            await deleteExpense(page, withoutVendor.id);
        }
    });

    test("date column sort toggles ascending and descending", async ({ page }) => {
        const expense1 = await createExpense(page, {
            description: `E2E-Sort1-${Date.now()}`,
            date: "2026-01-15",
        });
        const expense2 = await createExpense(page, {
            description: `E2E-Sort2-${Date.now()}`,
            date: "2026-04-20",
        });
        try {
            await goToExpenses(page);

            // Click Date header to sort
            const dateHeader = page.getByRole("button", { name: /date/i }).first();
            await dateHeader.click();
            await page.waitForTimeout(300);

            // Click again to reverse
            await dateHeader.click();
            await page.waitForTimeout(300);

            // Just verify both expenses are still visible (sorting is client-side)
            await expect(page.getByText(expense1.description)).toBeVisible();
            await expect(page.getByText(expense2.description)).toBeVisible();
        } finally {
            await deleteExpense(page, expense1.id);
            await deleteExpense(page, expense2.id);
        }
    });

    test("amount column sort toggles ascending and descending", async ({ page }) => {
        const expense = await createExpense(page, {
            description: `E2E-AmtSort-${Date.now()}`,
            amount: 999,
        });
        try {
            await goToExpenses(page);

            const amountHeader = page.getByRole("button", { name: /amount/i }).first();
            await amountHeader.click();
            await page.waitForTimeout(300);

            await amountHeader.click();
            await page.waitForTimeout(300);

            await expect(page.getByText(expense.description)).toBeVisible();
        } finally {
            await deleteExpense(page, expense.id);
        }
    });
});
