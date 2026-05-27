/**
 * Expenses — Delete expense via the actions dropdown.
 * Covers manual test section: 7 (Delete Expense).
 */
import { test, expect } from "@playwright/test";
import {
    goToExpenses,
    createExpense,
    deleteExpense,
    approveExpense,
    markExpensePaid,
    expectToast,
} from "./helpers";

test.describe("Expenses — Delete Expense", () => {
    test("delete option visible for submitted expense", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-DelOpt-${Date.now()}` });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();

            await expect(
                page.getByRole("menuitem", { name: /delete expense/i }),
            ).toBeVisible();

            // Close menu
            await page.keyboard.press("Escape");
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("delete option hidden for paid expense", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-DelPaid-${Date.now()}` });
        await approveExpense(page, expense.id);
        await markExpensePaid(page, expense.id);
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();

            await expect(
                page.getByRole("menuitem", { name: /delete expense/i }),
            ).not.toBeVisible();

            await page.keyboard.press("Escape");
        } finally {
            // Paid expenses can't be deleted via API either, but try cleanup
            await deleteExpense(page, expense.id).catch(() => { });
        }
    });

    test("delete confirmation dialog appears and confirm deletes expense", async ({ page }) => {
        const desc = `E2E-DelConfirm-${Date.now()}`;
        const expense = await createExpense(page, { description: desc });

        await goToExpenses(page);

        const row = page.locator("tr, [role='row']").filter({ hasText: desc });
        await expect(row).toBeVisible({ timeout: 10_000 });

        const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
        await actionsBtn.click();
        await page.getByRole("menuitem", { name: /delete expense/i }).click();

        // Confirmation dialog
        const dialog = page.locator("[role='dialog']");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(/delete expense/i).first()).toBeVisible();

        // Confirm delete
        await dialog.getByRole("button", { name: /delete/i }).click();

        await expectToast(page, /deleted successfully/i);

        // Expense should no longer be in the table
        await expect(page.getByText(desc)).not.toBeVisible({ timeout: 10_000 });
    });

    test("cancel delete closes dialog and keeps expense", async ({ page }) => {
        const desc = `E2E-DelCancel-${Date.now()}`;
        const expense = await createExpense(page, { description: desc });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: desc });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();
            await page.getByRole("menuitem", { name: /delete expense/i }).click();

            const dialog = page.locator("[role='dialog']");
            await expect(dialog).toBeVisible();

            await dialog.getByRole("button", { name: /cancel/i }).click();
            await expect(dialog).not.toBeVisible();

            // Expense still visible
            await expect(page.getByText(desc)).toBeVisible();
        } finally {
            await deleteExpense(page, expense.id);
        }
    });
});
