/**
 * Expenses — Page Load, Layout, Stats Cards, Error State.
 * Covers manual test sections: 1 (Page Load & Layout), 12 (Empty State).
 */
import { test, expect } from "@playwright/test";
import { goToExpenses, createExpense, deleteExpense } from "./helpers";

test.describe("Expenses — Page Load & Layout", () => {
    test("page loads without errors", async ({ page }) => {
        await goToExpenses(page);
        await expect(page.getByText(/track and manage/i)).toBeVisible();
    });

    test("Add Expense button is visible", async ({ page }) => {
        await goToExpenses(page);
        await expect(
            page.getByRole("button", { name: /add expense/i }),
        ).toBeVisible();
    });

    test("stats cards display Total Expenses, Business, Personal, and This Month", async ({ page }) => {
        await goToExpenses(page);
        await expect(page.getByText(/total expenses/i)).toBeVisible();
        await expect(page.getByRole("heading", { name: /^Business$/i })).toBeVisible();
        await expect(page.getByRole("heading", { name: /^Personal$/i })).toBeVisible();
        await expect(page.getByText(/this month/i)).toBeVisible();
    });

    test("table has expected column headers when expenses exist", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-Headers-${Date.now()}` });
        try {
            await goToExpenses(page);
            await expect(page.locator("th, [role='columnheader']").getByText(/date/i).first()).toBeVisible();
            await expect(page.locator("th, [role='columnheader']").getByText(/description/i).first()).toBeVisible();
            await expect(page.locator("th, [role='columnheader']").getByText(/category/i).first()).toBeVisible();
            await expect(page.locator("th, [role='columnheader']").getByText(/amount/i).first()).toBeVisible();
            await expect(page.locator("th, [role='columnheader']").getByText(/type/i).first()).toBeVisible();
            await expect(page.locator("th, [role='columnheader']").getByText(/status/i).first()).toBeVisible();
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("error state displays when API fails", async ({ page }) => {
        await page.route("**/api/v1/expenses*", route =>
            route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) }),
        );
        await page.goto("/expenses");
        await expect(page.getByText(/failed to load/i)).toBeVisible({ timeout: 15_000 });
    });

    test("empty state shows when no expenses exist", async ({ page }) => {
        await page.route("**/api/v1/expenses*", route =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    expenses: [],
                    categories: [{ name: "Food" }],
                    pagy: { page: 1, pages: 1, total: 0, next: null },
                }),
            }),
        );
        await page.goto("/expenses");
        await expect(
            page.getByText(/no expenses recorded/i),
        ).toBeVisible({ timeout: 15_000 });
        await expect(
            page.getByRole("button", { name: /submit your first expense/i }),
        ).toBeVisible();
    });
});
