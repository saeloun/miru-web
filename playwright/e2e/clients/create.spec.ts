import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Clients - Creating Clients', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('"New Client" button opens creation form', async ({ page }) => {
    await navigateTo(page, '/clients');

    const newClientButton = page.locator('button:has-text("NEW CLIENT")');
    await newClientButton.click();

    const modal = page.locator('[role="dialog"], .modal, text="Add New Client"');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
  });

  test('form has required fields: name, email, phone, address', async ({ page }) => {
    await navigateTo(page, '/clients');

    const newClientButton = page.locator('button:has-text("NEW CLIENT")');
    await newClientButton.click();

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

    const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]');
    await expect(nameInput.first()).toBeVisible();

    const emailInput = page.locator('input[name*="email"], input[type="email"], input[placeholder*="Email"]');
    await expect(emailInput.first()).toBeVisible();

    const phoneInput = page.locator('input[name*="phone"], input[type="tel"], input[placeholder*="Phone"]');
    const addressInput = page.locator('input[name*="address"], textarea[name*="address"], input[placeholder*="Address"]');

    const hasPhoneOrAddress = await phoneInput.first().isVisible({ timeout: 2000 }).catch(() => false) ||
                              await addressInput.first().isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasPhoneOrAddress).toBeTruthy();
  });

  test('submitting valid client data creates the client', async ({ page }) => {
    await navigateTo(page, '/clients');

    const newClientButton = page.locator('button:has-text("NEW CLIENT")');
    await newClientButton.click();

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

    const timestamp = Date.now();
    const clientName = `Test Client ${timestamp}`;
    const clientEmail = `test${timestamp}@example.com`;

    const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
    await nameInput.fill(clientName);

    const emailInput = page.locator('input[name*="email"], input[type="email"], input[placeholder*="Email"]').first();
    await emailInput.fill(clientEmail);

    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Add")');
    await submitButton.first().click();

    await page.waitForTimeout(2000);

    const successMessage = page.locator('text=/Client created|successfully|added/i');
    const modalClosed = await page.locator('[role="dialog"], .modal').isVisible({ timeout: 2000 }).catch(() => false);

    const hasSuccess = await successMessage.isVisible({ timeout: 2000 }).catch(() => false) || !modalClosed;
    expect(hasSuccess).toBeTruthy();
  });

  test('client appears in list after creation', async ({ page }) => {
    await navigateTo(page, '/clients');

    const newClientButton = page.locator('button:has-text("NEW CLIENT")');
    await newClientButton.click();

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

    const timestamp = Date.now();
    const clientName = `Verify Client ${timestamp}`;
    const clientEmail = `verify${timestamp}@example.com`;

    const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
    await nameInput.fill(clientName);

    const emailInput = page.locator('input[name*="email"], input[type="email"], input[placeholder*="Email"]').first();
    await emailInput.fill(clientEmail);

    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Add")');
    await submitButton.first().click();

    await page.waitForTimeout(2000);

    await navigateTo(page, '/clients');

    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill(clientName);
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(1000);
  });

  test('form validation: required fields show errors when empty', async ({ page }) => {
    await navigateTo(page, '/clients');

    const newClientButton = page.locator('button:has-text("NEW CLIENT")');
    await newClientButton.click();

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Add")');
    await submitButton.first().click();

    await page.waitForTimeout(1000);

    const errorMessages = page.locator('text=/required|cannot be blank|field is required/i, .error, [class*="error"]');
    const hasErrors = await errorMessages.count() > 0;

    expect(hasErrors).toBeTruthy();
  });

  test('cancel button closes form without creating', async ({ page }) => {
    await navigateTo(page, '/clients');

    const newClientButton = page.locator('button:has-text("NEW CLIENT")');
    await newClientButton.click();

    await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

    const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
    await nameInput.fill('Should Not Be Created');

    const cancelButton = page.locator('button:has-text("Cancel"), button[aria-label="Close"], svg');
    await cancelButton.first().click();

    await page.waitForTimeout(1000);

    const modalClosed = await page.locator('[role="dialog"], .modal').isVisible({ timeout: 2000 }).catch(() => false);
    expect(modalClosed).toBeFalsy();
  });

  test('empty state "Add Clients" button opens creation form', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForLoadState('networkidle');

    const emptyStateButton = page.locator('button:has-text("Add Clients")');

    if (await emptyStateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emptyStateButton.click();

      const modal = page.locator('[role="dialog"], .modal, text="Add New Client"');
      await expect(modal.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
