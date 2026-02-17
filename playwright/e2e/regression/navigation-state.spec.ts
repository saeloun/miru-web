import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Navigation State Management', () => {
  test('navigating between pages preserves user session', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/');
    await expect(page).toHaveURL(/.*\//);

    await navigateTo(page, '/time-tracking');
    await expect(page).toHaveURL(/.*time-tracking/);

    await navigateTo(page, '/clients');
    await expect(page).toHaveURL(/.*clients/);

    await navigateTo(page, '/invoices');
    await expect(page).toHaveURL(/.*invoices/);

    await page.locator('body').evaluate(() => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) throw new Error('Session lost during navigation');
    });
  });

  test('browser back button works correctly', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/');
    await page.waitForTimeout(1000);

    await navigateTo(page, '/time-tracking');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*time-tracking/);

    await page.goBack();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*\//);

    await page.goForward();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*time-tracking/);
  });

  test('deep linking to specific pages works when logged in', async ({ page }) => {
    await login(page);

    await navigateTo(page, '/clients');
    await expect(page).toHaveURL(/.*clients/);
    await page.waitForTimeout(1000);

    await navigateTo(page, '/projects');
    await expect(page).toHaveURL(/.*projects/);
    await page.waitForTimeout(1000);

    await navigateTo(page, '/reports');
    await expect(page).toHaveURL(/.*reports/);
    await page.waitForTimeout(1000);
  });

  test('page refresh maintains current state', async ({ page }) => {
    await login(page);
    await navigateTo(page, '/time-tracking');
    await expect(page).toHaveURL(/.*time-tracking/);

    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/.*time-tracking/);

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);
    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('404')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('multiple tabs work independently', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await login(page1);
    await navigateTo(page1, '/');
    await expect(page1).toHaveURL(/.*\//);

    await login(page2);
    await navigateTo(page2, '/time-tracking');
    await expect(page2).toHaveURL(/.*time-tracking/);

    await expect(page1).toHaveURL(/.*\//);
    await expect(page2).toHaveURL(/.*time-tracking/);

    await page1.close();
    await page2.close();
    await context.close();
  });
});
