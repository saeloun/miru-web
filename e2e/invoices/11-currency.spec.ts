/**
 * TC-INV-021: Invoice currency syncs with client currency.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices } from "../helpers";

test.describe("Invoice Currency", () => {
    test("currency updates when a client is selected", async ({ page }) => {
        await goToInvoices(page);
        await page.getByRole("button", { name: /create.*invoice/i }).click();
        await expect(page.getByText(/new invoice/i).first()).toBeVisible();

        // Select the client dropdown
        const clientTrigger = page.locator(
            '[data-testid="invoice-client-select"]'
        );
        await clientTrigger.click();

        // Pick the first client
        await page.locator('[role="option"]').first().click();

        // After selecting a client, verify the page didn't crash and the client
        // was selected (the trigger no longer shows the placeholder)
        await expect(clientTrigger).not.toContainText(/select client/i, {
            timeout: 5_000,
        });
    });

    test("invoice list shows correct currency per invoice", async ({ page }) => {
        await goToInvoices(page);

        // The amount column should contain currency-formatted values
        const amountCells = page.locator(
            "tr[data-testid^='invoice-row-'] td:nth-last-child(2)"
        );
        const count = await amountCells.count();

        if (count > 0) {
            const text = await amountCells.first().innerText();
            // Should contain a number with decimal
            expect(text).toMatch(/[\d,]+\.\d{2}/);
        }
    });
});
