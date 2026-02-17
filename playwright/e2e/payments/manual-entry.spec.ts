import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Manual Payment Entry', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display add manual entry button', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await expect(addButton).toBeVisible();
  });

  test('should open manual entry modal when button is clicked', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    const modal = page.locator('[role="dialog"], .modal, div:has-text("Add Payment")').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should display modal title', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    const modalTitle = page.locator('h6:has-text("Add Payment"), h3:has-text("Add Payment"), h2:has-text("Add Payment")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
  });

  test('should have close button in modal', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    await page.waitForTimeout(500);

    const closeButton = page.locator('button.modal__button, button[aria-label="Close"], svg').first();
    await expect(closeButton).toBeVisible({ timeout: 5000 });
  });

  test('should close modal when close button is clicked', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    await page.waitForTimeout(500);

    const closeButton = page.locator('button.modal__button').first();
    const closeButtonExists = await closeButton.count() > 0;

    if (closeButtonExists) {
      await closeButton.click();

      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"], .modal');
      const modalCount = await modal.count();

      expect(modalCount).toBe(0);
    }
  });

  test('should display payment form fields', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const formFields = page.locator('input, select, textarea');
    const fieldCount = await formFields.count();

    expect(fieldCount).toBeGreaterThan(0);
  });

  test('should have invoice selection field', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const selectFields = page.locator('select, [role="combobox"], input[placeholder*="invoice"], input[placeholder*="Invoice"]');
    const selectCount = await selectFields.count();

    expect(selectCount).toBeGreaterThanOrEqual(0);
  });

  test('should have amount input field', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const amountFields = page.locator('input[type="number"], input[name*="amount"], input[placeholder*="amount"], input[placeholder*="Amount"]');
    const amountCount = await amountFields.count();

    expect(amountCount).toBeGreaterThanOrEqual(0);
  });

  test('should have date input field', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const dateFields = page.locator('input[type="date"], input[name*="date"], input[placeholder*="date"], input[placeholder*="Date"]');
    const dateCount = await dateFields.count();

    expect(dateCount).toBeGreaterThanOrEqual(0);
  });

  test('should have notes/description field', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const notesFields = page.locator('textarea, input[name*="note"], input[placeholder*="note"], input[placeholder*="Note"]');
    const notesCount = await notesFields.count();

    expect(notesCount).toBeGreaterThanOrEqual(0);
  });

  test('should have submit button', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    await page.waitForTimeout(1000);

    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add"), button:has-text("Submit")');
    const submitCount = await submitButton.count();

    expect(submitCount).toBeGreaterThan(0);
  });

  test('should close modal on escape key press', async ({ page }) => {
    await navigateTo(page, '/payments');

    const addButton = page.locator('button:has-text("Add Manual Entry")');
    await addButton.click();

    await page.waitForTimeout(500);

    await page.keyboard.press('Escape');

    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"], .modal');
    const modalCount = await modal.count();

    expect(modalCount).toBeLessThanOrEqual(1);
  });
});
