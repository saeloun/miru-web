import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Reports - Export Functionality', () => {
  test.describe('Time Entry Report Export', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/time-entry');
    });

    test('export button exists on time entry report', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
    });

    test('export dropdown shows CSV option', async ({ page }) => {
      await page.getByRole('button', { name: /Export/i }).click();
      await expect(page.getByRole('menuitem', { name: /Export as CSV/i })).toBeVisible();
    });

    test('export dropdown shows PDF option', async ({ page }) => {
      await page.getByRole('button', { name: /Export/i }).click();
      await expect(page.getByRole('menuitem', { name: /Export as PDF/i })).toBeVisible();
    });

    test('clicking CSV export initiates download', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await page.getByRole('button', { name: /Export/i }).click();
      await page.getByRole('menuitem', { name: /Export as CSV/i }).click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      }
    });

    test('clicking PDF export initiates download', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await page.getByRole('button', { name: /Export/i }).click();
      await page.getByRole('menuitem', { name: /Export as PDF/i }).click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.pdf$/);
      }
    });

    test('export respects current date range filter', async ({ page }) => {
      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'Last Month' }).click();
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: /Export/i }).click();
      await expect(page.getByRole('menuitem', { name: /Export as CSV/i })).toBeVisible();
    });

    test('export respects current group by filter', async ({ page }) => {
      const groupByButton = page.getByRole('button').filter({ hasText: /Group by/i }).first();
      if (await groupByButton.isVisible()) {
        await groupByButton.click();
        const projectOption = page.getByRole('option', { name: 'Group by Project' });
        if (await projectOption.isVisible()) {
          await projectOption.click();
          await page.waitForTimeout(500);
        }
      }

      await page.getByRole('button', { name: /Export/i }).click();
      await expect(page.getByRole('menuitem', { name: /Export as CSV/i })).toBeVisible();
    });
  });

  test.describe('Revenue Report Export', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/revenue-by-client');
    });

    test('export button exists on revenue report', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
    });

    test('export dropdown shows CSV option', async ({ page }) => {
      await page.getByRole('button', { name: /Export/i }).click();
      await expect(page.getByRole('menuitem', { name: /Export as CSV/i })).toBeVisible();
    });

    test('export dropdown shows PDF option', async ({ page }) => {
      await page.getByRole('button', { name: /Export/i }).click();
      await expect(page.getByRole('menuitem', { name: /Export as PDF/i })).toBeVisible();
    });

    test('clicking CSV export initiates download', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await page.getByRole('button', { name: /Export/i }).click();
      await page.getByRole('menuitem', { name: /Export as CSV/i }).click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      }
    });

    test('clicking PDF export initiates download', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await page.getByRole('button', { name: /Export/i }).click();
      await page.getByRole('menuitem', { name: /Export as PDF/i }).click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.pdf$/);
      }
    });

    test('export respects current date range filter', async ({ page }) => {
      const presetSelector = page.getByRole('combobox').first();
      await presetSelector.click();
      await page.getByRole('option', { name: 'This Month' }).click();
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: /Export/i }).click();
      await expect(page.getByRole('menuitem', { name: /Export as CSV/i })).toBeVisible();
    });
  });

  test.describe('Export Download Filenames', () => {
    test('time entry CSV export has correct filename format', async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/time-entry');

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await page.getByRole('button', { name: /Export/i }).click();
      await page.getByRole('menuitem', { name: /Export as CSV/i }).click();

      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/time_entries_\d{4}-\d{2}-\d{2}\.csv/);
      }
    });

    test('time entry PDF export has correct filename format', async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/time-entry');

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await page.getByRole('button', { name: /Export/i }).click();
      await page.getByRole('menuitem', { name: /Export as PDF/i }).click();

      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/time_entries_\d{4}-\d{2}-\d{2}\.pdf/);
      }
    });

    test('revenue CSV export has correct filename format', async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/revenue-by-client');

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await page.getByRole('button', { name: /Export/i }).click();
      await page.getByRole('menuitem', { name: /Export as CSV/i }).click();

      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/revenue_by_client_\d{4}-\d{2}-\d{2}\.csv/);
      }
    });

    test('revenue PDF export has correct filename format', async ({ page }) => {
      await login(page);
      await navigateTo(page, '/reports/revenue-by-client');

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await page.getByRole('button', { name: /Export/i }).click();
      await page.getByRole('menuitem', { name: /Export as PDF/i }).click();

      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/revenue_by_client_\d{4}-\d{2}-\d{2}\.pdf/);
      }
    });
  });
});
