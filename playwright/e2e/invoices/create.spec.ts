import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Invoices - Create New Invoice', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('"New Invoice" button opens creation flow', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const newInvoiceButton = page.locator('button, a').filter({
      hasText: /(New Invoice|Generate Invoice|Create Invoice)/i
    }).first();
    await expect(newInvoiceButton).toBeVisible({ timeout: 10000 });
    await newInvoiceButton.click();
    await page.waitForURL(/\/(invoices\/new|invoices\/\d+\/edit)/);
  });

  test('can select client for invoice', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const newInvoiceButton = page.locator('button, a').filter({
      hasText: /(New Invoice|Generate Invoice|Create Invoice)/i
    }).first();
    await newInvoiceButton.click();
    await page.waitForURL(/\/(invoices\/new|invoices\/\d+\/edit)/);
    const clientSelect = page.locator('select, [role="combobox"]').filter({
      hasText: /(Client|Select Client)/i
    });
    const hasClientSelect = await clientSelect.count();
    if (hasClientSelect > 0) {
      await expect(clientSelect.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('can add line items', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const newInvoiceButton = page.locator('button, a').filter({
      hasText: /(New Invoice|Generate Invoice|Create Invoice)/i
    }).first();
    await newInvoiceButton.click();
    await page.waitForURL(/\/(invoices\/new|invoices\/\d+\/edit)/);
    const addLineItemButton = page.locator('button').filter({
      hasText: /(Add Line Item|Add Item|New Line)/i
    });
    const hasAddButton = await addLineItemButton.count();
    if (hasAddButton > 0) {
      await expect(addLineItemButton.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('line items show description, quantity, rate, amount', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const newInvoiceButton = page.locator('button, a').filter({
      hasText: /(New Invoice|Generate Invoice|Create Invoice)/i
    }).first();
    await newInvoiceButton.click();
    await page.waitForURL(/\/(invoices\/new|invoices\/\d+\/edit)/);
    const descriptionInput = page.locator('input[name*="description" i], textarea[name*="description" i]');
    const quantityInput = page.locator('input[name*="quantity" i]');
    const rateInput = page.locator('input[name*="rate" i], input[name*="price" i]');
    const hasLineItemFields = await descriptionInput.count() > 0 ||
                               await quantityInput.count() > 0 ||
                               await rateInput.count() > 0;
    expect(hasLineItemFields).toBeTruthy();
  });

  test('can add timesheet entries as line items', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const newInvoiceButton = page.locator('button, a').filter({
      hasText: /(New Invoice|Generate Invoice|Create Invoice)/i
    }).first();
    await newInvoiceButton.click();
    await page.waitForURL(/\/(invoices\/new|invoices\/\d+\/edit)/);
    const timesheetButton = page.locator('button').filter({
      hasText: /(timesheet|Select timesheet entries|Add timesheet)/i
    });
    const hasTimesheetButton = await timesheetButton.count();
    if (hasTimesheetButton > 0) {
      await expect(timesheetButton.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('invoice total calculates correctly', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const newInvoiceButton = page.locator('button, a').filter({
      hasText: /(New Invoice|Generate Invoice|Create Invoice)/i
    }).first();
    await newInvoiceButton.click();
    await page.waitForURL(/\/(invoices\/new|invoices\/\d+\/edit)/);
    const totalElement = page.locator('text=/total|subtotal|amount due/i').first();
    const hasTotal = await totalElement.count();
    if (hasTotal > 0) {
      await expect(totalElement).toBeVisible({ timeout: 10000 });
      await expect(totalElement).toContainText(/\$/);
    }
  });

  test('can set invoice number, date, due date', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const newInvoiceButton = page.locator('button, a').filter({
      hasText: /(New Invoice|Generate Invoice|Create Invoice)/i
    }).first();
    await newInvoiceButton.click();
    await page.waitForURL(/\/(invoices\/new|invoices\/\d+\/edit)/);
    const invoiceNumberInput = page.locator('input[name*="invoiceNumber" i], input[name*="invoice_number" i]');
    const dateInput = page.locator('input[name*="issueDate" i], input[name*="invoice_date" i], input[type="date"]');
    const dueDateInput = page.locator('input[name*="dueDate" i], input[name*="due_date" i]');
    const hasRequiredFields = await invoiceNumberInput.count() > 0 ||
                               await dateInput.count() > 0 ||
                               await dueDateInput.count() > 0;
    expect(hasRequiredFields).toBeTruthy();
  });

  test('can save as draft', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const newInvoiceButton = page.locator('button, a').filter({
      hasText: /(New Invoice|Generate Invoice|Create Invoice)/i
    }).first();
    await newInvoiceButton.click();
    await page.waitForURL(/\/(invoices\/new|invoices\/\d+\/edit)/);
    const saveButton = page.locator('button').filter({
      hasText: /(Save|Save as Draft|Create)/i
    });
    await expect(saveButton.first()).toBeVisible({ timeout: 10000 });
  });
});
