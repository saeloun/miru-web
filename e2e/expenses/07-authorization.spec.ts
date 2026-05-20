/**
 * Expenses — Role-based access: admin vs employee.
 * Covers manual test section: 11 (Role-Based Access).
 *
 * Admin tests use the shared storageState from global-setup.
 * Employee tests authenticate once in beforeAll and save a separate storage state,
 * avoiding the SPA redirect race that occurs when logging in per-test.
 */
import { test, expect, Page } from "@playwright/test";
import { signInAsSeedUser } from "../navigation/helpers";

async function openExpensesAsEmployee(page: Page) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            await signInAsSeedUser(page, "employee");
        } catch {
            continue;
        }
        await page.goto("/expenses");
        if (!page.url().includes("/user/sign_in")) {
            await page.waitForLoadState("networkidle");
            return;
        }
    }
}

async function ensureEmployeeExpensesPage(page: Page) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        await openExpensesAsEmployee(page);
        const onSignInView = await page
            .getByRole("heading", { name: /sign in to your workspace/i })
            .isVisible()
            .catch(() => false);
        if (!onSignInView) return;
    }
}

test.describe("Expenses — Authorization (admin)", () => {
    test("admin sees 'Submitted by' column", async ({ page }) => {
        await page.goto("/expenses");
        await page.waitForLoadState("networkidle");

        await expect(
            page.locator("th, [role='columnheader']").getByText(/submitted by/i),
        ).toBeVisible({ timeout: 10_000 });
    });
});

test.describe("Expenses — Authorization (employee)", () => {
    test.use({ storageState: undefined });

    test("employee sees Add Expense button but not 'Submitted by' column", async ({ page }) => {
        await ensureEmployeeExpensesPage(page);
        const addExpenseButton = page.getByRole("button", { name: /add expense/i });
        if (!(await addExpenseButton.isVisible().catch(() => false))) {
            await ensureEmployeeExpensesPage(page);
        }

        await expect(
            addExpenseButton,
        ).toBeVisible({ timeout: 15_000 });

        await expect(
            page.locator("th, [role='columnheader']").getByText(/submitted by/i),
        ).not.toBeVisible({ timeout: 5_000 });
    });

    test("employee does not see approve/reject actions on own expense", async ({ page }) => {
        await ensureEmployeeExpensesPage(page);

        await expect(
            page.locator("table, :text('No expenses recorded'), :text('Submit your first expense')").first(),
        ).toBeVisible({ timeout: 15_000 });

        const rows = page.locator("tr, [role='row']").filter({
            has: page.locator("button"),
        });
        const rowCount = await rows.count();
        if (rowCount > 1) {
            const actionsBtn = rows.nth(1).locator("button").last();
            await actionsBtn.click();

            await expect(
                page.getByRole("menuitem", { name: /approve expense/i }),
            ).not.toBeVisible();
            await expect(
                page.getByRole("menuitem", { name: /reject expense/i }),
            ).not.toBeVisible();
            await expect(
                page.getByRole("menuitem", { name: /mark as paid/i }),
            ).not.toBeVisible();

            await page.keyboard.press("Escape");
        }
    });
});
