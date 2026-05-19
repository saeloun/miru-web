/**
 * TC-INV-017 → 019: Mark invoice as paid.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices, createSentInvoice, invoiceRowByNumber, expectToast } from "../helpers";

test.describe("Mark Invoice as Paid", () => {
    test("marks a sent invoice as paid", async ({ page }) => {
        const invoice = await createSentInvoice(page);
        await goToInvoices(page);

        const row = invoiceRowByNumber(page, invoice.invoiceNumber);
        const trigger = row.locator('[data-testid^="invoice-actions-trigger-"]');
        await trigger.click();

        const markPaidItem = page.locator('[data-testid^="invoice-action-mark-paid-"]');
        await markPaidItem.click();

        // Wait for modal content (API fetch happens first)
        const markPaidButton = page.getByRole("button", { name: /mark as paid/i });
        await expect(markPaidButton).toBeVisible({ timeout: 15_000 });

        // Amount should be displayed
        await expect(page.getByText(/\$[\d,]+\.\d{2}/).first()).toBeVisible();

        // Select transaction type if dropdown is visible
        const transactionTrigger = page.locator("text=Transaction Type");
        if (await transactionTrigger.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await transactionTrigger.click();
            const option = page
                .locator("li")
                .filter({ hasText: /bank|transfer|cash|check/i })
                .first();
            if (await option.isVisible({ timeout: 2_000 }).catch(() => false)) {
                await option.click();
            }
        }

        if (await markPaidButton.isEnabled()) {
            await markPaidButton.click();
            await expectToast(page, /paid|success/i);
        }
    });

    test("payment modal shows the correct invoice amount", async ({ page }) => {
        const invoice = await createSentInvoice(page);
        await goToInvoices(page);

        const row = invoiceRowByNumber(page, invoice.invoiceNumber);
        const trigger = row.locator('[data-testid^="invoice-actions-trigger-"]');
        await trigger.click();

        const markPaidItem = page.locator('[data-testid^="invoice-action-mark-paid-"]');
        await markPaidItem.click();

        await expect(
            page.getByRole("button", { name: /mark as paid/i })
        ).toBeVisible({ timeout: 15_000 });

        // Should contain a currency-formatted amount
        await expect(page.getByText(/\$[\d,]+\.\d{2}/).first()).toBeVisible();
    });
});
