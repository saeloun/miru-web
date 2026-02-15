import { test, expect, type Page } from '@playwright/test';
import { login } from '../helpers/auth';

const protectedPaths = [
  '/dashboard',
  '/time-tracking',
  '/clients',
  '/projects',
  '/invoices',
  '/reports',
  '/payments',
  '/team',
  '/settings/profile',
];

const assertAppShellLoaded = async (page: Page) => {
  await expect(page.locator('a:has-text("Dashboard"):visible').first()).toBeVisible({ timeout: 10000 });
  const bodyText = await page.locator('body').textContent();
  expect((bodyText || '').length).toBeGreaterThan(0);
};

test.describe('SPA Deep Links', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const path of protectedPaths) {
    test(`deep link ${path} loads and survives refresh`, async ({ page }) => {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/user\/sign_in/, { timeout: 15000 });
      await assertAppShellLoaded(page);

      await page.reload();
      await expect(page).not.toHaveURL(/\/user\/sign_in/, { timeout: 15000 });
      await assertAppShellLoaded(page);
    });
  }

  test('non-api unknown path still serves SPA shell', async ({ page }) => {
    await page.goto('/capital');
    await expect(page).not.toHaveURL(/\/user\/sign_in/, { timeout: 15000 });
    await assertAppShellLoaded(page);

    await page.reload();
    await expect(page).not.toHaveURL(/\/user\/sign_in/, { timeout: 15000 });
    await assertAppShellLoaded(page);
  });
});
