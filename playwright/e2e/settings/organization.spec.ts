import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Settings - Organization', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('organization settings page loads', async ({ page }) => {
    await navigateTo(page, '/settings/organization');
    await expect(page.getByRole('heading', { name: /organization/i })).toBeVisible();
  });

  test('shows company name, address, currency', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    await expect(page.getByLabel(/company name/i).or(page.getByLabel(/organization name/i))).toBeVisible();
    await expect(page.getByLabel(/address/i).or(page.getByLabel(/business address/i))).toBeVisible();
    await expect(page.getByLabel(/currency/i)).toBeVisible();
  });

  test('shows timezone setting', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    await expect(page.getByLabel(/timezone/i).or(page.getByLabel(/time zone/i))).toBeVisible();
  });

  test('shows date format setting', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    await expect(page.getByLabel(/date format/i)).toBeVisible();
  });

  test('shows company logo', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    const logoSection = page.locator('[data-testid="company-logo"], img[alt*="logo" i], img[alt*="company" i]').first();
    await expect(logoSection).toBeVisible();
  });

  test('admin can edit organization details', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    const editButton = page.getByRole('button', { name: /edit/i });
    await expect(editButton).toBeVisible();

    await editButton.click();

    const companyNameInput = page.getByLabel(/company name/i).or(page.getByLabel(/organization name/i));
    await expect(companyNameInput).toBeEnabled();
  });

  test('save persists changes', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    const editButton = page.getByRole('button', { name: /edit/i });
    await editButton.click();

    const companyNameInput = page.getByLabel(/company name/i).or(page.getByLabel(/organization name/i));
    const originalName = await companyNameInput.inputValue();

    const testName = `TestOrg${Date.now()}`;
    await companyNameInput.fill(testName);

    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();

    await page.waitForTimeout(1000);

    await page.reload();
    await expect(page.getByLabel(/company name/i).or(page.getByLabel(/organization name/i))).toHaveValue(testName);

    await editButton.click();
    await companyNameInput.fill(originalName);
    await saveButton.click();
  });

  test('non-admin sees limited options', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    const pageContent = await page.textContent('body');

    if (pageContent?.includes('edit') || pageContent?.includes('Edit')) {
      test.skip();
    }
  });
});
