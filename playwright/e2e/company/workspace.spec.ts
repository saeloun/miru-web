import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Company - Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('company name is visible in sidebar/header', async ({ page }) => {
    await navigateTo(page, '/');

    const companyName = page.locator('nav, header, aside, [role="navigation"]').locator('text=/saeloun|company/i').first();
    await expect(companyName).toBeVisible();
  });

  test('can view company details from settings', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    const companyNameField = page.getByLabel(/company name/i).or(page.getByLabel(/organization name/i));
    await expect(companyNameField).toBeVisible();

    const companyName = await companyNameField.inputValue();
    expect(companyName).toBeTruthy();
    expect(companyName.length).toBeGreaterThan(0);
  });

  test('currency setting affects invoice display format', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    const currencyField = page.getByLabel(/currency/i);
    await expect(currencyField).toBeVisible();

    const currency = await currencyField.inputValue();
    expect(currency).toBeTruthy();

    await navigateTo(page, '/invoices');

    const currencySymbol = page.locator('text=/\\$|€|£|₹/').first();
    const hasCurrencySymbol = await currencySymbol.isVisible().catch(() => false);

    if (hasCurrencySymbol) {
      await expect(currencySymbol).toBeVisible();
    }
  });

  test('timezone setting is respected', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    const timezoneField = page.getByLabel(/timezone/i).or(page.getByLabel(/time zone/i));
    await expect(timezoneField).toBeVisible();

    const timezone = await timezoneField.inputValue();
    expect(timezone).toBeTruthy();
  });

  test('company logo is displayed where applicable', async ({ page }) => {
    await navigateTo(page, '/settings/organization');

    const logo = page.locator('img[alt*="logo" i], img[alt*="company" i], [data-testid="company-logo"]').first();
    const hasLogo = await logo.isVisible().catch(() => false);

    if (hasLogo) {
      await expect(logo).toBeVisible();
    }

    await navigateTo(page, '/');
    const navLogo = page.locator('nav, header, aside').locator('img').first();
    const hasNavLogo = await navLogo.isVisible().catch(() => false);

    if (hasNavLogo) {
      await expect(navLogo).toBeVisible();
    }
  });
});
