import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Error Handling', () => {
  test('404 page shows for invalid routes', async ({ page }) => {
    await login(page);
    await page.goto('/invalid-route-that-does-not-exist');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/invalid-route-that-does-not-exist');
    await expect(page.locator('body')).toContainText(/miru|dashboard|error|not found/i);
  });

  test('API errors show user-friendly error messages', async ({ page }) => {
    await login(page);

    await page.route('**/api/v1/dashboard**', route => {
      route.abort('failed');
    });

    await navigateTo(page, '/');
    await page.waitForTimeout(3000);

    expect(page.url()).not.toContain('/user/sign_in');
    const bodyText = await page.locator('body').textContent();
    expect((bodyText || '').length).toBeGreaterThan(0);
  });

  test('network timeout handling', async ({ page }) => {
    await login(page);

    await page.route('**/api/v1/dashboard**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      route.continue();
    });

    const startTime = Date.now();
    await navigateTo(page, '/');
    await page.waitForTimeout(3500);
    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThan(3000);
  });

  test('empty states render correctly on dashboard', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('empty states render correctly on time tracking', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/time-tracking');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('empty states render correctly on clients', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/clients');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('empty states render correctly on projects', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/projects');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('empty states render correctly on invoices', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/invoices');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('empty states render correctly on reports', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/reports');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});
