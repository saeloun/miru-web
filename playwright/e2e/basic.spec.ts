import { test, expect } from '@playwright/test';

test.describe.parallel('Basic Tests', () => {
  test('server responds', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('page has content', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('can access login', async ({ page }) => {
    const response = await page.goto('/users/sign_in');
    expect(response?.status()).toBeLessThan(400);
  });
});