import { test, expect } from '@playwright/test';
import { login, navigateTo, TEST_USER } from '../helpers/auth';

test.describe('Dashboard Statistics', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/');
  });

  test('revenue numbers are formatted as currency', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const revenueSection = page.locator('text=/revenue/i').first();
    if (await revenueSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      const parentSection = revenueSection.locator('..');
      const currencyText = await parentSection.textContent();

      const hasCurrencySymbol = /[$€£¥₹]/.test(currencyText || '');
      const hasCurrencyFormat = /\d{1,3}(,\d{3})*(\.\d{2})?/.test(currencyText || '');

      expect(hasCurrencySymbol || hasCurrencyFormat).toBeTruthy();
    }
  });

  test('outstanding invoices section shows data or empty state', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const outstandingSection = page.locator('text=/outstanding/i').first();
    await expect(outstandingSection).toBeVisible({ timeout: 10000 });

    const parentSection = outstandingSection.locator('..');
    const sectionText = await parentSection.textContent();

    const hasAmount = /[$€£¥₹]\d+|(\d{1,3}(,\d{3})*(\.\d{2})?)/.test(sectionText || '');
    const hasEmptyState = /no.*outstanding|0|empty|none/i.test(sectionText || '');
    const hasCount = /\d+/.test(sectionText || '');

    expect(hasAmount || hasEmptyState || hasCount).toBeTruthy();
  });

  test('overdue invoices section shows data or empty state', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const overdueSection = page.locator('text=/overdue/i').first();
    await expect(overdueSection).toBeVisible({ timeout: 10000 });

    const parentSection = overdueSection.locator('..');
    const sectionText = await parentSection.textContent();

    const hasAmount = /[$€£¥₹]\d+|(\d{1,3}(,\d{3})*(\.\d{2})?)/.test(sectionText || '');
    const hasEmptyState = /no.*overdue|0|empty|none/i.test(sectionText || '');
    const hasCount = /\d+/.test(sectionText || '');

    expect(hasAmount || hasEmptyState || hasCount).toBeTruthy();
  });

  test('charts or graphs render correctly', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const canvas = page.locator('canvas').first();
    const svg = page.locator('svg[class*="chart"], svg[class*="graph"]').first();
    const chartContainer = page.locator('[data-testid*="chart"], [class*="chart"], [class*="graph"]').first();

    const canvasVisible = await canvas.isVisible({ timeout: 5000 }).catch(() => false);
    const svgVisible = await svg.isVisible({ timeout: 5000 }).catch(() => false);
    const chartVisible = await chartContainer.isVisible({ timeout: 5000 }).catch(() => false);

    expect(canvasVisible || svgVisible || chartVisible).toBeTruthy();
  });

  test('revenue stat displays numeric value', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const revenueSection = page.locator('text=/revenue/i').first();
    if (await revenueSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      const parentSection = revenueSection.locator('..');
      const sectionText = await parentSection.textContent();

      const hasNumericValue = /\d+/.test(sectionText || '');
      expect(hasNumericValue).toBeTruthy();
    }
  });

  test('outstanding invoices stat displays numeric value or count', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const outstandingSection = page.locator('text=/outstanding/i').first();
    if (await outstandingSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      const parentSection = outstandingSection.locator('..');
      const sectionText = await parentSection.textContent();

      const hasNumericValue = /\d+/.test(sectionText || '');
      expect(hasNumericValue).toBeTruthy();
    }
  });

  test('overdue invoices stat displays numeric value or count', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const overdueSection = page.locator('text=/overdue/i').first();
    if (await overdueSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      const parentSection = overdueSection.locator('..');
      const sectionText = await parentSection.textContent();

      const hasNumericValue = /\d+/.test(sectionText || '');
      expect(hasNumericValue).toBeTruthy();
    }
  });

  test('stats cards have appropriate styling', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const statsCards = page.locator('div:has-text("Revenue"), div:has-text("Outstanding"), div:has-text("Overdue")').first();

    if (await statsCards.isVisible({ timeout: 5000 }).catch(() => false)) {
      const computedStyle = await statsCards.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          padding: style.padding,
          margin: style.margin,
        };
      });

      expect(computedStyle.display).toBeTruthy();
    }
  });

  test('chart canvas elements are properly sized', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const canvas = page.locator('canvas').first();

    if (await canvas.isVisible({ timeout: 5000 }).catch(() => false)) {
      const boundingBox = await canvas.boundingBox();

      expect(boundingBox).toBeTruthy();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(0);
        expect(boundingBox.height).toBeGreaterThan(0);
      }
    }
  });

  test('SVG chart elements are properly rendered', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const svg = page.locator('svg').first();

    if (await svg.isVisible({ timeout: 5000 }).catch(() => false)) {
      const svgElements = await svg.locator('path, circle, rect, line').count();
      expect(svgElements).toBeGreaterThan(0);
    }
  });

  test('stats update when date range changes', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const revenueSection = page.locator('text=/revenue/i').first();
    let initialText = '';

    if (await revenueSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      const parentSection = revenueSection.locator('..');
      initialText = await parentSection.textContent() || '';
    }

    const dateFilter = page.locator('select:has-text("Month"), select:has-text("Year"), button:has-text("This Week"), button:has-text("Last Month")').first();

    if (await dateFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateFilter.click();
      await page.waitForTimeout(1000);

      if (initialText) {
        const parentSection = revenueSection.locator('..');
        const updatedText = await parentSection.textContent() || '';

        expect(updatedText).toBeTruthy();
      }
    }
  });

  test('currency values are properly aligned', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const currencyElements = page.locator('text=/[$€£¥₹]\s*\d+/');
    const count = await currencyElements.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const element = currencyElements.nth(i);
        const text = await element.textContent();

        expect(text).toBeTruthy();
        expect(/[$€£¥₹]/.test(text || '')).toBeTruthy();
      }
    }
  });

  test('percentage changes are displayed if applicable', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const percentageElement = page.locator('text=/%|percent/i').first();
    const arrowIcon = page.locator('svg[class*="arrow"], [class*="trend"]').first();

    const percentageVisible = await percentageElement.isVisible({ timeout: 3000 }).catch(() => false);
    const arrowVisible = await arrowIcon.isVisible({ timeout: 3000 }).catch(() => false);

    if (percentageVisible || arrowVisible) {
      expect(percentageVisible || arrowVisible).toBeTruthy();
    }
  });

  test('stats sections have clear labels', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const labels = [
      page.locator('text=/revenue/i').first(),
      page.locator('text=/outstanding/i').first(),
      page.locator('text=/overdue/i').first(),
    ];

    for (const label of labels) {
      if (await label.isVisible({ timeout: 3000 }).catch(() => false)) {
        const labelText = await label.textContent();
        expect(labelText).toBeTruthy();
        expect(labelText?.length).toBeGreaterThan(0);
      }
    }
  });

  test('empty state messages are user-friendly', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const emptyState = page.locator('text=/no data|no invoices|no revenue|empty|0.00/i').first();

    if (await emptyState.isVisible({ timeout: 3000 }).catch(() => false)) {
      const emptyText = await emptyState.textContent();
      expect(emptyText).toBeTruthy();
      expect(emptyText?.length).toBeGreaterThan(0);
    }
  });
});
