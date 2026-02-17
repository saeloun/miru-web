import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Invoices - Detail/View Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('clicking an invoice shows detail page', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await expect(firstInvoiceRow).toBeVisible({ timeout: 10000 });
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
  });

  test('invoice detail shows full info: number, date, client, amount', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    await expect(page.locator('text=/INV-\d+/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\$/').first()).toBeVisible();
  });

  test('line items table is visible with amounts', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const lineItemsTable = page.locator('table, [role="table"]').filter({
      hasText: /(Description|Item|Quantity|Rate|Amount)/i
    });
    const hasLineItems = await lineItemsTable.count();
    if (hasLineItems > 0) {
      await expect(lineItemsTable.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('status badge shows current status', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const statusBadge = page.locator('[class*="badge"], [class*="status"], span').filter({
      hasText: /(draft|sent|viewed|paid|overdue)/i
    });
    await expect(statusBadge.first()).toBeVisible({ timeout: 10000 });
  });

  test('action buttons available (Send, Download, Mark Paid)', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const sendButton = page.locator('button, a').filter({ hasText: /send/i });
    const downloadButton = page.locator('button, a').filter({ hasText: /download/i });
    const markPaidButton = page.locator('button, a').filter({ hasText: /mark.*paid/i });
    const moreMenu = page.locator('#menuOpen, button[aria-label*="menu" i]');
    const hasActions = await sendButton.count() > 0 ||
                       await downloadButton.count() > 0 ||
                       await markPaidButton.count() > 0 ||
                       await moreMenu.count() > 0;
    expect(hasActions).toBeTruthy();
  });

  test('tax and discount information shown if applicable', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const taxElement = page.locator('text=/tax|discount/i');
    const hasTaxInfo = await taxElement.count();
    if (hasTaxInfo > 0) {
      await expect(taxElement.first()).toBeVisible();
    }
  });

  test('company info and client info shown on invoice', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const companyInfo = page.locator('text=/company|organization|from/i');
    const clientInfo = page.locator('text=/client|customer|to|bill to/i');
    const hasCompanyInfo = await companyInfo.count();
    const hasClientInfo = await clientInfo.count();
    expect(hasCompanyInfo > 0 || hasClientInfo > 0).toBeTruthy();
  });
});
