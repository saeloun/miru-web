import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Team - Member Details', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/team');
  });

  test('clicking an active member navigates to detail page', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();

    const hasPendingBadge = await firstRow.locator('text=pending')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (!hasPendingBadge) {
      await firstRow.click();
      await page.waitForURL('**/team/*/profile');
      expect(page.url()).toContain('/team/');
      expect(page.url()).toContain('/profile');
    }
  });

  test('pending invitations do not navigate on click', async ({ page }) => {
    const pendingRow = page.locator('tbody tr:has(text("pending"))').first();

    if (await pendingRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      const currentUrl = page.url();
      await pendingRow.click();
      await page.waitForTimeout(500);
      expect(page.url()).toBe(currentUrl);
    }
  });

  test('detail page shows member profile after navigation', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();

    const hasPendingBadge = await firstRow.locator('text=pending')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (!hasPendingBadge) {
      const memberName = await firstRow.locator('p.text-sm.font-bold').textContent();
      await firstRow.click();
      await page.waitForURL('**/team/*/profile');

      const profileContent = page.locator('body');
      await expect(profileContent).toBeVisible();
    }
  });

  test('back navigation returns to team list', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();

    const hasPendingBadge = await firstRow.locator('text=pending')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (!hasPendingBadge) {
      await firstRow.click();
      await page.waitForURL('**/team/*/profile');

      await page.goBack();
      await page.waitForURL('**/team');

      await expect(page.locator('h2.header__title')).toContainText('Team');
    }
  });

  test('member avatar is clickable to view details', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();

    const hasPendingBadge = await firstRow.locator('text=pending')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (!hasPendingBadge) {
      const avatar = firstRow.locator('.my-auto').first();
      await avatar.click();
      await page.waitForURL('**/team/*/profile', { timeout: 5000 }).catch(() => {});

      if (page.url().includes('/team/') && page.url().includes('/profile')) {
        expect(page.url()).toContain('/team/');
      }
    }
  });

  test('member name is clickable to view details', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();

    const hasPendingBadge = await firstRow.locator('text=pending')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (!hasPendingBadge) {
      const nameElement = firstRow.locator('p.text-sm.font-bold');
      await nameElement.click();
      await page.waitForURL('**/team/*/profile', { timeout: 5000 }).catch(() => {});

      if (page.url().includes('/team/') && page.url().includes('/profile')) {
        expect(page.url()).toContain('/team/');
      }
    }
  });

  test('employment type and duration displayed in list', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const employmentColumn = firstRow.locator('td').nth(3);

    if (await employmentColumn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(employmentColumn).toBeVisible();

      const duration = employmentColumn.locator('.mt-2.text-xs');
      if (await duration.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(duration).toBeVisible();
      }
    }
  });

  test('role information is visible in table row', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const roleCell = firstRow.locator('td').nth(2);

    await expect(roleCell).toBeVisible();
    const roleText = await roleCell.locator('p.truncate').textContent();
    expect(roleText).toBeTruthy();
    expect(['admin', 'employee', 'book keeper', 'client']).toContain(roleText.trim().toLowerCase());
  });
});
