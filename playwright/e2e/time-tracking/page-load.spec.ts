import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Time Tracking - Page Loading and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/time-tracking');
  });

  test('time tracking page loads with heading', async ({ page }) => {
    await expect(page.locator('h1, h2, [role="heading"]').filter({ hasText: /time tracking/i })).toBeVisible();
  });

  test('shows weekly calendar/day selector', async ({ page }) => {
    const dayButtons = page.locator('button[aria-label*="Select Mon"], button[aria-label*="Select Tue"], button[aria-label*="Select Wed"]');
    await expect(dayButtons.first()).toBeVisible();
  });

  test('shows current week dates', async ({ page }) => {
    const weekHeader = page.locator('h2, h3, [data-testid="week-header"]');
    await expect(weekHeader.first()).toBeVisible();

    const headerText = await weekHeader.first().textContent();
    expect(headerText).toMatch(/\w+\s+\d{1,2}/);
  });

  test('navigation arrows to previous/next week exist', async ({ page }) => {
    await expect(page.locator('button[aria-label*="Previous week"], button[aria-label*="previous"]').first()).toBeVisible();
    await expect(page.locator('button[aria-label*="Next week"], button[aria-label*="next"]').first()).toBeVisible();
  });

  test('"Add Entry" button is visible', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: /add entry/i })).toBeVisible();
  });

  test('total hours for the week are displayed', async ({ page }) => {
    await expect(page.locator('text=/total/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\d{1,2}:\\d{2}/')).toBeVisible();
  });

  test('current day is highlighted/selected by default', async ({ page }) => {
    const today = new Date();
    const todayDate = today.getDate();

    const todayButton = page.locator(`button[aria-label*="${todayDate}"][aria-label*="Today"], button[aria-label*="Today"][aria-pressed="true"]`);
    await expect(todayButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('week view displays all days of the week', async ({ page }) => {
    await expect(page.locator('button[aria-label*="Mon"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Tue"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Wed"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Thu"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Fri"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Sat"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Sun"]')).toBeVisible();
  });

  test('today button is visible', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: /^today$/i })).toBeVisible();
  });

  test('week/month view toggle is visible', async ({ page }) => {
    const weekButton = page.locator('button').filter({ hasText: /^week$/i });
    const monthButton = page.locator('button').filter({ hasText: /^month$/i });

    const hasWeekButton = await weekButton.isVisible().catch(() => false);
    const hasMonthButton = await monthButton.isVisible().catch(() => false);

    expect(hasWeekButton || hasMonthButton).toBe(true);
  });
});
