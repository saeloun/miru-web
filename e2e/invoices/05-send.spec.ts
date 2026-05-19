/**
 * TC-INV-012 → 013: Send invoice — happy path and validation.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices, createDraftInvoice, invoiceRowByNumber, expectToast } from "../helpers";

test.describe("Send Invoice", () => {
    test("sends a draft invoice via the actions menu", async ({ page }) => {
        const invoice = await createDraftInvoice(page);
        await goToInvoices(page);

        const row = invoiceRowByNumber(page, invoice.invoiceNumber);
        const trigger = row.locator('[data-testid^="invoice-actions-trigger-"]');
        await trigger.click();

        const sendItem = page.locator('[data-testid^="invoice-action-send-"]');
        await sendItem.click();

        // Wait for dialog content
        const dialogHeading = page.getByRole("heading", { name: /send invoice/i });
        await expect(dialogHeading).toBeVisible({ timeout: 10_000 });

        // Subject should be pre-filled
        const subjectInput = page.locator('input[name="subject"]');
        await expect(subjectInput).toBeVisible();
        await expect(subjectInput).not.toHaveValue("");

        // Client email is pre-filled as recipient — click Send
        const sendButton = page.getByRole("button", {
            name: "Send Invoice",
            exact: true,
        });
        await expect(sendButton).toBeEnabled();
        await sendButton.click();
        await expectToast(page, /sent/i);
    });

    test("send button is enabled when recipients exist", async ({ page }) => {
        const invoice = await createDraftInvoice(page);
        await goToInvoices(page);

        const row = invoiceRowByNumber(page, invoice.invoiceNumber);
        const trigger = row.locator('[data-testid^="invoice-actions-trigger-"]');
        await trigger.click();

        const sendItem = page.locator('[data-testid^="invoice-action-send-"]');
        await sendItem.click();

        await expect(
            page.getByRole("heading", { name: /send invoice/i })
        ).toBeVisible({ timeout: 10_000 });

        const sendButton = page.getByRole("button", {
            name: "Send Invoice",
            exact: true,
        });
        await expect(sendButton).toBeEnabled();
    });
});
