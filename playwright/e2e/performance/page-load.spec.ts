import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Page Load Performance', () => {
  test('login page loads in under 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://127.0.0.1:3000/user/sign_in');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test('dashboard loads in under 10 seconds', async ({ page }) => {
    await login(page);

    const startTime = Date.now();
    await navigateTo(page, '/');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test('time tracking page loads in under 10 seconds', async ({ page }) => {
    await login(page);

    const startTime = Date.now();
    await navigateTo(page, '/time-tracking');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test('invoices page loads in under 10 seconds', async ({ page }) => {
    await login(page);

    const startTime = Date.now();
    await navigateTo(page, '/invoices');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test('no memory leaks from console on dashboard', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/');
    await page.waitForTimeout(3000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('404')
    );
    expect(realErrors.length).toBeLessThan(5);

    const memoryWarnings = warnings.filter(w =>
      w.toLowerCase().includes('memory') ||
      w.toLowerCase().includes('leak')
    );
    expect(memoryWarnings).toHaveLength(0);
  });

  test('no memory leaks from console on time tracking', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/time-tracking');
    await page.waitForTimeout(3000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('404')
    );
    expect(realErrors.length).toBeLessThan(5);

    const memoryWarnings = warnings.filter(w =>
      w.toLowerCase().includes('memory') ||
      w.toLowerCase().includes('leak')
    );
    expect(memoryWarnings).toHaveLength(0);
  });

  test('no memory leaks from console on clients', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/clients');
    await page.waitForTimeout(3000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('404')
    );
    expect(realErrors.length).toBeLessThan(5);

    const memoryWarnings = warnings.filter(w =>
      w.toLowerCase().includes('memory') ||
      w.toLowerCase().includes('leak')
    );
    expect(memoryWarnings).toHaveLength(0);
  });
});
