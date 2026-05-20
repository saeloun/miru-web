/**
 * Expenses — Create expense via the Add Expense dialog.
 * Covers manual test section: 5 (Create Expense).
 */
import { test, expect } from "@playwright/test";
import { goToExpenses, deleteExpense, expectToast } from "./helpers";

test.describe("Expenses — Create Expense", () => {
    test("Add Expense dialog opens and has all form fields", async ({ page }) => {
        await goToExpenses(page);
        await page.getByRole("button", { name: /add expense/i }).click();

        const dialog = page.locator("[role='dialog']");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(/add new expense/i)).toBeVisible();

        // Required fields
        await expect(dialog.locator("#date")).toBeVisible();
        await expect(dialog.locator("#description")).toBeVisible();
        await expect(dialog.locator("#amount")).toBeVisible();

        // Category select
        await expect(dialog.getByText(/category/i).first()).toBeVisible();

        // Vendor
        await expect(dialog.locator("#vendor")).toBeVisible();

        // Type select
        await expect(dialog.getByText(/type/i).first()).toBeVisible();

        // Notes
        await expect(dialog.locator("#notes")).toBeVisible();

        // Receipts file input
        await expect(dialog.locator("#receipts")).toBeAttached();
    });

    test("date field defaults to today", async ({ page }) => {
        await goToExpenses(page);
        await page.getByRole("button", { name: /add expense/i }).click();

        const dialog = page.locator("[role='dialog']");
        const dateInput = dialog.locator("#date");
        const today = new Date().toISOString().split("T")[0];
        await expect(dateInput).toHaveValue(today);
    });

    test("category select shows default categories", async ({ page }) => {
        await goToExpenses(page);
        await page.getByRole("button", { name: /add expense/i }).click();

        const dialog = page.locator("[role='dialog']");
        // Open category select
        await dialog.locator("[role='combobox']").first().click();

        // Check for some default categories
        await expect(page.locator("[role='option']").filter({ hasText: "Food" })).toBeVisible();
        await expect(page.locator("[role='option']").filter({ hasText: "Travel" })).toBeVisible();
        await expect(page.locator("[role='option']").filter({ hasText: "Salary" })).toBeVisible();
        await expect(page.locator("[role='option']").filter({ hasText: "Other" })).toBeVisible();

        // Close by pressing Escape
        await page.keyboard.press("Escape");
    });

    test("submit button is disabled without required fields", async ({ page }) => {
        await goToExpenses(page);
        await page.getByRole("button", { name: /add expense/i }).click();

        const dialog = page.locator("[role='dialog']");
        const submitBtn = dialog.getByRole("button", { name: /add expense/i });
        await expect(submitBtn).toBeDisabled();
    });

    test("create expense successfully", async ({ page }) => {
        const desc = `E2E-Create-${Date.now()}`;
        await goToExpenses(page);
        await page.getByRole("button", { name: /add expense/i }).click();

        const dialog = page.locator("[role='dialog']");

        // Fill description
        await dialog.locator("#description").fill(desc);

        // Fill amount
        await dialog.locator("#amount").fill("75.50");

        // Select category
        await dialog.locator("[role='combobox']").first().click();
        await page.locator("[role='option']").filter({ hasText: "Food" }).click();

        // Fill vendor
        await dialog.locator("#vendor").fill("Test Vendor");

        // Submit
        const submitBtn = dialog.getByRole("button", { name: /add expense/i });
        await expect(submitBtn).toBeEnabled();
        await submitBtn.click();

        // Verify toast
        await expectToast(page, /created successfully/i);

        // Verify expense appears in table
        await expect(page.getByText(desc)).toBeVisible({ timeout: 10_000 });

        // Cleanup: find and delete the created expense
        const res = await page.request.get("/api/v1/expenses");
        const body = await res.json();
        const created = (body.expenses || []).find(
            (e: any) => e.description === desc,
        );
        if (created) {
            await deleteExpense(page, created.id);
        }
    });

    test("cancel closes dialog without creating", async ({ page }) => {
        await goToExpenses(page);
        await page.getByRole("button", { name: /add expense/i }).click();

        const dialog = page.locator("[role='dialog']");
        await expect(dialog).toBeVisible();

        await dialog.getByRole("button", { name: /cancel/i }).click();
        await expect(dialog).not.toBeVisible();
    });

    test("navigating to /expenses/new opens Add Expense dialog", async ({ page }) => {
        await page.goto("/expenses/new");
        await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/add new expense/i)).toBeVisible();
    });
});
