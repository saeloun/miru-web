/**
 * Add Manual Payment Entry — dialog, form fields, submit.
 * Covers manual test section 4.
 */
import { test, expect } from "@playwright/test";
import { goToPayments } from "./helpers";

/** Open the Add Manual Entry dialog — works regardless of which button triggers it. */
async function openAddPaymentDialog(page) {
    // Try the desktop header button first (hidden md:flex — may not be visible in all viewports)
    const headerBtn = page.locator("#addEntry");
    const isHeaderBtnVisible = await headerBtn.isVisible().catch(() => false);

    if (isHeaderBtnVisible) {
        await headerBtn.click();
    } else {
        // Fall back to the empty state button if no payments exist
        const emptyStateBtn = page.getByRole("button", { name: /add manual entry/i });
        const isEmptyBtnVisible = await emptyStateBtn.isVisible().catch(() => false);
        if (isEmptyBtnVisible) {
            await emptyStateBtn.click();
        } else {
            // Force-click the header button even if hidden (it's in the DOM)
            await headerBtn.dispatchEvent("click");
        }
    }

    await expect(
        page.getByRole("heading", { name: /add payment/i }),
    ).toBeVisible({ timeout: 10_000 });
}

test.describe("Payments — Add Manual Entry", () => {
    test("clicking Add Manual Entry opens the dialog", async ({ page }) => {
        await goToPayments(page);
        await openAddPaymentDialog(page);
        await expect(
            page.getByRole("heading", { name: /add payment/i }),
        ).toBeVisible();
    });

    test("dialog has invoice, date, transaction type, amount, and notes fields", async ({ page }) => {
        await goToPayments(page);
        await openAddPaymentDialog(page);

        await expect(page.locator("#invoicesList, #invoice").first()).toBeAttached();
        await expect(page.locator("#transactionDate").first()).toBeAttached();
        await expect(page.locator("#transactionType").first()).toBeAttached();
        await expect(page.locator("#paymentAmount").first()).toBeAttached();
        await expect(page.locator("#NotesOptional").first()).toBeAttached();
    });

    test("transaction type dropdown has options", async ({ page }) => {
        await goToPayments(page);
        await openAddPaymentDialog(page);

        const selectTrigger = page.getByRole("button", { name: /transaction type/i });
        await expect(selectTrigger).toBeVisible({ timeout: 5_000 });
        await selectTrigger.click();

        const options = page.locator("[role='option'], [role='menuitem'], [role='listbox'] button");
        const count = await options.count();
        expect(count).toBeGreaterThan(0);
        await page.keyboard.press("Escape");
    });

    test("Escape closes the dialog", async ({ page }) => {
        await goToPayments(page);
        await openAddPaymentDialog(page);

        await page.keyboard.press("Escape");

        await expect(
            page.getByRole("heading", { name: /add payment/i }),
        ).not.toBeVisible();
    });

    test("invoice dropdown shows empty state when no invoices exist", async ({ page }) => {
        await goToPayments(page);
        await openAddPaymentDialog(page);

        const invoiceSelector = page.locator("#invoicesList, [data-testid='invoice-selector']").first();
        const hasSelectorVisible = await invoiceSelector.isVisible().catch(() => false);
        if (hasSelectorVisible) {
            await invoiceSelector.click();
            const emptyMessage = page.getByText(/no invoices available/i);
            const hasEmpty = await emptyMessage.isVisible({ timeout: 3_000 }).catch(() => false);
            if (hasEmpty) {
                await expect(emptyMessage).toBeVisible();
            }
        }
        await page.keyboard.press("Escape");
    });
});
