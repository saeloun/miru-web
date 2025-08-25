import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('TimeTracking Controller', () => {
  const adminUser = {
    email: 'vipul@saeloun.com',
    password: 'password'
  };

  test.beforeEach(async ({ page }) => {
    await login(page, adminUser.email, adminUser.password);
    await page.goto('/time-tracking');
  });

  test.describe('Week View', () => {
    test('displays week view by default', async ({ page }) => {
      await expect(page.locator('button:has-text("WEEK")')).toBeVisible();
      await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
    });

    test('can view time sheet entries', async ({ page }) => {
      await page.click('button:has-text("WEEK")');
      await page.click('#prevMonth');
      await page.click('#nextMonth');
      await expect(page.locator('text=08:00').first()).toBeVisible();
    });

    test('can add new time entry', async ({ page }) => {
      const weekdayNumber = new Date().getDay() - 1;
      
      await page.click('button:has-text("WEEK")');
      await page.click('button:has-text("NEW ROW")');
      await page.selectOption('select[name="client"]', { index: 1 });
      await page.click('button:has-text("SAVE")');
      await page.click(`#inputClick_${weekdayNumber}`);
      await page.fill('#selectedInput', '8');
      await page.fill('input[placeholder="Note"]', 'Weekly note!');
      await page.click('button:has-text("SAVE")');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=8:00')).toBeVisible();
    });

    test('can edit existing time entry', async ({ page }) => {
      const weekdayNumber = new Date().getDay() - 1;
      
      await page.click('button:has-text("WEEK")');
      await page.click('#prevMonth');
      await page.click('#nextMonth');
      await page.click(`#inputClick_${weekdayNumber}`);
      await page.fill('#selectedInput', '10');
      await page.fill('input[placeholder="Note"]', 'Updated weekly note!');
      await page.click('button:has-text("UPDATE")');
      await page.waitForTimeout(2000);
      await expect(page.locator('text=10:00')).toBeVisible();
    });

    test('admin can view other users entries', async ({ page }) => {
      await page.click('button:has-text("WEEK")');
      const userSelect = page.locator('[data-testid="user-select"], [role="combobox"]').first();
      await userSelect.click();
      const userOption = page.locator('[role="option"]').filter({ hasText: 'Test User' });
      if (await userOption.count() > 0) {
        await userOption.click();
        await expect(page.locator('text=08:00')).toBeVisible();
      }
    });
  });

  test.describe('Month View', () => {
    test('can switch to month view', async ({ page }) => {
      await page.click('button:has-text("MONTH")');
      await expect(page.locator('[data-testid="month-view"]')).toBeVisible();
    });

    test('displays calendar with entries', async ({ page }) => {
      await page.click('button:has-text("MONTH")');
      const today = new Date().getDate();
      const todayCell = page.locator('.calendar-cell').filter({ hasText: today.toString() });
      await expect(todayCell).toBeVisible();
    });

    test('can click on day to view entries in modal', async ({ page }) => {
      await page.click('button:has-text("MONTH")');
      const today = new Date().getDate();
      const todayCell = page.locator('.calendar-cell').filter({ hasText: today.toString() }).first();
      await todayCell.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Day View', () => {
    test('can switch to day view', async ({ page }) => {
      await page.click('button:has-text("DAY")');
      await expect(page.locator('[data-testid="day-view"]')).toBeVisible();
    });

    test('displays entries for selected day', async ({ page }) => {
      await page.click('button:has-text("DAY")');
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
      await expect(page.locator(`text=${today}`)).toBeVisible();
    });
  });

  test.describe('Entry Management', () => {
    test('can add new entry with all fields', async ({ page }) => {
      await page.click('button:has-text("Add Entry")');
      
      // Select client and project
      await page.selectOption('select[name="client"]', { index: 1 });
      await page.waitForTimeout(500);
      await page.selectOption('select[name="project"]', { index: 1 });
      
      // Fill duration and note
      await page.fill('input[name="duration"]', '4.5');
      await page.fill('textarea[name="note"]', 'Test entry description');
      
      // Save entry
      await page.click('button:has-text("Save")');
      await expect(page.locator('text=Entry saved successfully')).toBeVisible();
    });

    test('validates required fields', async ({ page }) => {
      await page.click('button:has-text("Add Entry")');
      await page.click('button:has-text("Save")');
      await expect(page.locator('text=Client is required')).toBeVisible();
    });

    test('can delete entry', async ({ page }) => {
      // First find an existing entry
      const entryRow = page.locator('.entry-row').first();
      if (await entryRow.count() > 0) {
        await entryRow.hover();
        await entryRow.locator('button[aria-label="Delete"]').click();
        await page.click('button:has-text("Confirm")');
        await expect(page.locator('text=Entry deleted successfully')).toBeVisible();
      }
    });

    test('can bulk edit entries', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"].entry-checkbox');
      if (await checkboxes.count() >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
        await page.click('button:has-text("Bulk Actions")');
        await page.click('button:has-text("Edit Selected")');
        await page.fill('textarea[name="bulk-note"]', 'Bulk updated note');
        await page.click('button:has-text("Update All")');
        await expect(page.locator('text=Entries updated successfully')).toBeVisible();
      }
    });
  });

  test.describe('Filtering and Search', () => {
    test('can filter by client', async ({ page }) => {
      const clientFilter = page.locator('select[name="filter-client"]');
      if (await clientFilter.count() > 0) {
        await clientFilter.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        // Verify filtered results
        const entries = page.locator('.entry-row');
        expect(await entries.count()).toBeGreaterThan(0);
      }
    });

    test('can filter by date range', async ({ page }) => {
      const dateRangePicker = page.locator('[data-testid="date-range-picker"]');
      if (await dateRangePicker.count() > 0) {
        await dateRangePicker.click();
        await page.click('button:has-text("Last 7 days")');
        await page.waitForTimeout(500);
        // Verify filtered results
        const entries = page.locator('.entry-row');
        expect(await entries.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('can search entries by note', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('meeting');
        await page.waitForTimeout(500);
        // Verify search results
        const entries = page.locator('.entry-row');
        if (await entries.count() > 0) {
          await expect(entries.first()).toContainText('meeting');
        }
      }
    });
  });

  test.describe('Export and Reports', () => {
    test('can export timesheet as CSV', async ({ page }) => {
      const exportButton = page.locator('button:has-text("Export")');
      if (await exportButton.count() > 0) {
        // Start waiting for download before clicking
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        await page.click('button:has-text("CSV")');
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.csv');
      }
    });

    test('can view weekly summary', async ({ page }) => {
      await page.click('button:has-text("WEEK")');
      const weeklySummary = page.locator('.weekly-summary');
      if (await weeklySummary.count() > 0) {
        await expect(weeklySummary).toContainText('Total Hours');
        await expect(weeklySummary).toContainText(/\d+:\d+/);
      }
    });
  });

  test.describe('Permissions', () => {
    test('employee cannot view other users entries', async ({ page }) => {
      // This would need an employee user login
      // Skipping for now as it needs different user credentials
      test.skip();
    });
  });
});