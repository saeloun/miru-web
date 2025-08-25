import { test, expect } from '@playwright/test';

test.describe.parallel('Smoke Tests', () => {
  test('home page responds', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('login page responds', async ({ page }) => {
    const response = await page.goto('/users/sign_in');
    expect(response?.status()).toBeLessThan(500);
  });

  test('page has HTML content', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('login page has content', async ({ page }) => {
    await page.goto('/users/sign_in');
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });
});