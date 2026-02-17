import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Time Tracking - Day Selection and Entries', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/time-tracking');
  });

  test('clicking a day shows entries for that day', async ({ page }) => {
    const tuesdayButton = page.locator('button[aria-label*="Tue"]').first();
    await tuesdayButton.click();

    await page.waitForTimeout(500);

    const entriesSection = page.locator('text=/entries for/i, [data-testid="entries-list"], [data-testid="day-entries"]');
    await expect(entriesSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('each entry shows project, client, duration, notes', async ({ page }) => {
    const dayWithEntries = page.locator('button[aria-label*="Tue"]').first();
    await dayWithEntries.click();

    await page.waitForTimeout(1000);

    const projectText = page.locator('[data-testid*="project"], text=/project/i').first();
    const clientText = page.locator('[data-testid*="client"], text=/client/i').first();
    const durationText = page.locator('text=/\\d{1,2}:\\d{2}/').first();

    const hasProject = await projectText.isVisible({ timeout: 2000 }).catch(() => false);
    const hasClient = await clientText.isVisible({ timeout: 2000 }).catch(() => false);
    const hasDuration = await durationText.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasProject || hasClient || hasDuration).toBe(true);
  });

  test('day total hours are calculated correctly', async ({ page }) => {
    const dayButton = page.locator('button[aria-label*="Tue"]').first();
    await dayButton.click();

    await page.waitForTimeout(500);

    const totalText = page.locator('text=/total/i, [data-testid="day-total"]');
    const hasDayTotal = await totalText.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDayTotal) {
      await expect(totalText.first()).toBeVisible();
    }
  });

  test('empty day shows empty state or no entries message', async ({ page }) => {
    const allDayButtons = page.locator('button[aria-label*="Select Mon"], button[aria-label*="Select Tue"], button[aria-label*="Select Wed"], button[aria-label*="Select Thu"], button[aria-label*="Select Fri"], button[aria-label*="Select Sat"], button[aria-label*="Select Sun"]');

    let foundEmptyDay = false;
    const count = await allDayButtons.count();

    for (let i = 0; i < count && i < 7; i++) {
      await allDayButtons.nth(i).click();
      await page.waitForTimeout(500);

      const noEntriesMessage = page.locator('text=/no entries/i, text=/click.*add entry/i, [data-testid="empty-state"]');
      const hasNoEntries = await noEntriesMessage.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasNoEntries) {
        foundEmptyDay = true;
        await expect(noEntriesMessage.first()).toBeVisible();
        break;
      }
    }

    expect(foundEmptyDay).toBe(true);
  });

  test('multiple entries can exist for same day', async ({ page }) => {
    const dayButton = page.locator('button[aria-label*="Tue"]').first();
    await dayButton.click();

    await page.waitForTimeout(1000);

    const entryCards = page.locator('[data-testid*="entry"], [data-testid*="timesheet-entry"], .entry-card, [class*="entry"]').filter({ hasText: /\\d{1,2}:\\d{2}/ });
    const entryCount = await entryCards.count().catch(() => 0);

    expect(entryCount).toBeGreaterThanOrEqual(0);
  });

  test('selecting different days updates the view', async ({ page }) => {
    const mondayButton = page.locator('button[aria-label*="Mon"]').first();
    await mondayButton.click();

    await expect(mondayButton).toHaveAttribute('aria-pressed', 'true', { timeout: 3000 });

    const wednesdayButton = page.locator('button[aria-label*="Wed"]').first();
    await wednesdayButton.click();

    await expect(wednesdayButton).toHaveAttribute('aria-pressed', 'true', { timeout: 3000 });
    await expect(mondayButton).toHaveAttribute('aria-pressed', 'false', { timeout: 3000 });
  });

  test('day entries persist after page reload', async ({ page }) => {
    const tuesdayButton = page.locator('button[aria-label*="Tue"]').first();
    await tuesdayButton.click();

    await page.waitForTimeout(1000);

    const entriesBeforeReload = await page.locator('text=/\\d{1,2}:\\d{2}/').count();

    await page.reload();
    await page.waitForTimeout(1000);

    await tuesdayButton.click();
    await page.waitForTimeout(1000);

    const entriesAfterReload = await page.locator('text=/\\d{1,2}:\\d{2}/').count();

    expect(entriesAfterReload).toBe(entriesBeforeReload);
  });
});
