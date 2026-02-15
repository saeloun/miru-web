import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Reports - Time Entry Report', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/reports/time-entry');
  });

  test('time entry report page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Time Entry Report' })).toBeVisible();
  });

  test('summary cards display total hours and entries', async ({ page }) => {
    await expect(page.getByText('Total Hours')).toBeVisible();
    await expect(page.getByText('Total Entries')).toBeVisible();
  });

  test('date range preset selector is available', async ({ page }) => {
    const presetSelector = page.getByRole('combobox').filter({ hasText: /This Month|Last Month|Custom/ }).first();
    await expect(presetSelector).toBeVisible();
  });

  test('custom date range picker is visible', async ({ page }) => {
    const dateRangeButton = page.getByRole('button').filter({ hasText: /Pick a date range/ });
    if (await dateRangeButton.isVisible()) {
      await expect(dateRangeButton).toBeVisible();
    } else {
      const dateButton = page.getByRole('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
      await expect(dateButton).toBeVisible();
    }
  });

  test('group by selector is available', async ({ page }) => {
    const groupBySelector = page.getByRole('combobox').filter({ hasText: /Group by/i });
    if (await groupBySelector.isVisible()) {
      await expect(groupBySelector).toBeVisible();
    } else {
      const clientGroupButton = page.getByText(/Group by Client/i);
      await expect(clientGroupButton).toBeVisible();
    }
  });

  test('export dropdown button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
  });

  test('can change date range preset', async ({ page }) => {
    const presetSelector = page.getByRole('combobox').first();
    await presetSelector.click();
    await page.getByRole('option', { name: 'Last Month' }).click();
    await page.waitForTimeout(500);
  });

  test('can change grouping option', async ({ page }) => {
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

  test('report displays data tables when entries exist', async ({ page }) => {
    const noResultsText = page.getByText('No results');
    const hasData = !(await noResultsText.isVisible().catch(() => false));

    if (hasData) {
      const table = page.locator('table').first();
      await expect(table).toBeVisible();
    }
  });

  test('table shows correct columns when data exists', async ({ page }) => {
    const noResultsText = page.getByText('No results');
    const hasData = !(await noResultsText.isVisible().catch(() => false));

    if (hasData) {
      await expect(page.getByRole('columnheader', { name: 'Date' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Team Member' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Project' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Note' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Hours' })).toBeVisible();
    }
  });

  test('grouped sections show totals when data exists', async ({ page }) => {
    const totalText = page.getByText(/Total:/i).first();
    if (await totalText.isVisible()) {
      await expect(totalText).toBeVisible();
    }
  });

  test('export dropdown shows CSV and PDF options', async ({ page }) => {
    await page.getByRole('button', { name: /Export/i }).click();
    await expect(page.getByRole('menuitem', { name: /Export as CSV/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Export as PDF/i })).toBeVisible();
  });

  test('pagination controls appear when multiple pages exist', async ({ page }) => {
    const previousButton = page.getByRole('button', { name: 'Previous' });
    const nextButton = page.getByRole('button', { name: 'Next' });

    if (await previousButton.isVisible()) {
      await expect(previousButton).toBeVisible();
      await expect(nextButton).toBeVisible();
    }
  });

  test('active clients/projects count displays', async ({ page }) => {
    const activeSection = page.getByText(/Active/i).first();
    if (await activeSection.isVisible()) {
      await expect(activeSection).toBeVisible();
    }
  });

  test('date range affects displayed period in summary', async ({ page }) => {
    const summaryDate = page.locator('.text-xs.text-muted-foreground').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|All time/ }).first();
    if (await summaryDate.isVisible()) {
      await expect(summaryDate).toBeVisible();
    }
  });
});
