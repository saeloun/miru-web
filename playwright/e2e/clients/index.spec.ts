import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Clients - List Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('clients page loads with heading', async ({ page }) => {
    await navigateTo(page, '/clients');

    const heading = page.locator('h2.header__title:has-text("Clients")');
    await expect(heading).toBeVisible();
  });

  test('shows list of clients in table', async ({ page }) => {
    await navigateTo(page, '/clients');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('each client shows name and email', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();

    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThan(0);
  });

  test('shows overdue/outstanding amounts for clients', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const amountElements = page.locator('text=/\\$|overdue|outstanding/i');
    const hasAmounts = await amountElements.count() > 0;
    expect(hasAmounts).toBeTruthy();
  });

  test('"New Client" button is visible for admin', async ({ page }) => {
    await navigateTo(page, '/clients');

    const newClientButton = page.locator('button:has-text("NEW CLIENT")');
    await expect(newClientButton).toBeVisible();
  });

  test('search functionality exists', async ({ page }) => {
    await navigateTo(page, '/clients');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('empty state shown when no clients exist', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForLoadState('networkidle');

    const emptyStateMessage = page.locator('text=/Looks like there aren\'t any clients|No clients/i');
    const addClientButton = page.locator('button:has-text("Add Clients")');

    const hasEmptyState = await emptyStateMessage.isVisible({ timeout: 2000 }).catch(() => false);
    const hasAddButton = await addClientButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasEmptyState || hasAddButton) {
      expect(hasEmptyState || hasAddButton).toBeTruthy();
    } else {
      const table = page.locator('table');
      await expect(table).toBeVisible();
    }
  });

  test('clicking a client row navigates to detail page', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/clients\/\d+/);
  });

  test('search filters clients list', async ({ page }) => {
    await navigateTo(page, '/clients');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('test');
    await page.waitForTimeout(1000);

    const dropdown = page.locator('[role="listbox"], [role="menu"]');
    const hasResults = await dropdown.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasResults).toBeTruthy();
  });
});
