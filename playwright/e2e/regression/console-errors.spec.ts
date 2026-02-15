import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Console Error Checks', () => {
  test('dashboard page loads without JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/');
    await page.waitForTimeout(2000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.toLowerCase().includes('favicon.ico')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('time tracking page loads without JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/time-tracking');
    await page.waitForTimeout(2000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.toLowerCase().includes('favicon.ico')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('clients page loads without JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/clients');
    await page.waitForTimeout(2000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.toLowerCase().includes('favicon.ico')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('projects page loads without JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/projects');
    await page.waitForTimeout(2000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.toLowerCase().includes('favicon.ico')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('invoices page loads without JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/invoices');
    await page.waitForTimeout(2000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.toLowerCase().includes('favicon.ico')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('reports page loads without JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/reports');
    await page.waitForTimeout(2000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.toLowerCase().includes('favicon.ico')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('settings page loads without JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/settings');
    await page.waitForTimeout(2000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.toLowerCase().includes('favicon.ico')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('team page loads without JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page);
    await navigateTo(page, '/team');
    await page.waitForTimeout(2000);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.toLowerCase().includes('favicon.ico')
    );
    expect(realErrors).toHaveLength(0);
  });
});
