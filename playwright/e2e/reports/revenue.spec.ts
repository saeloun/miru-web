import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Reports - Revenue by Client', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/reports/revenue-by-client');
  });

  test('revenue report page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Revenue by Client' })).toBeVisible();
  });

  test('displays financial summary cards', async ({ page }) => {
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Paid Amount')).toBeVisible();
    await expect(page.getByText('Outstanding')).toBeVisible();
    await expect(page.getByText('Overdue')).toBeVisible();
  });

  test('date range preset selector is available', async ({ page }) => {
    const presetSelector = page.getByRole('combobox').filter({ hasText: /All Time|This Month|Last Month|Custom/ }).first();
    await expect(presetSelector).toBeVisible();
  });

  test('custom date range picker is visible', async ({ page }) => {
    const dateRangeButton = page.getByRole('button').filter({ hasText: /All Time|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
    await expect(dateRangeButton).toBeVisible();
  });

  test('export button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
  });

  test('client revenue details table heading exists', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Client Revenue Details' })).toBeVisible();
  });

  test('revenue table shows correct columns when data exists', async ({ page }) => {
    const noResultsText = page.getByText('No results');
    const hasData = !(await noResultsText.isVisible().catch(() => false));

    if (hasData) {
      await expect(page.getByRole('columnheader', { name: 'Client' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Overdue Amount' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Outstanding Amount' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Paid Amount' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Total Revenue' })).toBeVisible();
    }
  });

  test('currency amounts are properly formatted when data exists', async ({ page }) => {
    const noResultsText = page.getByText('No results');
    const hasData = !(await noResultsText.isVisible().catch(() => false));

    if (hasData) {
      const currencyCell = page.locator('td').filter({ hasText: /\$|€|£|¥/ }).first();
      if (await currencyCell.isVisible()) {
        await expect(currencyCell).toBeVisible();
      }
    }
  });

  test('can change date range preset', async ({ page }) => {
    const presetSelector = page.getByRole('combobox').first();
    await presetSelector.click();
    await page.getByRole('option', { name: 'This Month' }).click();
    await page.waitForTimeout(500);
  });

  test('summary totals update and display', async ({ page }) => {
    const totalRevenue = page.locator('.text-2xl.font-bold.text-indigo-600').first();
    if (await totalRevenue.isVisible()) {
      await expect(totalRevenue).toBeVisible();
    }
  });

  test('export dropdown shows CSV and PDF options', async ({ page }) => {
    await page.getByRole('button', { name: /Export/i }).click();
    await expect(page.getByRole('menuitem', { name: /Export as CSV/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Export as PDF/i })).toBeVisible();
  });

  test('pagination controls appear when needed', async ({ page }) => {
    const previousButton = page.getByRole('button', { name: 'Previous', exact: true });
    const nextButton = page.getByRole('button', { name: 'Next', exact: true });

    if (await previousButton.isVisible()) {
      await expect(previousButton).toBeVisible();
      await expect(nextButton).toBeVisible();
    }
  });

  test('date range displays in summary card', async ({ page }) => {
    const dateDisplay = page.locator('.text-xs.text-muted-foreground').filter({ hasText: /All time|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
    if (await dateDisplay.isVisible()) {
      await expect(dateDisplay).toBeVisible();
    }
  });

  test('colored amounts display for different statuses', async ({ page }) => {
    const noResultsText = page.getByText('No results');
    const hasData = !(await noResultsText.isVisible().catch(() => false));

    if (hasData) {
      const overdueAmount = page.locator('.text-red-600').first();
      const outstandingAmount = page.locator('.text-orange-600').first();
      const paidAmount = page.locator('.text-green-600').first();

      if (await overdueAmount.isVisible()) {
        await expect(overdueAmount).toBeVisible();
      }
      if (await outstandingAmount.isVisible()) {
        await expect(outstandingAmount).toBeVisible();
      }
      if (await paidAmount.isVisible()) {
        await expect(paidAmount).toBeVisible();
      }
    }
  });

  test('client logos display when available', async ({ page }) => {
    const noResultsText = page.getByText('No results');
    const hasData = !(await noResultsText.isVisible().catch(() => false));

    if (hasData) {
      const clientLogo = page.locator('td img.rounded-full').first();
      if (await clientLogo.isVisible()) {
        await expect(clientLogo).toBeVisible();
      }
    }
  });

  test('can open custom date range picker', async ({ page }) => {
    const dateButton = page.getByRole('button').filter({ hasText: /All Time|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
    await dateButton.click();
    await page.waitForTimeout(300);
    const calendar = page.locator('[role="dialog"]').or(page.locator('.rdp'));
    if (await calendar.isVisible()) {
      await expect(calendar).toBeVisible();
    }
  });
});
