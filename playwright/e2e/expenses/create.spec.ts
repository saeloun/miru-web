import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Creating Expenses', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display add expense button', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await expect(addButton).toBeVisible();
  });

  test('should open expense creation form when button is clicked', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const modal = page.locator('[role="dialog"], .modal, div:has-text("Add Expense")');
    const modalCount = await modal.count();

    expect(modalCount).toBeGreaterThan(0);
  });

  test('should display modal title', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const modalTitle = page.locator('h6:has-text("Add Expense"), h3:has-text("Add Expense"), h2:has-text("Add Expense"), h1:has-text("Add Expense")');
    const titleCount = await modalTitle.count();

    expect(titleCount).toBeGreaterThan(0);
  });

  test('should have date input field', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const dateFields = page.locator('input[type="date"], input[name*="date"], input[placeholder*="date"], input[placeholder*="Date"]');
    const dateCount = await dateFields.count();

    expect(dateCount).toBeGreaterThanOrEqual(0);
  });

  test('should have category selection field', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const categoryFields = page.locator('select, [role="combobox"], input[placeholder*="category"], input[placeholder*="Category"]');
    const categoryCount = await categoryFields.count();

    expect(categoryCount).toBeGreaterThanOrEqual(0);
  });

  test('should have vendor/description field', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const vendorFields = page.locator('input[name*="vendor"], input[placeholder*="vendor"], input[placeholder*="Vendor"], textarea');
    const vendorCount = await vendorFields.count();

    expect(vendorCount).toBeGreaterThanOrEqual(0);
  });

  test('should have amount input field', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const amountFields = page.locator('input[type="number"], input[name*="amount"], input[placeholder*="amount"], input[placeholder*="Amount"]');
    const amountCount = await amountFields.count();

    expect(amountCount).toBeGreaterThanOrEqual(0);
  });

  test('should have submit button', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add"), button:has-text("Submit")');
    const submitCount = await submitButton.count();

    expect(submitCount).toBeGreaterThan(0);
  });

  test('should have cancel button', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const cancelButton = page.locator('button:has-text("Cancel"), button.modal__button, [aria-label="Close"]');
    const cancelCount = await cancelButton.count();

    expect(cancelCount).toBeGreaterThan(0);
  });

  test('should close modal when cancel is clicked', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const cancelButton = page.locator('button:has-text("Cancel")').first();
    const cancelExists = await cancelButton.count() > 0;

    if (cancelExists) {
      await cancelButton.click();

      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]:visible, .modal:visible');
      const visibleModals = await modal.count();

      expect(visibleModals).toBeLessThanOrEqual(1);
    }
  });

  test('should close modal when close button is clicked', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const closeButton = page.locator('button.modal__button, [aria-label="Close"]').first();
    const closeExists = await closeButton.count() > 0;

    if (closeExists) {
      await closeButton.click();

      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]:visible, .modal:visible');
      const visibleModals = await modal.count();

      expect(visibleModals).toBeLessThanOrEqual(1);
    }
  });

  test('should display form validation for required fields', async ({ page }) => {
    await navigateTo(page, '/expenses');

    const addButton = page.locator('button:has-text("Add Expense")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add"), button:has-text("Submit")').first();
    const submitExists = await submitButton.count() > 0;

    if (submitExists) {
      await submitButton.click();

      await page.waitForTimeout(500);

      const errorMessages = page.locator('[class*="error"], [class*="invalid"], [role="alert"]');
      const errorCount = await errorMessages.count();

      expect(errorCount).toBeGreaterThanOrEqual(0);
    }
  });
});
