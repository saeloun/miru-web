/**
 * Expenses — Receipt preview and display.
 * Covers manual test section: 9 (Receipt Preview).
 */
import { test, expect } from "@playwright/test";
import { goToExpenses, createExpense, deleteExpense } from "./helpers";

test.describe("Expenses — Receipts", () => {
    test("expense without receipts shows dash in receipts column", async ({ page }) => {
        const expense = await createExpense(page, {
            description: `E2E-NoReceipt-${Date.now()}`,
        });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            // The receipts column should show "—"
            // Find the receipts cell (second to last column typically)
            const cells = row.locator("td");
            const cellCount = await cells.count();
            // Look for a dash in the row
            let foundDash = false;
            for (let i = 0; i < cellCount; i++) {
                const text = await cells.nth(i).innerText();
                if (text.trim() === "—") {
                    foundDash = true;
                    break;
                }
            }
            expect(foundDash).toBeTruthy();
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("receipt preview dialog opens from table (mocked receipts)", async ({ page }) => {
        // Mock the expenses API to return an expense with receipts
        const mockExpenseId = `mock-${Date.now()}`;
        await page.route("**/api/v1/expenses*", async (route, request) => {
            if (request.method() === "GET" && !request.url().includes("/expenses/")) {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        expenses: [
                            {
                                id: mockExpenseId,
                                date: "2026-04-15",
                                description: "Mock Receipt Expense",
                                amount: 50,
                                categoryName: "Food",
                                vendorName: "Test",
                                expenseType: "business",
                                status: "submitted",
                                receipts: ["/test-receipt.jpg"],
                                submitterName: "Test User",
                            },
                        ],
                        categories: [{ name: "Food" }],
                        pagy: { page: 1, pages: 1, total: 1, next: null },
                    }),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto("/expenses");
        await expect(page.getByText("Mock Receipt Expense")).toBeVisible({ timeout: 15_000 });

        // Click the receipt button (file icon with count)
        const receiptBtn = page.getByRole("button", { name: /view receipts/i });
        await expect(receiptBtn).toBeVisible();
        await receiptBtn.click();

        // Receipt preview dialog should open
        const dialog = page.locator("[role='dialog']");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(/receipt preview/i)).toBeVisible();
    });
});
