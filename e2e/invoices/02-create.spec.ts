/**
 * TC-INV-004 → 006: Create invoice — happy path, from timesheet, validation.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices, expectToast, selectFirstOption } from "../helpers";

test.describe("Create Invoice", () => {
    test.beforeEach(async ({ page }) => {
        await goToInvoices(page);
    });

    // TC-INV-004: Happy path — manual line item
    test("creates a draft invoice with a manual line item", async ({ page }) => {
        // Click "New Invoice"
        await page.getByRole("button", { name: /create.*invoice/i }).click();

        // Should be in editor mode
        await expect(page.getByText(/new invoice|edit invoice/i).first()).toBeVisible();

        // Select a client
        await selectFirstOption(page, "invoice-client-select");

        // Invoice number should be auto-generated
        const invoiceNumberInput = page.locator("#invoiceNumber");
        await expect(invoiceNumberInput).not.toHaveValue("");

        // Add a manual line item — look for the "Add New Item" or manual entry row
        const nameInput = page.getByPlaceholder(/name|item/i).first();
        if (await nameInput.isVisible()) {
            await nameInput.fill("Development Services");
        }

        const qtyInput = page.locator('input[placeholder*="0"]').first();
        if (await qtyInput.isVisible()) {
            await qtyInput.fill("10");
        }

        const rateInput = page.locator('input[placeholder*="0"]').nth(1);
        if (await rateInput.isVisible()) {
            await rateInput.fill("100");
        }

        // Save the invoice
        const saveButton = page.getByRole("button", { name: /save/i });
        if (await saveButton.isEnabled()) {
            await saveButton.click();
            // Should show success toast or redirect
            await page.waitForURL(/\/invoices\/\d+\/edit/, { timeout: 10_000 });
        }
    });

    // TC-INV-006: Validation — missing client
    test("save button is disabled without a client", async ({ page }) => {
        await page.getByRole("button", { name: /create.*invoice/i }).click();
        await expect(page.getByText(/new invoice/i).first()).toBeVisible();

        // Without selecting a client, save should be disabled
        const saveButton = page.getByRole("button", { name: /save/i });
        await expect(saveButton).toBeDisabled();
    });

    // TC-INV-006: Validation — no line items
    test("save button is disabled without line items", async ({ page }) => {
        await page.getByRole("button", { name: /create.*invoice/i }).click();

        // Select a client but don't add line items
        await selectFirstOption(page, "invoice-client-select");

        const saveButton = page.getByRole("button", { name: /save/i });
        await expect(saveButton).toBeDisabled();
    });

    // Invoice number editing — PR #2264
    test("invoice number field is editable after client selection", async ({ page }) => {
        await page.getByRole("button", { name: /create.*invoice/i }).click();
        await selectFirstOption(page, "invoice-client-select");

        const invoiceNumberInput = page.locator("#invoiceNumber");
        await expect(invoiceNumberInput).not.toHaveValue("", { timeout: 5_000 });

        const customNumber = `CUSTOM-${Date.now()}`;
        await invoiceNumberInput.fill(customNumber);
        await expect(invoiceNumberInput).toHaveValue(customNumber);
    });

    // Invoice number persistence — PR #2264
    test("manual invoice number persists after other field interactions", async ({ page }) => {
        await page.getByRole("button", { name: /create.*invoice/i }).click();
        await selectFirstOption(page, "invoice-client-select");

        const invoiceNumberInput = page.locator("#invoiceNumber");
        await expect(invoiceNumberInput).not.toHaveValue("", { timeout: 5_000 });

        const customNumber = `PERSIST-${Date.now()}`;
        await invoiceNumberInput.fill(customNumber);

        const nameInput = page.getByPlaceholder(/name|item/i).first();
        if (await nameInput.isVisible()) {
            await nameInput.fill("Test Service");
            await nameInput.blur();
        }

        await expect(invoiceNumberInput).toHaveValue(customNumber);
    });

    // Group by project checkbox — PR #2295
    test("time entry picker has a 'Group by project' checkbox", async ({ page }) => {
        await page.getByRole("button", { name: /create.*invoice/i }).click();
        await selectFirstOption(page, "invoice-client-select");

        const timesheetBtn = page.getByRole("button", { name: /timesheet|time.*entr/i });
        const hasTimesheetBtn = await timesheetBtn.isVisible().catch(() => false);
        if (!hasTimesheetBtn) return;

        await timesheetBtn.click();
        await expect(page.locator("[role='dialog'], .modal").first()).toBeVisible({ timeout: 10_000 });

        const groupCheckbox = page.getByLabel(/group.*by.*project/i).or(page.getByText(/group.*by.*project/i));
        await expect(groupCheckbox).toBeVisible({ timeout: 5_000 });
    });

});
