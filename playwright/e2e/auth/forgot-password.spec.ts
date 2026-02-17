import { test, expect } from '@playwright/test';
import { TEST_USER } from '../helpers/auth';

test.describe('Forgot Password', () => {
  test('forgot password link exists on sign in page', async ({ page }) => {
    await page.goto('/user/sign_in');
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('can navigate to forgot password page', async ({ page }) => {
    await page.goto('/user/sign_in');
    await page.getByRole('link', { name: /forgot password/i }).click();

    await page.waitForURL('**/users/password/new');
    expect(page.url()).toContain('/users/password/new');
  });

  test('forgot password page shows form with email field', async ({ page }) => {
    await page.goto('/users/password/new');

    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
  });

  test('forgot password page has submit button', async ({ page }) => {
    await page.goto('/users/password/new');

    const submitButton = page.getByRole('button', { name: /reset|send|instructions/i }).first();
    await expect(submitButton).toBeVisible();
  });

  test('submitting with valid email shows success message', async ({ page }) => {
    await page.goto('/users/password/new');

    await page.getByRole('textbox', { name: /email/i }).fill(TEST_USER.email);
    await page.getByRole('button', { name: /reset|send|instructions/i }).first().click();

    await expect(page.locator('text=/password reset instructions/i, text=/email.*sent/i')).toBeVisible({ timeout: 10000 });
  });

  test('submitting with empty email shows validation', async ({ page }) => {
    await page.goto('/users/password/new');

    await page.getByRole('button', { name: /reset|send|instructions/i }).first().click();
    await expect(page.locator('text=/email/i')).toBeVisible();
  });

  test('forgot password page has back to sign in link', async ({ page }) => {
    await page.goto('/users/password/new');

    await expect(page.locator('a:has-text("Sign in"), a:has-text("Log in"), a:has-text("Back")').first()).toBeVisible();
  });

  test('back to sign in link navigates to sign in page', async ({ page }) => {
    await page.goto('/users/password/new');

    const signInLink = page.locator('a:has-text("Sign in"), a:has-text("Log in"), a[href*="sign_in"]').first();
    await signInLink.click();

    await page.waitForURL('**/user/sign_in');
    expect(page.url()).toContain('/user/sign_in');
  });
});
