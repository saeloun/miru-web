/**
 * TC-INV-020: Waive off invoice.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices, createSentInvoice, invoiceRowByNumber } from "../helpers";

test.describe("Waive Off Invoice", () => {
    test("waives a sent invoice from the actions menu", async ({ page }) => {
        const invoice = await createSentInvoice(page);
        await goToInvoices(page);

        const row = invoiceRowByNumber(page, invoice.invoiceNumber);
        const trigger = row.locator('[data-testid^="invoice-actions-trigger-"]');
        await trigger.click();

        const waiveItem = page.locator('[data-testid^="invoice-action-waive-"]');
        await waiveItem.click();

        // Wait for confirmation dialog content
        const waiveHeading = page.getByRole("heading", {
            name: /waive off invoice/i,
        });
        await expect(waiveHeading).toBeVisible({ timeout: 10_000 });

        // Confirm
        const confirmButton = page.getByRole("button", { name: /waive off/i });
        await confirmButton.click();

        await page.waitForLoadState("networkidle");
    });
});
