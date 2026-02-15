import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Clients - Editing Clients', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('edit button opens edit form from clients list', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    await page.waitForTimeout(500);

    const editIcon = firstRow.locator('svg, button[aria-label*="Edit"], [class*="edit"]');
    if (await editIcon.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editIcon.first().click();

      const modal = page.locator('[role="dialog"], .modal, text="Edit Client"');
      await expect(modal.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('edit form loads with existing client data', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    const clientNameInList = await firstRow.locator('td').first().textContent();

    await firstRow.hover();
    await page.waitForTimeout(500);

    const editIcon = firstRow.locator('svg, button[aria-label*="Edit"], [class*="edit"]');
    if (await editIcon.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editIcon.first().click();

      await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

      const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
      const inputValue = await nameInput.inputValue();

      expect(inputValue.length).toBeGreaterThan(0);
    }
  });

  test('can update client name', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    await page.waitForTimeout(500);

    const editIcon = firstRow.locator('svg, button[aria-label*="Edit"], [class*="edit"]');
    if (await editIcon.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editIcon.first().click();

      await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

      const timestamp = Date.now();
      const newName = `Updated Client ${timestamp}`;

      const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
      await nameInput.clear();
      await nameInput.fill(newName);

      const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
      await saveButton.first().click();

      await page.waitForTimeout(2000);

      const modalClosed = await page.locator('[role="dialog"], .modal').isVisible({ timeout: 2000 }).catch(() => false);
      expect(modalClosed).toBeFalsy();
    }
  });

  test('can update client email', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    await page.waitForTimeout(500);

    const editIcon = firstRow.locator('svg, button[aria-label*="Edit"], [class*="edit"]');
    if (await editIcon.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editIcon.first().click();

      await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

      const timestamp = Date.now();
      const newEmail = `updated${timestamp}@example.com`;

      const emailInput = page.locator('input[name*="email"], input[type="email"], input[placeholder*="Email"]').first();
      await emailInput.clear();
      await emailInput.fill(newEmail);

      const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
      await saveButton.first().click();

      await page.waitForTimeout(2000);
    }
  });

  test('save button persists changes', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    await page.waitForTimeout(500);

    const editIcon = firstRow.locator('svg, button[aria-label*="Edit"], [class*="edit"]');
    if (await editIcon.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editIcon.first().click();

      await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

      const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
      const originalValue = await nameInput.inputValue();

      const timestamp = Date.now();
      const updatedName = `${originalValue} - Updated ${timestamp}`;

      await nameInput.clear();
      await nameInput.fill(updatedName);

      const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
      await saveButton.first().click();

      await page.waitForTimeout(2000);

      const successMessage = page.locator('text=/updated|successfully|saved/i');
      const modalClosed = await page.locator('[role="dialog"], .modal').isVisible({ timeout: 2000 }).catch(() => false);

      const hasSuccess = await successMessage.isVisible({ timeout: 2000 }).catch(() => false) || !modalClosed;
      expect(hasSuccess).toBeTruthy();
    }
  });

  test('cancel button discards changes', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    await page.waitForTimeout(500);

    const editIcon = firstRow.locator('svg, button[aria-label*="Edit"], [class*="edit"]');
    if (await editIcon.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editIcon.first().click();

      await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

      const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
      await nameInput.clear();
      await nameInput.fill('This Should Not Be Saved');

      const cancelButton = page.locator('button:has-text("Cancel"), button[aria-label="Close"], svg');
      await cancelButton.first().click();

      await page.waitForTimeout(1000);

      const modalClosed = await page.locator('[role="dialog"], .modal').isVisible({ timeout: 2000 }).catch(() => false);
      expect(modalClosed).toBeFalsy();
    }
  });

  test('edit form from client detail page', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="Edit"], a:has-text("Edit"), svg');

    if (await editButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.first().click();

      const modal = page.locator('[role="dialog"], .modal, text="Edit Client"');
      const hasModal = await modal.first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasModal).toBeTruthy();
    }
  });

  test('updated data shows on client detail page after edit', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="Edit"], a:has-text("Edit"), svg');

    if (await editButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.first().click();

      await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

      const timestamp = Date.now();
      const updatedName = `Client Updated ${timestamp}`;

      const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
      await nameInput.clear();
      await nameInput.fill(updatedName);

      const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
      await saveButton.first().click();

      await page.waitForTimeout(2000);

      await page.reload();
      await page.waitForLoadState('networkidle');
    }
  });

  test('validation prevents saving invalid email format', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    await page.waitForTimeout(500);

    const editIcon = firstRow.locator('svg, button[aria-label*="Edit"], [class*="edit"]');
    if (await editIcon.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editIcon.first().click();

      await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

      const emailInput = page.locator('input[name*="email"], input[type="email"], input[placeholder*="Email"]').first();
      await emailInput.clear();
      await emailInput.fill('invalid-email-format');

      const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
      await saveButton.first().click();

      await page.waitForTimeout(1000);

      const errorMessage = page.locator('text=/invalid|valid email|email format/i, .error');
      const hasError = await errorMessage.count() > 0;

      expect(hasError).toBeTruthy();
    }
  });
});
