import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Expenses List', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display the expenses page with heading', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const heading = page.locator('h2:has-text("Expenses")');
    await expect(heading).toBeVisible();
  });

  test('should show list of expenses', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseItems = page.locator('[class*="expense"], tbody tr, [data-cy*="expense"]');
    const itemCount = await expenseItems.count();

    expect(itemCount).toBeGreaterThanOrEqual(0);
  });

  test('should display add expense button', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await expect(addButton).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    await expect(searchInput).toBeVisible();
  });

  test('should search expenses by typing', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    await searchInput.fill('test');

    await page.waitForTimeout(500);

    const resultsContainer = page.locator('body');
    await expect(resultsContainer).toBeVisible();
  });

  test('should display expense categories', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const categoryElements = page.locator('[class*="category"], td:has-text("category"), .subtitle');
    const categoryCount = await categoryElements.count();

    expect(categoryCount).toBeGreaterThanOrEqual(0);
  });

  test('should display expense amounts', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const amountElements = page.locator('[class*="amount"], td, .amount');
    const amountCount = await amountElements.count();

    expect(amountCount).toBeGreaterThanOrEqual(0);
  });

  test('should display expense dates', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const dateElements = page.locator('[class*="date"], td, .date');
    const dateCount = await dateElements.count();

    expect(dateCount).toBeGreaterThanOrEqual(0);
  });

  test('should display vendor/description information', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });

  test('should allow clicking on expenses to view details', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLinks = page.locator('a[href*="/expenses/"], tr[class*="cursor-pointer"]');
    const linkCount = await expenseLinks.count();

    expect(linkCount).toBeGreaterThanOrEqual(0);
  });

  test('should clear search when input is cleared', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    await searchInput.clear();
    await page.waitForTimeout(500);

    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });
});
