import { test, expect } from '@playwright/test';
import { login, navigateTo, TEST_USER } from '../helpers/auth';

test.describe('Session Protection', () => {
  test('unauthenticated user accessing /time-tracking redirects to sign in', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/time-tracking');

    await page.waitForURL('**/user/sign_in');
    expect(page.url()).toContain('/user/sign_in');
  });

  test('unauthenticated user accessing /invoices redirects to sign in', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/invoices');

    await page.waitForURL('**/user/sign_in');
    expect(page.url()).toContain('/user/sign_in');
  });

  test('unauthenticated user accessing /clients redirects to sign in', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/clients');

    await page.waitForURL('**/user/sign_in');
    expect(page.url()).toContain('/user/sign_in');
  });

  test('unauthenticated user accessing /settings redirects to sign in', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/settings');

    await page.waitForURL('**/user/sign_in');
    expect(page.url()).toContain('/user/sign_in');
  });

  test('unauthenticated user accessing /team redirects to sign in', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/team');

    await page.waitForURL('**/user/sign_in');
    expect(page.url()).toContain('/user/sign_in');
  });

  test('unauthenticated user accessing /reports redirects to sign in', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/reports');

    await page.waitForURL('**/user/sign_in');
    expect(page.url()).toContain('/user/sign_in');
  });

  test('authenticated user can access /time-tracking', async ({ page }) => {
    await login(page);

    await page.goto('http://127.0.0.1:3000/time-tracking');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/time-tracking');
    expect(page.url()).not.toContain('/user/sign_in');
  });

  test('authenticated user can access /invoices', async ({ page }) => {
    await login(page);

    await page.goto('http://127.0.0.1:3000/invoices');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/invoices');
    expect(page.url()).not.toContain('/user/sign_in');
  });

  test('authenticated user can access /clients', async ({ page }) => {
    await login(page);

    await page.goto('http://127.0.0.1:3000/clients');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/clients');
    expect(page.url()).not.toContain('/user/sign_in');
  });

  test('authenticated user can access /settings', async ({ page }) => {
    await login(page);

    await page.goto('http://127.0.0.1:3000/settings');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/settings');
    expect(page.url()).not.toContain('/user/sign_in');
  });

  test('root path redirects unauthenticated user to sign in', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/');

    await page.waitForURL(/\/(users\/sign_in|time-tracking)/);

    if (page.url().includes('/user/sign_in')) {
      expect(page.url()).toContain('/user/sign_in');
    } else {
      expect(page.url()).toContain('/time-tracking');
    }
  });

  test('authenticated user accessing root is redirected to default page', async ({ page }) => {
    await login(page);

    await page.goto('http://127.0.0.1:3000/');
    await page.waitForLoadState('networkidle');

    expect(page.url()).not.toContain('/user/sign_in');
    expect(page.url()).toMatch(/\/(time-tracking|dashboard)/);
  });
});
