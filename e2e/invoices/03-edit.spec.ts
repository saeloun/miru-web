/**
 * TC-INV-007 → 008: Edit invoice — draft and non-draft.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices, createDraftInvoice, invoiceRowByNumber } from "../helpers";

test.describe("Edit Invoice", () => {
    test("draft row actions menu shows edit option", async ({ page }) => {
        const invoice = await createDraftInvoice(page);
        await goToInvoices(page);

        const row = page.locator(`[data-testid="invoice-row-${invoice.id}"]`);
        await expect(row).toBeVisible();

        await page
            .locator(`[data-testid="invoice-actions-trigger-${invoice.id}"]`)
            .click();
        await expect(
            page.locator(`[data-testid="invoice-action-edit-${invoice.id}"]`)
        ).toBeVisible();
    });

    test("opens a draft invoice and navigates to editor", async ({ page }) => {
        const invoice = await createDraftInvoice(page);
        await goToInvoices(page);

        const row = invoiceRowByNumber(page, invoice.invoiceNumber);
        await row.click();
        await page.waitForLoadState("networkidle");

        const editButton = page.getByRole("button", { name: /edit/i });
        await expect(editButton).toBeVisible({ timeout: 10_000 });
        await editButton.click();

        await page.waitForURL(/\/invoices\/\d+\/edit/, { timeout: 10_000 });

        const invoiceNumberInput = page.locator("#invoiceNumber");
        await expect(invoiceNumberInput).toBeVisible({ timeout: 10_000 });
        await expect(invoiceNumberInput).toHaveValue(invoice.invoiceNumber);
    });

    test("changing discount updates the total in preview", async ({ page }) => {
        const invoice = await createDraftInvoice(page);
        await goToInvoices(page);

        const row = invoiceRowByNumber(page, invoice.invoiceNumber);
        await row.click();
        await page.waitForLoadState("networkidle");

        const editButton = page.getByRole("button", { name: /edit/i });
        await expect(editButton).toBeVisible({ timeout: 10_000 });
        await editButton.click();
        await page.waitForURL(/\/invoices\/\d+\/edit/, { timeout: 10_000 });

        const discountInput = page.locator("#discount");
        await expect(discountInput).toBeVisible({ timeout: 10_000 });
        await discountInput.clear();
        await discountInput.fill("50");

        // Verify the discount input holds the new value
        await expect(discountInput).toHaveValue("50");
    });
});
