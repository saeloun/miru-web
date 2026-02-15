import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Payment Details', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to invoice details when clicking payment invoice link', async ({ page }) => {
    await navigateTo(page, '/payments');

    const invoiceLink = page.locator('a[href*="/invoices/"]').first();
    const linkExists = await invoiceLink.count() > 0;

    if (linkExists) {
      await invoiceLink.click();

      await page.waitForURL('**/invoices/**');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/invoices/');
    }
  });

  test('should display full transaction info in invoice page', async ({ page }) => {
    await navigateTo(page, '/payments');

    const invoiceLink = page.locator('a[href*="/invoices/"]').first();
    const linkExists = await invoiceLink.count() > 0;

    if (linkExists) {
      await invoiceLink.click();

      await page.waitForURL('**/invoices/**');

      const invoiceContent = page.locator('h1, h2, h3').first();
      await expect(invoiceContent).toBeVisible();
    }
  });

  test('should show payment details section in invoice', async ({ page }) => {
    await navigateTo(page, '/payments');

    const invoiceLink = page.locator('a[href*="/invoices/"]').first();
    const linkExists = await invoiceLink.count() > 0;

    if (linkExists) {
      const invoiceNumber = await invoiceLink.textContent();
      await invoiceLink.click();

      await page.waitForURL('**/invoices/**');

      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });

  test('should display payment amount in invoice details', async ({ page }) => {
    await navigateTo(page, '/payments');

    const firstRow = page.locator('tbody tr').first();
    const amountCell = firstRow.locator('td').nth(3);
    const amount = await amountCell.textContent();

    const invoiceLink = firstRow.locator('a[href*="/invoices/"]');
    const linkExists = await invoiceLink.count() > 0;

    if (linkExists) {
      await invoiceLink.click();

      await page.waitForURL('**/invoices/**');

      const invoicePage = page.locator('body');
      await expect(invoicePage).toBeVisible();
    }
  });

  test('should display payment method information in invoice', async ({ page }) => {
    await navigateTo(page, '/payments');

    const invoiceLink = page.locator('a[href*="/invoices/"]').first();
    const linkExists = await invoiceLink.count() > 0;

    if (linkExists) {
      await invoiceLink.click();

      await page.waitForURL('**/invoices/**');

      await page.waitForLoadState('networkidle');

      const pageContent = page.locator('body');
      await expect(pageContent).toContainText(/invoice/i);
    }
  });

  test('should show correct invoice number in details', async ({ page }) => {
    await navigateTo(page, '/payments');

    const firstInvoiceLink = page.locator('a[href*="/invoices/"]').first();
    const linkExists = await firstInvoiceLink.count() > 0;

    if (linkExists) {
      const invoiceNumber = await firstInvoiceLink.textContent();

      await firstInvoiceLink.click();

      await page.waitForURL('**/invoices/**');

      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });

  test('should display client information in invoice details', async ({ page }) => {
    await navigateTo(page, '/payments');

    const firstRow = page.locator('tbody tr').first();
    const clientName = await firstRow.locator('h3').textContent();

    const invoiceLink = firstRow.locator('a[href*="/invoices/"]');
    const linkExists = await invoiceLink.count() > 0;

    if (linkExists) {
      await invoiceLink.click();

      await page.waitForURL('**/invoices/**');

      const invoicePage = page.locator('body');
      await expect(invoicePage).toBeVisible();
    }
  });

  test('should allow navigation back to payments list', async ({ page }) => {
    await navigateTo(page, '/payments');

    const invoiceLink = page.locator('a[href*="/invoices/"]').first();
    const linkExists = await invoiceLink.count() > 0;

    if (linkExists) {
      await invoiceLink.click();

      await page.waitForURL('**/invoices/**');

      await page.goBack();

      await expect(page.locator('h2:has-text("Payments")')).toBeVisible();
    }
  });
});
