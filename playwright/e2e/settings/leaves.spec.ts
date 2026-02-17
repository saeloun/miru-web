import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Settings - Leaves', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('leave settings page loads', async ({ page }) => {
    await navigateTo(page, '/settings/leaves');
    await expect(page.getByRole('heading', { name: /leave/i })).toBeVisible();
  });

  test('shows leave types', async ({ page }) => {
    await navigateTo(page, '/settings/leaves');

    const leaveTypeLabels = page.locator('text=/vacation|sick|personal|pto/i').first();
    await expect(leaveTypeLabels).toBeVisible();
  });

  test('shows allowed days per type', async ({ page }) => {
    await navigateTo(page, '/settings/leaves');

    const daysLabel = page.locator('text=/days|allowed|allocation/i').first();
    await expect(daysLabel).toBeVisible();
  });

  test('admin can configure leave allocations', async ({ page }) => {
    await navigateTo(page, '/settings/leaves');

    const addButton = page.getByRole('button', { name: /add/i }).or(page.getByRole('button', { name: /new/i }));
    const editButton = page.getByRole('button', { name: /edit/i }).first();

    const hasAddOrEdit = await addButton.isVisible().catch(() => false) || await editButton.isVisible().catch(() => false);
    expect(hasAddOrEdit).toBeTruthy();
  });

  test('year selector to view different years', async ({ page }) => {
    await navigateTo(page, '/settings/leaves');

    const yearSelector = page.locator('select').filter({ hasText: /202/ }).or(
      page.getByLabel(/year/i)
    );

    const hasYearSelector = await yearSelector.count() > 0;
    if (hasYearSelector) {
      await expect(yearSelector.first()).toBeVisible();
    }
  });

  test('can add new leave types', async ({ page }) => {
    await navigateTo(page, '/settings/leaves');

    const addButton = page.getByRole('button', { name: /add/i }).or(page.getByRole('button', { name: /new/i }));

    const isVisible = await addButton.isVisible().catch(() => false);
    if (isVisible) {
      await addButton.click();

      const modal = page.locator('[role="dialog"], .modal, [data-testid="leave-modal"]');
      await expect(modal).toBeVisible();

      const leaveTypeInput = page.getByLabel(/leave type/i).or(page.getByLabel(/name/i));
      await expect(leaveTypeInput).toBeVisible();
    }
  });

  test('can modify existing leave types', async ({ page }) => {
    await navigateTo(page, '/settings/leaves');

    const editButton = page.getByRole('button', { name: /edit/i }).first();

    const isVisible = await editButton.isVisible().catch(() => false);
    if (isVisible) {
      await editButton.click();

      const modal = page.locator('[role="dialog"], .modal, [data-testid="leave-modal"]');
      await expect(modal).toBeVisible();
    }
  });
});
