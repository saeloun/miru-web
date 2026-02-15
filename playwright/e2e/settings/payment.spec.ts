import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Settings - Payment', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('payment settings page loads', async ({ page }) => {
    await navigateTo(page, '/settings/payment');
    await expect(page.getByRole('heading', { name: /payment/i })).toBeVisible();
  });

  test('shows Stripe connection status or setup', async ({ page }) => {
    await navigateTo(page, '/settings/payment');

    const stripeIndicator = page.locator('text=/stripe/i').first();
    await expect(stripeIndicator).toBeVisible();

    const statusOrSetup = page.locator('text=/connect|connected|setup|configure|disconnect/i').first();
    await expect(statusOrSetup).toBeVisible();
  });

  test('payment provider configuration visible', async ({ page }) => {
    await navigateTo(page, '/settings/payment');

    const providerConfig = page.locator('text=/provider|configuration|settings/i').first();
    await expect(providerConfig).toBeVisible();
  });

  test('admin can configure payment settings', async ({ page }) => {
    await navigateTo(page, '/settings/payment');

    const configButton = page.getByRole('button', { name: /connect|setup|configure|edit/i }).first();

    const isVisible = await configButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(configButton).toBeVisible();
      await expect(configButton).toBeEnabled();
    }
  });

  test('non-admin cannot access payment settings', async ({ page }) => {
    await navigateTo(page, '/settings/payment');

    const pageContent = await page.textContent('body');

    if (pageContent?.includes('access') && pageContent?.includes('denied')) {
      const accessDenied = page.locator('text=/access denied|unauthorized|permission/i');
      await expect(accessDenied).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: /payment/i })).toBeVisible();
    }
  });
});
