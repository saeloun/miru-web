import { test, expect } from '@playwright/test';

test.describe('Simple Login Test', () => {
  test('can load login page', async ({ page }) => {
    await page.goto('/users/sign_in');
    await expect(page).toHaveTitle(/Miru/);
  });

  test('can login with valid credentials', async ({ page }) => {
    await page.goto('/users/sign_in');
    
    // Wait for the form to be ready - use flexible selectors
    const emailInput = page.locator('input[type="email"], input[name="user[email]"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="user[password]"], input[placeholder*="password" i]').first();
    
    await emailInput.waitFor({ state: 'visible' });
    
    // Fill in credentials
    await emailInput.fill('vipul@saeloun.com');
    await passwordInput.fill('password');
    
    // Submit form - find any submit button
    const submitButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"], input[type="submit"]').first();
    await submitButton.click();
    
    // Wait for navigation (not on sign_in page anymore)
    await page.waitForURL((url) => !url.pathname.includes('sign_in'), { timeout: 15000 });
    
    // Verify we're logged in
    expect(page.url()).not.toContain('sign_in');
  });
});