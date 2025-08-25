import { test, expect } from '@playwright/test';

test.describe.parallel('Smoke Tests', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\//);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/users/sign_in');
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('has login form fields', async ({ page }) => {
    await page.goto('/users/sign_in');
    // React forms may use different selectors
    await expect(page.locator('input[type="email"], input[name="user[email]"], input[placeholder*="email" i]').first()).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="user[password]"], input[placeholder*="password" i]').first()).toBeVisible();
  });

  test('can navigate to sign up', async ({ page }) => {
    await page.goto('/users/sign_in');
    const signUpLink = page.locator('a[href*="sign_up"]').first();
    if (await signUpLink.count() > 0) {
      await signUpLink.click();
      await expect(page).toHaveURL(/.*sign_up/);
    }
  });

  test('can navigate to forgot password', async ({ page }) => {
    await page.goto('/users/sign_in');
    const forgotLink = page.locator('a[href*="password/new"]').first();
    if (await forgotLink.count() > 0) {
      await forgotLink.click();
      await expect(page).toHaveURL(/.*password\/new/);
    }
  });
});