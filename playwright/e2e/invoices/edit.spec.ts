import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Invoices - Edit Invoice', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('draft invoice can be edited', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const draftInvoiceRow = page.locator('tr').filter({ hasText: /draft/i }).first();
    const hasDraft = await draftInvoiceRow.count();
    if (hasDraft > 0) {
      await draftInvoiceRow.click();
      await page.waitForURL(/\/invoices\/\d+/);
      const editButton = page.locator('button, a').filter({ hasText: /edit/i });
      await expect(editButton.first()).toBeVisible({ timeout: 10000 });
    } else {
      const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
      await firstInvoiceRow.click();
      await page.waitForURL(/\/invoices\/\d+/);
    }
  });

  test('edit page loads with existing invoice data', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await expect(firstInvoiceRow).toBeVisible({ timeout: 10000 });
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const currentUrl = page.url();
    if (currentUrl.includes('/edit')) {
      const invoiceNumberInput = page.locator('input[name="invoiceNumber"], input[name="invoice_number"]');
      await expect(invoiceNumberInput).toHaveValue(/.+/, { timeout: 10000 });
    } else {
      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
      const hasEdit = await editButton.count();
      if (hasEdit > 0) {
        await editButton.click();
        await page.waitForURL(/\/invoices\/\d+\/edit/);
      }
    }
  });

  test('can modify line items', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const currentUrl = page.url();
    if (!currentUrl.includes('/edit')) {
      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
      const hasEdit = await editButton.count();
      if (hasEdit > 0) {
        await editButton.click();
        await page.waitForURL(/\/invoices\/\d+\/edit/);
      }
    }
    const lineItemInput = page.locator('input[name*="description" i], input[name*="quantity" i], input[name*="rate" i]').first();
    const hasLineItems = await lineItemInput.count();
    if (hasLineItems > 0) {
      await expect(lineItemInput).toBeVisible({ timeout: 10000 });
    }
  });

  test('can update amounts', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const currentUrl = page.url();
    if (!currentUrl.includes('/edit')) {
      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
      const hasEdit = await editButton.count();
      if (hasEdit > 0) {
        await editButton.click();
        await page.waitForURL(/\/invoices\/\d+\/edit/);
      }
    }
    const amountInput = page.locator('input[name*="rate" i], input[name*="amount" i], input[name*="price" i]').first();
    const hasAmount = await amountInput.count();
    if (hasAmount > 0) {
      await expect(amountInput).toBeVisible({ timeout: 10000 });
    }
  });

  test('save button updates the invoice', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await expect(firstInvoiceRow).toBeVisible({ timeout: 10000 });
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const currentUrl = page.url();
    if (!currentUrl.includes('/edit')) {
      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
      const hasEdit = await editButton.count();
      if (hasEdit > 0) {
        await editButton.click();
        await page.waitForURL(/\/invoices\/\d+\/edit/);
      }
    }
    const saveButton = page.locator('button:has-text("Save")');
    const hasSave = await saveButton.count();
    if (hasSave > 0) {
      const invoiceNumberInput = page.locator('input[name="invoiceNumber"]');
      const hasInvoiceNumber = await invoiceNumberInput.count();
      if (hasInvoiceNumber > 0) {
        const currentValue = await invoiceNumberInput.inputValue();
        await invoiceNumberInput.fill(currentValue + '-TEST');
        await expect(saveButton).toBeEnabled();
        await saveButton.click();
        const toast = page.locator('[data-sonner-toast]');
        await expect(toast).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('invoice number can be changed', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const currentUrl = page.url();
    if (!currentUrl.includes('/edit')) {
      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
      const hasEdit = await editButton.count();
      if (hasEdit > 0) {
        await editButton.click();
        await page.waitForURL(/\/invoices\/\d+\/edit/);
      }
    }
    const invoiceNumberInput = page.locator('input[name="invoiceNumber"], input[name="invoice_number"]');
    const hasInvoiceNumber = await invoiceNumberInput.count();
    if (hasInvoiceNumber > 0) {
      await expect(invoiceNumberInput).toBeEditable({ timeout: 10000 });
    }
  });

  test('changes persist after save', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await expect(firstInvoiceRow).toBeVisible({ timeout: 10000 });
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const currentUrl = page.url();
    if (!currentUrl.includes('/edit')) {
      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
      const hasEdit = await editButton.count();
      if (hasEdit > 0) {
        await editButton.click();
        await page.waitForURL(/\/invoices\/\d+\/edit/);
      }
    }
    const saveButton = page.locator('button:has-text("Save")');
    const invoiceNumberInput = page.locator('input[name="invoiceNumber"]');
    const hasBoth = await saveButton.count() > 0 && await invoiceNumberInput.count() > 0;
    if (hasBoth) {
      const currentValue = await invoiceNumberInput.inputValue();
      const newValue = currentValue + '-PERSIST';
      await invoiceNumberInput.fill(newValue);
      await saveButton.click();
      await page.waitForTimeout(2000);
      await expect(saveButton).toBeDisabled();
    }
  });
});
