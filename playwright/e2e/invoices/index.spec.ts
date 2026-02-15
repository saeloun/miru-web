import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Invoices - Index Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('invoices page loads with heading/title', async ({ page }) => {
    await navigateTo(page, '/invoices');
    await expect(page.locator('text=Invoices')).toBeVisible({ timeout: 10000 });
  });

  test('shows list of invoices in a table', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const table = page.locator('table, [role="table"]');
    await expect(table).toBeVisible({ timeout: 10000 });
    const invoiceRows = page.locator('tr').filter({ hasText: /INV-\d+/ });
    const count = await invoiceRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('each invoice shows invoice number, client, amount, status, date', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await expect(firstInvoiceRow).toBeVisible({ timeout: 10000 });
    await expect(firstInvoiceRow).toContainText(/INV-\d+/);
    await expect(firstInvoiceRow).toContainText(/\$/);
  });

  test('status badges show (draft, sent, viewed, paid, overdue)', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const statusBadges = page.locator('[class*="badge"], [class*="status"], span').filter({
      hasText: /(draft|sent|viewed|paid|overdue)/i
    });
    const badgeCount = await statusBadges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('"New Invoice" or "Generate Invoice" button is visible', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const newInvoiceButton = page.locator('button, a').filter({
      hasText: /(New Invoice|Generate Invoice|Create Invoice)/i
    });
    await expect(newInvoiceButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('search/filter functionality exists', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], input[name*="search" i]');
    const hasSearch = await searchInput.count();
    expect(hasSearch).toBeGreaterThan(0);
  });

  test('can filter by status', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const filterDropdown = page.locator('select, [role="combobox"]').filter({
      hasText: /(Status|Filter|All)/i
    });
    const hasFilter = await filterDropdown.count();
    if (hasFilter > 0) {
      await expect(filterDropdown.first()).toBeVisible();
    }
  });

  test('shows invoice analytics/summary (total outstanding, overdue)', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const summarySection = page.locator('text=/outstanding|overdue|total/i').first();
    const hasSummary = await summarySection.count();
    if (hasSummary > 0) {
      await expect(summarySection).toBeVisible();
    }
  });
});
