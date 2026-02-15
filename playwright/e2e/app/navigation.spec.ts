import { test, expect, type Page } from '@playwright/test';
import { login, navigateTo, TEST_USER } from '../helpers/auth';

test.describe('Navigation', () => {
  const visibleNavLink = (page: Page, text: string) => page.locator(`a:has-text("${text}"):visible`).first();

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('sidebar shows all main navigation links after login', async ({ page }) => {
    await expect(visibleNavLink(page, 'Dashboard')).toBeVisible({ timeout: 10000 });

    const navLinks = [
      { text: 'Dashboard', href: '/' },
      { text: 'Time Tracking', href: '/time-tracking' },
      { text: 'Clients', href: '/clients' },
      { text: 'Projects', href: '/projects' },
      { text: 'Invoices', href: '/invoices' },
      { text: 'Reports', href: '/reports' },
      { text: 'Payments', href: '/payments' },
      { text: 'Team', href: '/team' },
    ];

    for (const link of navLinks) {
      const linkElement = visibleNavLink(page, link.text);
      await expect(linkElement).toBeVisible({ timeout: 5000 });
    }
  });

  test('clicking Dashboard link navigates to dashboard', async ({ page }) => {
    await visibleNavLink(page, 'Dashboard').click();
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('clicking Time Tracking link navigates to time tracking page', async ({ page }) => {
    await visibleNavLink(page, 'Time Tracking').click();
    await page.waitForURL('**/time-tracking');
    expect(page.url()).toContain('/time-tracking');
  });

  test('clicking Clients link navigates to clients page', async ({ page }) => {
    await visibleNavLink(page, 'Clients').click();
    await page.waitForURL('**/clients');
    expect(page.url()).toContain('/clients');
  });

  test('clicking Projects link navigates to projects page', async ({ page }) => {
    await visibleNavLink(page, 'Projects').click();
    await page.waitForURL('**/projects');
    expect(page.url()).toContain('/projects');
  });

  test('clicking Invoices link navigates to invoices page', async ({ page }) => {
    await visibleNavLink(page, 'Invoices').click();
    await page.waitForURL('**/invoices');
    expect(page.url()).toContain('/invoices');
  });

  test('clicking Reports link navigates to reports page', async ({ page }) => {
    await visibleNavLink(page, 'Reports').click();
    await page.waitForURL('**/reports');
    expect(page.url()).toContain('/reports');
  });

  test('clicking Payments link navigates to payments page', async ({ page }) => {
    await visibleNavLink(page, 'Payments').click();
    await page.waitForURL('**/payments');
    expect(page.url()).toContain('/payments');
  });

  test('clicking Team link navigates to team page', async ({ page }) => {
    await visibleNavLink(page, 'Team').click();
    await page.waitForURL('**/team');
    expect(page.url()).toContain('/team');
  });

  test('active navigation link is visually highlighted', async ({ page }) => {
    await navigateTo(page, '/time-tracking');
    await page.waitForLoadState('domcontentloaded');

    const activeLink = visibleNavLink(page, 'Time Tracking');
    const classList = await activeLink.getAttribute('class');

    expect(classList).toBeTruthy();
    expect(classList).toMatch(/active|selected|current|bg-|text-primary|font-bold/i);
  });

  test('company/workspace name is visible in sidebar', async ({ page }) => {
    await expect(visibleNavLink(page, 'Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('aside:visible').locator('text=/miru agency os/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('logged in user name is visible in header', async ({ page }) => {
    await expect(visibleNavLink(page, 'Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /welcome back, vipul/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('settings link in navigation is accessible', async ({ page }) => {
    await expect(visibleNavLink(page, 'Dashboard')).toBeVisible({ timeout: 10000 });
    const settingsLink = page.locator('a:has-text("Settings"):visible, a[href*="settings"]:visible').first();
    await expect(settingsLink).toBeVisible({ timeout: 5000 });

    await settingsLink.click();
    await page.waitForURL('**/settings/**');
    expect(page.url()).toContain('/settings');
  });

  test('navigation persists across page refreshes', async ({ page }) => {
    await navigateTo(page, '/clients');
    await page.waitForLoadState('domcontentloaded');

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await expect(visibleNavLink(page, 'Clients')).toBeVisible({ timeout: 5000 });
  });
});
