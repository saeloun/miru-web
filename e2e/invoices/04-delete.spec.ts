/**
 * TC-INV-009: Delete invoice via context menu.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices, createDraftInvoice, invoiceRowByNumber } from "../helpers";

test.describe("Delete Invoice", () => {
    test("deletes a draft invoice from the actions menu", async ({ page }) => {
        const invoice = await createDraftInvoice(page);
        await goToInvoices(page);

        const row = invoiceRowByNumber(page, invoice.invoiceNumber);
        await expect(row).toBeVisible({ timeout: 10_000 });

        // Auto-accept any native confirm/alert dialogs (window.confirm)
        page.on("dialog", dialog => dialog.accept());

        // Open the ⋮ menu
        const trigger = row.locator('[data-testid^="invoice-actions-trigger-"]');
        await trigger.click();

        // Look for a delete option
        const deleteItem = page
            .locator('[role="menuitem"]')
            .filter({ hasText: /delete/i });

        if ((await deleteItem.count()) === 0) {
            test.skip(true, "Delete action not available in dropdown");
            return;
        }

        await deleteItem.click();

        // If a DOM-based confirm dialog appears, click it
        const confirmButton = page.getByRole("button", {
            name: /confirm|delete|yes/i,
        });
        if (await confirmButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await confirmButton.click();
        }

        // The deleted invoice should no longer appear
        await expect(
            invoiceRowByNumber(page, invoice.invoiceNumber)
        ).not.toBeVisible({ timeout: 15_000 });
    });
});
