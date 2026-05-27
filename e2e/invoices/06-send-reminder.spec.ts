/**
 * TC-INV-014: Send reminder for overdue invoices.
 *
 * Creates a draft invoice, sends it, then directly updates its status
 * to "overdue" via the API (bypassing the background job).
 */
import { test, expect } from "@playwright/test";
import { createSentInvoice, expectToast } from "../helpers";

test.describe("Send Reminder", () => {
    test("sends a reminder for an overdue invoice", async ({ page }) => {
        // Create a sent invoice
        const invoice = await createSentInvoice(page);

        // Directly update the invoice status to "overdue" via API
        const updateRes = await page.request.patch(`/api/v1/invoices/${invoice.id}`, {
            data: {
                invoice: {
                    status: "overdue",
                },
            },
        });
        expect(updateRes.ok(), `Failed to mark invoice as overdue: ${updateRes.status()}`).toBeTruthy();

        // Navigate to invoices and find the overdue invoice
        await page.goto("/invoices");
        await page.waitForLoadState("networkidle");

        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill(invoice.invoiceNumber || invoice.invoice_number);
        await page.waitForTimeout(500);

        const row = page
            .locator("tr[data-testid^='invoice-row-']")
            .filter({ hasText: invoice.invoiceNumber || invoice.invoice_number })
            .first();

        await expect(row).toBeVisible({ timeout: 10_000 });

        // Open the actions menu
        const trigger = row.locator('[data-testid^="invoice-actions-trigger-"]');
        await trigger.click();

        // Click "Send Reminder"
        const reminderItem = page.locator('[data-testid^="invoice-action-reminder-"]');
        await expect(reminderItem).toBeVisible({ timeout: 5_000 });
        await reminderItem.click();

        // Reminder dialog should appear
        await expect(
            page.getByRole("heading", { name: /send.*reminder/i }),
        ).toBeVisible({ timeout: 10_000 });

        // Click Send Reminder button
        const sendButton = page.getByRole("button").filter({ hasText: /send reminder/i });
        await expect(sendButton).toBeEnabled({ timeout: 5_000 });
        await sendButton.click();

        // Should show success
        await expectToast(page, /sent|reminder/i);
    });
});
