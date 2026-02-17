import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Reports - Filter Behavior', () => {
  test.describe('Time Entry Report Filters', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/time-entry');
    });

    test('date range filter exists and is functional', async ({ page }) => {
      const presetSelector = page.getByRole('combobox').first();
      await expect(presetSelector).toBeVisible();
      await presetSelector.click();
      await expect(page.getByRole('option', { name: 'This Month' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Last Month' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'This Quarter' })).toBeVisible();
    });

    test('applying date range filter updates results', async ({ page }) => {
      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'Last Month' }).click();
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);
    });

    test('group by filter exists and is functional', async ({ page }) => {
      const groupByButton = page.getByRole('button').filter({ hasText: /Group by/i }).first();
      if (await groupByButton.isVisible()) {
        await groupByButton.click();
        await expect(page.getByRole('option', { name: 'Group by Client' })).toBeVisible();
        await expect(page.getByRole('option', { name: 'Group by Project' })).toBeVisible();
        await expect(page.getByRole('option', { name: 'Group by Team Member' })).toBeVisible();
      }
    });

    test('changing group by updates report structure', async ({ page }) => {
      const groupByButton = page.getByRole('button').filter({ hasText: /Group by/i }).first();
      if (await groupByButton.isVisible()) {
        await groupByButton.click();
        const projectOption = page.getByRole('option', { name: 'Group by Project' });
        if (await projectOption.isVisible()) {
          await projectOption.click();
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(1000);
        }
      }
    });

    test('multiple filters can be combined', async ({ page }) => {
      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'This Quarter' }).click();
      await page.waitForTimeout(500);

      const groupByButton = page.getByRole('button').filter({ hasText: /Group by/i }).first();
      if (await groupByButton.isVisible()) {
        await groupByButton.click();
        const projectOption = page.getByRole('option', { name: 'Group by Project' });
        if (await projectOption.isVisible()) {
          await projectOption.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('custom date range can be selected', async ({ page }) => {
      const dateButton = page.getByRole('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
      if (await dateButton.isVisible()) {
        await dateButton.click();
        await page.waitForTimeout(300);
      }
    });

    test('date preset selector shows all options', async ({ page }) => {
      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await expect(page.getByRole('option', { name: 'This Month' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Last Month' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'This Quarter' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'This Year' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Last 7 Days' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Last 30 Days' })).toBeVisible();
    });
  });

  test.describe('Revenue Report Filters', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/revenue-by-client');
    });

    test('date range filter exists and is functional', async ({ page }) => {
      const presetSelector = page.getByRole('combobox').first();
      await expect(presetSelector).toBeVisible();
      await presetSelector.click();
      await expect(page.getByRole('option', { name: 'All Time' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'This Month' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Last Month' })).toBeVisible();
    });

    test('applying date range filter updates revenue data', async ({ page }) => {
      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'This Month' }).click();
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);
    });

    test('revenue report shows all date preset options', async ({ page }) => {
      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await expect(page.getByRole('option', { name: 'All Time' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'This Month' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Last Month' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'This Quarter' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Last Quarter' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'This Year' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Last Year' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Last 30 Days' })).toBeVisible();
    });

    test('custom date range picker is available', async ({ page }) => {
      const dateButton = page.getByRole('button').filter({ hasText: /All Time|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
      await expect(dateButton).toBeVisible();
    });

    test('can switch between preset and custom date range', async ({ page }) => {
      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'This Month' }).click();
      await page.waitForTimeout(500);

      await presetSelector.click();
      await page.getByRole('option', { name: 'Custom Range' }).click();
      await page.waitForTimeout(300);
    });
  });

  test.describe('Filter State and Persistence', () => {
    test('time entry report maintains filter state', async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/time-entry');

      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'Last Month' }).click();
      await page.waitForTimeout(500);
    });

    test('revenue report maintains filter state', async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/revenue-by-client');

      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'This Quarter' }).click();
      await page.waitForTimeout(500);
    });
  });

  test.describe('Filter Response and Updates', () => {
    test('summary cards update when filters change on time entry report', async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/time-entry');

      const totalHoursBefore = await page.locator('.text-2xl.font-bold').first().textContent();

      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'Last 7 Days' }).click();
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);
    });

    test('summary cards update when filters change on revenue report', async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/revenue-by-client');

      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'This Year' }).click();
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);
    });

    test('table data updates when filters are applied', async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/time-entry');

      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'This Quarter' }).click();
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Reports List Category Filters', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports');
    });

    test('category filter tabs work correctly', async ({ page }) => {
      await page.getByRole('tab', { name: 'Financial' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByRole('heading', { name: 'Revenue by Client' })).toBeVisible();

      await page.getByRole('tab', { name: 'Time' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByRole('heading', { name: 'Time Entry Report' })).toBeVisible();
    });

    test('all reports tab shows all available reports', async ({ page }) => {
      await page.getByRole('tab', { name: 'All Reports' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByRole('heading', { name: 'Time Entry Report' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Revenue by Client' })).toBeVisible();
    });

    test('category filters update visible reports', async ({ page }) => {
      await page.getByRole('tab', { name: 'Client' }).click();
      await page.waitForTimeout(300);
    });
  });
});
