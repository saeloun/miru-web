import { test, expect } from '@playwright/test';

test.describe('Simple Login Test', () => {
  test('can load login page', async ({ page }) => {
    const response = await page.goto('/users/sign_in');
    expect(response?.status()).toBeLessThan(500);
    
    // Check page has content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('login page has title', async ({ page }) => {
    await page.goto('/users/sign_in');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});