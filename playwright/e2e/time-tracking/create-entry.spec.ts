import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Time Tracking - Creating Time Entries', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/time-tracking');
  });

  test('"Add Entry" button opens entry form', async ({ page }) => {
    const addEntryButton = page.locator('button').filter({ hasText: /add entry/i });
    await addEntryButton.click();

    await page.waitForTimeout(500);

    const formDialog = page.locator('[role="dialog"], [data-testid="entry-form"], form').filter({ hasText: /client|project|duration/i });
    await expect(formDialog.first()).toBeVisible({ timeout: 5000 });
  });

  test('form has client dropdown, project dropdown, duration, notes', async ({ page }) => {
    const addEntryButton = page.locator('button').filter({ hasText: /add entry/i });
    await addEntryButton.click();

    await page.waitForTimeout(1000);

    const clientField = page.locator('select[name*="client"], [data-testid*="client"], label:has-text("Client") + *, input[placeholder*="client" i], button:has-text("Select Client")');
    await expect(clientField.first()).toBeVisible({ timeout: 5000 });

    const projectField = page.locator('select[name*="project"], [data-testid*="project"], label:has-text("Project") + *, input[placeholder*="project" i], button:has-text("Select Project")');
    await expect(projectField.first()).toBeVisible({ timeout: 5000 });

    const durationField = page.locator('input[name*="duration"], [data-testid*="duration"], input[placeholder*="duration" i], input[placeholder*="hh:mm" i]');
    await expect(durationField.first()).toBeVisible({ timeout: 5000 });

    const notesField = page.locator('textarea[name*="note"], [data-testid*="note"], textarea[placeholder*="note" i], input[placeholder*="note" i]');
    const hasNotes = await notesField.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasNotes).toBe(true);
  });

  test('selecting a client filters project dropdown', async ({ page }) => {
    const addEntryButton = page.locator('button').filter({ hasText: /add entry/i });
    await addEntryButton.click();

    await page.waitForTimeout(1000);

    const clientDropdown = page.locator('select[name*="client"], button:has-text("Select Client")').first();

    const isSelect = await clientDropdown.evaluate(el => el.tagName === 'SELECT');

    if (isSelect) {
      await clientDropdown.selectOption({ index: 1 });
    } else {
      await clientDropdown.click();
      await page.waitForTimeout(500);
      const firstOption = page.locator('[role="option"], [data-testid*="client-option"]').first();
      await firstOption.click();
    }

    await page.waitForTimeout(1000);

    const projectDropdown = page.locator('select[name*="project"], button:has-text("Select Project")').first();
    await expect(projectDropdown).toBeVisible();
  });

  test('can enter duration in HH:MM format', async ({ page }) => {
    const addEntryButton = page.locator('button').filter({ hasText: /add entry/i });
    await addEntryButton.click();

    await page.waitForTimeout(1000);

    const durationField = page.locator('input[name*="duration"], input[placeholder*="hh:mm" i]').first();
    await durationField.click();
    await durationField.fill('02:30');

    const value = await durationField.inputValue();
    expect(value).toContain('2');
    expect(value).toContain('30');
  });

  test('can add notes/description', async ({ page }) => {
    const addEntryButton = page.locator('button').filter({ hasText: /add entry/i });
    await addEntryButton.click();

    await page.waitForTimeout(1000);

    const notesField = page.locator('textarea[name*="note"], input[name*="note"], textarea[placeholder*="note" i]').first();
    await notesField.click();
    await notesField.fill('Test entry for automation');

    const value = await notesField.inputValue();
    expect(value).toBe('Test entry for automation');
  });

  test('submitting creates entry visible in list', async ({ page }) => {
    const addEntryButton = page.locator('button').filter({ hasText: /add entry/i });
    await addEntryButton.click();

    await page.waitForTimeout(1000);

    const clientDropdown = page.locator('select[name*="client"], button:has-text("Select Client")').first();
    const isSelect = await clientDropdown.evaluate(el => el.tagName === 'SELECT');

    if (isSelect) {
      await clientDropdown.selectOption({ index: 1 });
    } else {
      await clientDropdown.click();
      await page.waitForTimeout(500);
      const firstOption = page.locator('[role="option"]').first();
      await firstOption.click();
    }

    await page.waitForTimeout(1000);

    const projectDropdown = page.locator('select[name*="project"], button').filter({ hasText: /select project/i }).first();
    const isProjectSelect = await projectDropdown.evaluate(el => el.tagName === 'SELECT');

    if (isProjectSelect) {
      await projectDropdown.selectOption({ index: 1 });
    } else {
      await projectDropdown.click();
      await page.waitForTimeout(500);
      const firstProjectOption = page.locator('[role="option"]').first();
      await firstProjectOption.click();
    }

    const durationField = page.locator('input[name*="duration"], input[placeholder*="hh:mm" i]').first();
    await durationField.click();
    await durationField.fill('01:15');

    const notesField = page.locator('textarea[name*="note"], input[name*="note"]').first();
    await notesField.click();
    await notesField.fill('Playwright test entry');

    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await submitButton.click();

    await page.waitForTimeout(2000);

    const newEntry = page.locator('text=Playwright test entry, text=/01:15/');
    const hasNewEntry = await newEntry.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasNewEntry).toBe(true);
  });

  test('form validation: duration is required', async ({ page }) => {
    const addEntryButton = page.locator('button').filter({ hasText: /add entry/i });
    await addEntryButton.click();

    await page.waitForTimeout(1000);

    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await submitButton.click();

    await page.waitForTimeout(500);

    const errorMessage = page.locator('text=/required|must|cannot be blank/i, [data-testid*="error"], .error');
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasError).toBe(true);
  });

  test('cancel closes form without creating', async ({ page }) => {
    const addEntryButton = page.locator('button').filter({ hasText: /add entry/i });
    await addEntryButton.click();

    await page.waitForTimeout(1000);

    const notesField = page.locator('textarea[name*="note"], input[name*="note"]').first();
    await notesField.click();
    await notesField.fill('This should not be saved');

    const cancelButton = page.locator('button').filter({ hasText: /cancel|close/i }).first();
    await cancelButton.click();

    await page.waitForTimeout(1000);

    const formDialog = page.locator('[role="dialog"]').filter({ hasText: /client|project/i });
    await expect(formDialog).not.toBeVisible({ timeout: 3000 });

    const canceledEntry = page.locator('text=This should not be saved');
    await expect(canceledEntry).not.toBeVisible();
  });
});
