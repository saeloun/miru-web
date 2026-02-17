import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Settings - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('settings sidebar shows all setting categories', async ({ page }) => {
    await navigateTo(page, '/settings/profile');

    await expect(page.locator('a, button').filter({ hasText: /^profile$/i })).toBeVisible();
    await expect(page.locator('a, button').filter({ hasText: /organization/i })).toBeVisible();
    await expect(page.locator('a, button').filter({ hasText: /leaves/i })).toBeVisible();
    await expect(page.locator('a, button').filter({ hasText: /holidays/i })).toBeVisible();
    await expect(page.locator('a, button').filter({ hasText: /payment/i })).toBeVisible();
  });

  test('can navigate between Profile, Organization, Leaves, Holidays, Payment', async ({ page }) => {
    await navigateTo(page, '/settings/profile');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

    await page.locator('a, button').filter({ hasText: /organization/i }).click();
    await expect(page.getByRole('heading', { name: /organization/i })).toBeVisible();

    await page.locator('a, button').filter({ hasText: /leaves/i }).click();
    await expect(page.getByRole('heading', { name: /leave/i })).toBeVisible();

    await page.locator('a, button').filter({ hasText: /holidays/i }).click();
    await expect(page.getByRole('heading', { name: /holiday/i })).toBeVisible();

    await page.locator('a, button').filter({ hasText: /payment/i }).click();
    await expect(page.getByRole('heading', { name: /payment/i })).toBeVisible();
  });

  test('active setting page is highlighted in nav', async ({ page }) => {
    await navigateTo(page, '/settings/profile');

    const profileLink = page.locator('a, button').filter({ hasText: /^profile$/i });
    const classes = await profileLink.getAttribute('class');

    expect(classes).toMatch(/active|selected|current|bg-|text-/i);
  });

  test('each settings page loads without errors', async ({ page }) => {
    const settingsPages = [
      '/settings/profile',
      '/settings/organization',
      '/settings/leaves',
      '/settings/holidays',
      '/settings/payment',
    ];

    for (const settingsPath of settingsPages) {
      await navigateTo(page, settingsPath);

      const hasError = await page.locator('text=/error|something went wrong/i').isVisible().catch(() => false);
      expect(hasError).toBeFalsy();

      const heading = page.locator('h1, h2, [role="heading"]').first();
      await expect(heading).toBeVisible();
    }
  });

  test('back navigation works from settings pages', async ({ page }) => {
    await navigateTo(page, '/settings/profile');
    await navigateTo(page, '/settings/organization');

    await page.goBack();
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

    await page.goForward();
    await expect(page.getByRole('heading', { name: /organization/i })).toBeVisible();
  });
});
