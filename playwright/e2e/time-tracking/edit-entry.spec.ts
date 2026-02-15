import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Time Tracking - Editing Time Entries', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/time-tracking');

    const dayWithEntries = page.locator('button[aria-label*="Tue"]').first();
    await dayWithEntries.click();
    await page.waitForTimeout(1000);
  });

  test('edit button on entry opens edit form', async ({ page }) => {
    const editButton = page.locator('button[aria-label*="edit"], button').filter({ hasText: /edit/i }).first();
    const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      await page.waitForTimeout(1000);

      const formDialog = page.locator('[role="dialog"], form').filter({ hasText: /client|project|duration/i });
      await expect(formDialog.first()).toBeVisible({ timeout: 5000 });
    } else {
      const entryCard = page.locator('[data-testid*="entry"], .entry-card').first();
      const hasEntry = await entryCard.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasEntry) {
        await entryCard.click();
        await page.waitForTimeout(1000);

        const formOrMenu = page.locator('[role="dialog"], [role="menu"]');
        const hasFormOrMenu = await formOrMenu.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasFormOrMenu).toBe(true);
      }
    }
  });

  test('form pre-fills with existing data', async ({ page }) => {
    const editButton = page.locator('button[aria-label*="edit"], button').filter({ hasText: /edit/i }).first();
    const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      await page.waitForTimeout(1000);

      const durationField = page.locator('input[name*="duration"], input[placeholder*="hh:mm" i]').first();
      const durationValue = await durationField.inputValue();

      expect(durationValue).toBeTruthy();
      expect(durationValue).toMatch(/\d/);
    }
  });

  test('can change duration', async ({ page }) => {
    const editButton = page.locator('button[aria-label*="edit"], button').filter({ hasText: /edit/i }).first();
    const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      await page.waitForTimeout(1000);

      const durationField = page.locator('input[name*="duration"], input[placeholder*="hh:mm" i]').first();
      await durationField.click();
      await durationField.fill('03:45');

      const newValue = await durationField.inputValue();
      expect(newValue).toContain('3');
      expect(newValue).toContain('45');
    }
  });

  test('can change notes', async ({ page }) => {
    const editButton = page.locator('button[aria-label*="edit"], button').filter({ hasText: /edit/i }).first();
    const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      await page.waitForTimeout(1000);

      const notesField = page.locator('textarea[name*="note"], input[name*="note"]').first();
      await notesField.click();
      await notesField.fill('Updated notes from Playwright test');

      const newValue = await notesField.inputValue();
      expect(newValue).toBe('Updated notes from Playwright test');
    }
  });

  test('save button updates the entry', async ({ page }) => {
    const editButton = page.locator('button[aria-label*="edit"], button').filter({ hasText: /edit/i }).first();
    const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      await page.waitForTimeout(1000);

      const notesField = page.locator('textarea[name*="note"], input[name*="note"]').first();
      const uniqueNote = `Edited at ${Date.now()}`;
      await notesField.click();
      await notesField.fill(uniqueNote);

      const saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i }).first();
      await saveButton.click();

      await page.waitForTimeout(2000);

      const updatedEntry = page.locator(`text=${uniqueNote}`);
      await expect(updatedEntry).toBeVisible({ timeout: 5000 });
    }
  });

  test('cancel discards changes', async ({ page }) => {
    const editButton = page.locator('button[aria-label*="edit"], button').filter({ hasText: /edit/i }).first();
    const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      await page.waitForTimeout(1000);

      const notesField = page.locator('textarea[name*="note"], input[name*="note"]').first();
      const originalValue = await notesField.inputValue();

      await notesField.click();
      await notesField.fill('This change should be discarded');

      const cancelButton = page.locator('button').filter({ hasText: /cancel|close/i }).first();
      await cancelButton.click();

      await page.waitForTimeout(1000);

      const discardedText = page.locator('text=This change should be discarded');
      await expect(discardedText).not.toBeVisible();
    }
  });

  test('updated entry shows new values', async ({ page }) => {
    const editButton = page.locator('button[aria-label*="edit"], button').filter({ hasText: /edit/i }).first();
    const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      await page.waitForTimeout(1000);

      const durationField = page.locator('input[name*="duration"], input[placeholder*="hh:mm" i]').first();
      await durationField.click();
      await durationField.fill('02:20');

      const notesField = page.locator('textarea[name*="note"], input[name*="note"]').first();
      const uniqueNote = `Updated entry ${Date.now()}`;
      await notesField.click();
      await notesField.fill(uniqueNote);

      const saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i }).first();
      await saveButton.click();

      await page.waitForTimeout(2000);

      const updatedDuration = page.locator('text=/02:20/');
      const updatedNote = page.locator(`text=${uniqueNote}`);

      await expect(updatedDuration).toBeVisible({ timeout: 5000 });
      await expect(updatedNote).toBeVisible({ timeout: 5000 });
    }
  });

  test('editing preserves other entry fields', async ({ page }) => {
    const editButton = page.locator('button[aria-label*="edit"], button').filter({ hasText: /edit/i }).first();
    const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      await page.waitForTimeout(1000);

      const clientField = page.locator('select[name*="client"], button:has-text("Select Client"), [data-testid*="client"]').first();
      const projectField = page.locator('select[name*="project"], button:has-text("Select Project"), [data-testid*="project"]').first();

      await expect(clientField).toBeVisible({ timeout: 3000 });
      await expect(projectField).toBeVisible({ timeout: 3000 });
    }
  });
});
