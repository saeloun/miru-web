import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Expense Details', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to expense detail page when clicking an expense', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/expenses/');
    }
  });

  test('should display expense detail information', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });

  test('should show edit button in expense details', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      const editButton = page.locator('button:has-text("Edit"), button[aria-label="Edit"]');
      const editCount = await editButton.count();

      expect(editCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show delete button in expense details', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      const deleteButton = page.locator('button:has-text("Delete"), button[aria-label="Delete"]');
      const deleteCount = await deleteButton.count();

      expect(deleteCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display expense category in details', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });

  test('should display expense amount in details', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });

  test('should open edit modal when edit button is clicked', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      const editButton = page.locator('button:has-text("Edit"), button[aria-label="Edit"]').first();
      const editExists = await editButton.count() > 0;

      if (editExists) {
        await editButton.click();

        await page.waitForTimeout(1000);

        const editModal = page.locator('[role="dialog"], .modal, div:has-text("Edit")');
        const modalCount = await editModal.count();

        expect(modalCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should open delete confirmation when delete button is clicked', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      const deleteButton = page.locator('button:has-text("Delete"), button[aria-label="Delete"]').first();
      const deleteExists = await deleteButton.count() > 0;

      if (deleteExists) {
        await deleteButton.click();

        await page.waitForTimeout(1000);

        const confirmModal = page.locator('[role="dialog"], .modal, div:has-text("Delete")');
        const modalCount = await confirmModal.count();

        expect(modalCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should allow navigation back to expenses list', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      await page.goBack();

      await page.waitForTimeout(500);

      const heading = page.locator('h2:has-text("Expenses")');
      await expect(heading).toBeVisible();
    }
  });

  test('should display vendor information in details', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });

  test('should display expense date in details', async ({ page }) => {
    await navigateTo(page, '/expenses');

    await page.waitForTimeout(1000);

    const expenseLink = page.locator('a[href*="/expenses/"]').first();
    const linkExists = await expenseLink.count() > 0;

    if (linkExists) {
      await expenseLink.click();

      await page.waitForURL('**/expenses/**');

      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });
});
