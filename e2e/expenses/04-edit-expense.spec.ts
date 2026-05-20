/**
 * Expenses — Edit expense via the actions dropdown.
 * Covers manual test section: 6 (Edit Expense).
 */
import { test, expect } from "@playwright/test";
import { goToExpenses, createExpense, deleteExpense, expectToast } from "./helpers";

test.describe("Expenses — Edit Expense", () => {
    test("edit option is visible in actions dropdown", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-EditOpt-${Date.now()}` });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            // Open actions dropdown
            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();

            await expect(page.getByRole("menuitem", { name: /edit expense/i })).toBeVisible();
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("edit dialog opens with pre-filled data", async ({ page }) => {
        const desc = `E2E-EditPrefill-${Date.now()}`;
        const expense = await createExpense(page, {
            description: desc,
            amount: 200,
            category_name: "Travel",
            vendor_name: "EditVendor",
        });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: desc });
            await expect(row).toBeVisible({ timeout: 10_000 });

            // Open actions dropdown
            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();
            await page.getByRole("menuitem", { name: /edit expense/i }).click();

            const dialog = page.locator("[role='dialog']");
            await expect(dialog).toBeVisible();
            await expect(dialog.getByText(/edit expense/i).first()).toBeVisible();

            // Check pre-filled values
            await expect(dialog.locator("#edit-description")).toHaveValue(desc);
            await expect(dialog.locator("#edit-amount")).toHaveValue("200");
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("update expense successfully", async ({ page }) => {
        const desc = `E2E-EditUpdate-${Date.now()}`;
        const expense = await createExpense(page, { description: desc, amount: 50 });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: desc });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();
            await page.getByRole("menuitem", { name: /edit expense/i }).click();

            const dialog = page.locator("[role='dialog']");
            await expect(dialog).toBeVisible();

            // Update description
            const newDesc = `E2E-Updated-${Date.now()}`;
            await dialog.locator("#edit-description").fill(newDesc);
            await dialog.locator("#edit-amount").fill("150");

            await dialog.getByRole("button", { name: /save changes/i }).click();

            await expectToast(page, /updated successfully/i);
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("cancel edit closes dialog without saving", async ({ page }) => {
        const desc = `E2E-EditCancel-${Date.now()}`;
        const expense = await createExpense(page, { description: desc });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: desc });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();
            await page.getByRole("menuitem", { name: /edit expense/i }).click();

            const dialog = page.locator("[role='dialog']");
            await expect(dialog).toBeVisible();

            await dialog.getByRole("button", { name: /cancel/i }).click();
            await expect(dialog).not.toBeVisible();
        } finally {
            await deleteExpense(page, expense.id);
        }
    });
});
