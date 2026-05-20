/**
 * Expenses — Approve, Reject, Mark as Paid actions (admin-only).
 * Covers manual test section: 8 (Approve / Reject / Mark Paid).
 */
import { test, expect } from "@playwright/test";
import {
    goToExpenses,
    createExpense,
    deleteExpense,
    approveExpense,
    expectToast,
} from "./helpers";

test.describe("Expenses — Approve / Reject / Mark Paid", () => {
    test("approve option visible for submitted expense", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-ApprOpt-${Date.now()}` });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();

            await expect(
                page.getByRole("menuitem", { name: /approve expense/i }),
            ).toBeVisible();

            await page.keyboard.press("Escape");
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("approve expense changes status to Approved", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-Approve-${Date.now()}` });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();
            await page.getByRole("menuitem", { name: /approve expense/i }).click();

            await expectToast(page, /approved/i);

            // Status should update
            await expect(row.getByText(/approved/i)).toBeVisible({ timeout: 10_000 });
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("reject option visible for submitted expense", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-RejOpt-${Date.now()}` });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();

            await expect(
                page.getByRole("menuitem", { name: /reject expense/i }),
            ).toBeVisible();

            await page.keyboard.press("Escape");
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("reject expense changes status to Rejected", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-Reject-${Date.now()}` });
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();
            await page.getByRole("menuitem", { name: /reject expense/i }).click();

            await expectToast(page, /rejected/i);

            await expect(row.getByText(/rejected/i)).toBeVisible({ timeout: 10_000 });
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("mark as paid option visible for approved expense", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-PaidOpt-${Date.now()}` });
        await approveExpense(page, expense.id);
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();

            await expect(
                page.getByRole("menuitem", { name: /mark as paid/i }),
            ).toBeVisible();

            await page.keyboard.press("Escape");
        } finally {
            await deleteExpense(page, expense.id);
        }
    });

    test("mark expense as paid changes status to Paid", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-MarkPaid-${Date.now()}` });
        await approveExpense(page, expense.id);
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();
            await page.getByRole("menuitem", { name: /mark as paid/i }).click();

            await expectToast(page, /marked as paid/i);

            await expect(row.getByText("Paid", { exact: true })).toBeVisible({ timeout: 10_000 });
        } finally {
            // Paid expenses may not be deletable — try anyway
            await deleteExpense(page, expense.id).catch(() => { });
        }
    });

    test("approve option hidden for already approved expense", async ({ page }) => {
        const expense = await createExpense(page, { description: `E2E-NoAppr-${Date.now()}` });
        await approveExpense(page, expense.id);
        try {
            await goToExpenses(page);

            const row = page.locator("tr, [role='row']").filter({ hasText: expense.description });
            await expect(row).toBeVisible({ timeout: 10_000 });

            const actionsBtn = row.locator("button").filter({ has: page.locator("[data-testid], .sr-only") }).last();
            await actionsBtn.click();

            await expect(
                page.getByRole("menuitem", { name: /approve expense/i }),
            ).not.toBeVisible();

            await page.keyboard.press("Escape");
        } finally {
            await deleteExpense(page, expense.id);
        }
    });
});
