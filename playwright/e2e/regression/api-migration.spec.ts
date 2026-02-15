import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('API Migration Validation', () => {
  test('no requests to internal_api paths on dashboard', async ({ page }) => {
    const internalApiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('internal_api')) {
        internalApiRequests.push(request.url());
      }
    });

    await login(page);
    await navigateTo(page, '/');
    await page.waitForTimeout(3000);

    expect(internalApiRequests).toHaveLength(0);
  });

  test('no requests to internal_api paths on time tracking', async ({ page }) => {
    const internalApiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('internal_api')) {
        internalApiRequests.push(request.url());
      }
    });

    await login(page);
    await navigateTo(page, '/time-tracking');
    await page.waitForTimeout(3000);

    expect(internalApiRequests).toHaveLength(0);
  });

  test('no requests to internal_api paths on invoices', async ({ page }) => {
    const internalApiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('internal_api')) {
        internalApiRequests.push(request.url());
      }
    });

    await login(page);
    await navigateTo(page, '/invoices');
    await page.waitForTimeout(3000);

    expect(internalApiRequests).toHaveLength(0);
  });

  test('no requests to internal_api paths on clients', async ({ page }) => {
    const internalApiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('internal_api')) {
        internalApiRequests.push(request.url());
      }
    });

    await login(page);
    await navigateTo(page, '/clients');
    await page.waitForTimeout(3000);

    expect(internalApiRequests).toHaveLength(0);
  });

  test('dashboard API calls use /api/v1/ prefix', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/v1/') || url.includes('/internal_api/')) {
        apiRequests.push(url);
      }
    });

    await login(page);
    await navigateTo(page, '/');
    await page.waitForTimeout(3000);

    const apiV1Requests = apiRequests.filter(url => url.includes('/api/v1/'));
    expect(apiV1Requests.length).toBeGreaterThan(0);
  });

  test('time tracking API calls use /api/v1/ prefix', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/v1/') || url.includes('/internal_api/')) {
        apiRequests.push(url);
      }
    });

    await login(page);
    await navigateTo(page, '/time-tracking');
    await page.waitForTimeout(3000);

    const apiV1Requests = apiRequests.filter(url => url.includes('/api/v1/'));
    expect(apiV1Requests.length).toBeGreaterThan(0);
  });

  test('invoice API calls use /api/v1/ prefix', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/v1/') || url.includes('/internal_api/')) {
        apiRequests.push(url);
      }
    });

    await login(page);
    await navigateTo(page, '/invoices');
    await page.waitForTimeout(3000);

    const apiV1Requests = apiRequests.filter(url => url.includes('/api/v1/'));
    expect(apiV1Requests.length).toBeGreaterThan(0);
  });

  test('client API calls use /api/v1/ prefix', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/v1/') || url.includes('/internal_api/')) {
        apiRequests.push(url);
      }
    });

    await login(page);
    await navigateTo(page, '/clients');
    await page.waitForTimeout(3000);

    const apiV1Requests = apiRequests.filter(url => url.includes('/api/v1/'));
    expect(apiV1Requests.length).toBeGreaterThan(0);
  });

  test('all API responses return 2xx or expected status codes', async ({ page }) => {
    const failedRequests: Array<{ url: string; status: number }> = [];
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      if ((url.includes('/api/v1/') || url.includes('/internal_api/')) && status >= 400) {
        failedRequests.push({ url, status });
      }
    });

    await login(page);
    await navigateTo(page, '/');
    await page.waitForTimeout(2000);
    await navigateTo(page, '/time-tracking');
    await page.waitForTimeout(2000);
    await navigateTo(page, '/invoices');
    await page.waitForTimeout(2000);
    await navigateTo(page, '/clients');
    await page.waitForTimeout(2000);

    expect(failedRequests).toHaveLength(0);
  });
});
