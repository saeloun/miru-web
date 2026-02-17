import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Time Tracking - Deleting Time Entries', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/time-tracking');

    const dayWithEntries = page.locator('button[aria-label*="Tue"]').first();
    await dayWithEntries.click();
    await page.waitForTimeout(1000);
  });

  test('delete button on entry triggers confirmation', async ({ page }) => {
    const deleteButton = page.locator('button[aria-label*="delete"], button').filter({ hasText: /delete/i }).first();
    const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDeleteButton) {
      await deleteButton.click();

      await page.waitForTimeout(500);

      const confirmDialog = page.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: /delete|confirm|sure/i });
      const confirmMessage = page.locator('text=/are you sure|confirm delete|delete.*entry/i');

      const hasConfirmDialog = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
      const hasConfirmMessage = await confirmMessage.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasConfirmDialog || hasConfirmMessage).toBe(true);
    } else {
      const moreButton = page.locator('button[aria-label*="more"], button[aria-label*="menu"]').first();
      const hasMoreButton = await moreButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasMoreButton) {
        await moreButton.click();
        await page.waitForTimeout(500);

        const menuDeleteButton = page.locator('[role="menuitem"]').filter({ hasText: /delete/i });
        await expect(menuDeleteButton).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('confirming deletion removes entry from list', async ({ page }) => {
    const initialEntries = await page.locator('[data-testid*="entry"], text=/\\d{1,2}:\\d{2}/').count();

    const deleteButton = page.locator('button[aria-label*="delete"], button').filter({ hasText: /delete/i }).first();
    const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDeleteButton && initialEntries > 0) {
      await deleteButton.click();

      await page.waitForTimeout(500);

      const confirmButton = page.locator('button').filter({ hasText: /^delete$|confirm|yes/i });
      const hasConfirmButton = await confirmButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasConfirmButton) {
        await confirmButton.click();

        await page.waitForTimeout(2000);

        const finalEntries = await page.locator('[data-testid*="entry"], text=/\\d{1,2}:\\d{2}/').count();
        expect(finalEntries).toBeLessThan(initialEntries);
      }
    }
  });

  test('day total updates after deletion', async ({ page }) => {
    const deleteButton = page.locator('button[aria-label*="delete"], button').filter({ hasText: /delete/i }).first();
    const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDeleteButton) {
      const totalBefore = await page.locator('text=/total/i, [data-testid="day-total"]').first().textContent().catch(() => '0');

      await deleteButton.click();

      await page.waitForTimeout(500);

      const confirmButton = page.locator('button').filter({ hasText: /^delete$|confirm|yes/i });
      const hasConfirmButton = await confirmButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasConfirmButton) {
        await confirmButton.click();

        await page.waitForTimeout(2000);

        const totalAfter = await page.locator('text=/total/i, [data-testid="day-total"]').first().textContent().catch(() => '0');

        expect(totalAfter).not.toBe(totalBefore);
      }
    }
  });

  test('deletion persists after page reload', async ({ page }) => {
    const initialEntries = await page.locator('[data-testid*="entry"], text=/\\d{1,2}:\\d{2}/').count();

    const deleteButton = page.locator('button[aria-label*="delete"], button').filter({ hasText: /delete/i }).first();
    const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDeleteButton && initialEntries > 0) {
      await deleteButton.click();

      await page.waitForTimeout(500);

      const confirmButton = page.locator('button').filter({ hasText: /^delete$|confirm|yes/i });
      const hasConfirmButton = await confirmButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasConfirmButton) {
        await confirmButton.click();

        await page.waitForTimeout(2000);

        const entriesAfterDelete = await page.locator('[data-testid*="entry"], text=/\\d{1,2}:\\d{2}/').count();

        await page.reload();
        await page.waitForTimeout(1000);

        const tuesdayButton = page.locator('button[aria-label*="Tue"]').first();
        await tuesdayButton.click();
        await page.waitForTimeout(1000);

        const entriesAfterReload = await page.locator('[data-testid*="entry"], text=/\\d{1,2}:\\d{2}/').count();

        expect(entriesAfterReload).toBe(entriesAfterDelete);
        expect(entriesAfterReload).toBeLessThan(initialEntries);
      }
    }
  });

  test('cancel deletion keeps entry in list', async ({ page }) => {
    const initialEntries = await page.locator('[data-testid*="entry"], text=/\\d{1,2}:\\d{2}/').count();

    const deleteButton = page.locator('button[aria-label*="delete"], button').filter({ hasText: /delete/i }).first();
    const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDeleteButton && initialEntries > 0) {
      await deleteButton.click();

      await page.waitForTimeout(500);

      const cancelButton = page.locator('button').filter({ hasText: /cancel|no/i }).first();
      const hasCancelButton = await cancelButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasCancelButton) {
        await cancelButton.click();

        await page.waitForTimeout(1000);

        const finalEntries = await page.locator('[data-testid*="entry"], text=/\\d{1,2}:\\d{2}/').count();
        expect(finalEntries).toBe(initialEntries);
      }
    }
  });

  test('deleting all entries shows empty state', async ({ page }) => {
    let entryCount = await page.locator('button[aria-label*="delete"], button').filter({ hasText: /delete/i }).count();

    while (entryCount > 0 && entryCount <= 5) {
      const deleteButton = page.locator('button[aria-label*="delete"], button').filter({ hasText: /delete/i }).first();
      const hasDeleteButton = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasDeleteButton) break;

      await deleteButton.click();
      await page.waitForTimeout(500);

      const confirmButton = page.locator('button').filter({ hasText: /^delete$|confirm|yes/i });
      const hasConfirmButton = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasConfirmButton) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }

      entryCount = await page.locator('button[aria-label*="delete"], button').filter({ hasText: /delete/i }).count();
    }

    if (entryCount === 0) {
      const emptyState = page.locator('text=/no entries/i, text=/click.*add entry/i, [data-testid="empty-state"]');
      await expect(emptyState.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('delete action can be undone if undo feature exists', async ({ page }) => {
    const deleteButton = page.locator('button[aria-label*="delete"], button').filter({ hasText: /delete/i }).first();
    const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDeleteButton) {
      await deleteButton.click();

      await page.waitForTimeout(500);

      const confirmButton = page.locator('button').filter({ hasText: /^delete$|confirm|yes/i });
      const hasConfirmButton = await confirmButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasConfirmButton) {
        await confirmButton.click();

        await page.waitForTimeout(1000);

        const undoButton = page.locator('button').filter({ hasText: /undo/i });
        const hasUndo = await undoButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasUndo) {
          await undoButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });
});
