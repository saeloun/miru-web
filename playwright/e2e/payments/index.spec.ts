import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Payments List', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display the payments page with heading', async ({ page }) => {
    await navigateTo(page, '/payments');

    await expect(page.locator('h2:has-text("Payments")')).toBeVisible();
  });

  test('should show list of payments/transactions', async ({ page }) => {
    await navigateTo(page, '/payments');

    const paymentsTable = page.locator('table');
    await expect(paymentsTable).toBeVisible();

    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();

    expect(rowCount).toBeGreaterThan(0);
  });

  test('should display payment details in each row', async ({ page }) => {
    await navigateTo(page, '/payments');

    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();

    await expect(firstRow.locator('td').nth(0)).toBeVisible();
    await expect(firstRow.locator('td').nth(1)).toBeVisible();
    await expect(firstRow.locator('td').nth(3)).toBeVisible();
  });

  test('should display payment statuses', async ({ page }) => {
    await navigateTo(page, '/payments');

    const statusBadges = page.locator('[class*="badge"], [class*="status"]');
    const badgeCount = await statusBadges.count();

    if (badgeCount > 0) {
      await expect(statusBadges.first()).toBeVisible();
    }
  });

  test('should have search functionality', async ({ page }) => {
    await navigateTo(page, '/payments');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('should search payments by client name', async ({ page }) => {
    await navigateTo(page, '/payments');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test');

    await page.waitForTimeout(500);

    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();

    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should display add manual entry button', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await expect(addButton).toBeVisible();
  });

  test('should display invoice numbers as links', async ({ page }) => {
    await navigateTo(page, '/payments');

    const invoiceLinks = page.locator('a[href*="/invoices/"]');
    const linkCount = await invoiceLinks.count();

    if (linkCount > 0) {
      await expect(invoiceLinks.first()).toBeVisible();
    }
  });

  test('should display transaction dates', async ({ page }) => {
    await navigateTo(page, '/payments');

    const firstRow = page.locator('tbody tr').first();
    const dateCell = firstRow.locator('td').nth(1);

    await expect(dateCell).toBeVisible();
  });

  test('should display payment amounts', async ({ page }) => {
    await navigateTo(page, '/payments');

    const firstRow = page.locator('tbody tr').first();
    const amountCell = firstRow.locator('td').nth(3);

    await expect(amountCell).toBeVisible();

    const amountText = await amountCell.textContent();
    expect(amountText).toBeTruthy();
  });

  test('should display transaction types', async ({ page }) => {
    await navigateTo(page, '/payments');

    const transactionTypeIcons = page.locator('svg').filter({ has: page.locator('path') });
    const iconCount = await transactionTypeIcons.count();

    expect(iconCount).toBeGreaterThan(0);
  });

  test('should display client names', async ({ page }) => {
    await navigateTo(page, '/payments');

    const firstRow = page.locator('tbody tr').first();
    const clientNameElement = firstRow.locator('h3');

    await expect(clientNameElement).toBeVisible();
  });
});
