import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/auth';

test.describe('Sign In', () => {
  test('valid credentials redirect to dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/(time-tracking|dashboard)/);
  });

  test('invalid email shows error', async ({ page }) => {
    await page.goto('/user/sign_in');

    await page.getByRole('textbox', { name: /email/i }).fill('invalid@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_USER.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page.getByText(/invalid email or password/i).first()).toBeVisible();
  });

  test('invalid password shows error', async ({ page }) => {
    await page.goto('/user/sign_in');

    await page.getByRole('textbox', { name: /email/i }).fill(TEST_USER.email);
    await page.getByRole('textbox', { name: /password/i }).fill('wrongpassword');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page.getByText(/invalid email or password/i).first()).toBeVisible();
  });

  test('sign in form fields are visible', async ({ page }) => {
    await page.goto('/user/sign_in');

    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
  });

  test('forgot password and sign up links are visible', async ({ page }) => {
    await page.goto('/user/sign_in');
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });
});
