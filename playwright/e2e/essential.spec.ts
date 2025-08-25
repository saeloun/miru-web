import { test, expect } from '@playwright/test';

test.describe('Essential User Journeys', () => {
  test('login flow', async ({ page }) => {
    const response = await page.goto('/users/sign_in');
    expect(response?.status()).toBeLessThan(500);
    
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('dashboard loads', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('time tracking page accessible', async ({ page }) => {
    const response = await page.goto('/time-tracking');
    expect(response?.status()).toBeLessThan(500);
  });

  test('invoices page accessible', async ({ page }) => {
    const response = await page.goto('/invoices');
    expect(response?.status()).toBeLessThan(500);
  });

  test('clients page accessible', async ({ page }) => {
    const response = await page.goto('/clients');
    expect(response?.status()).toBeLessThan(500);
  });

  test('reports page accessible', async ({ page }) => {
    const response = await page.goto('/reports');
    expect(response?.status()).toBeLessThan(500);
  });

  test('profile page accessible', async ({ page }) => {
    const response = await page.goto('/profile');
    expect(response?.status()).toBeLessThan(500);
  });

  test('team page accessible', async ({ page }) => {
    const response = await page.goto('/team');
    expect(response?.status()).toBeLessThan(500);
  });
});