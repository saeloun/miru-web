import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

const dashboardRoute = '**/api/v1/dashboard**';

test.describe('API Status Resilience', () => {
  test('401 on dashboard API does not crash app', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await login(page);
    await page.route(dashboardRoute, route => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) });
    });

    await navigateTo(page, '/dashboard');
    await page.waitForTimeout(1500);

    expect(pageErrors).toHaveLength(0);
    await expect(page.locator('body')).toContainText(/dashboard|sign in|unauthorized|error/i);
  });

  test('403 on dashboard API does not crash app', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await login(page);
    await page.route(dashboardRoute, route => {
      route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Forbidden' }) });
    });

    await navigateTo(page, '/dashboard');
    await page.waitForTimeout(1500);

    expect(pageErrors).toHaveLength(0);
    await expect(page.locator('body')).toContainText(/dashboard|forbidden|error/i);
  });

  test('404 on dashboard API does not crash app', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await login(page);
    await page.route(dashboardRoute, route => {
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not Found' }) });
    });

    await navigateTo(page, '/dashboard');
    await page.waitForTimeout(1500);

    expect(pageErrors).toHaveLength(0);
    await expect(page.locator('body')).toContainText(/dashboard|not found|error/i);
  });

  test('422 on dashboard API does not crash app', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await login(page);
    await page.route(dashboardRoute, route => {
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: 'Unprocessable Entity' }) });
    });

    await navigateTo(page, '/dashboard');
    await page.waitForTimeout(1500);

    expect(pageErrors).toHaveLength(0);
    await expect(page.locator('body')).toContainText(/dashboard|unprocessable|error/i);
  });

  test('500 on dashboard API does not crash app', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await login(page);
    await page.route(dashboardRoute, route => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) });
    });

    await navigateTo(page, '/dashboard');
    await page.waitForTimeout(1500);

    expect(pageErrors).toHaveLength(0);
    await expect(page.locator('body')).toContainText(/dashboard|internal server error|error/i);
  });
});
