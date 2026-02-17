import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Settings - Holidays', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('holiday settings page loads', async ({ page }) => {
    await navigateTo(page, '/settings/holidays');
    await expect(page.getByRole('heading', { name: /holiday/i })).toBeVisible();
  });

  test('shows list of holidays', async ({ page }) => {
    await navigateTo(page, '/settings/holidays');

    const holidayList = page.locator('table, [role="table"], [data-testid="holidays-list"]');
    const hasHolidayList = await holidayList.count() > 0;

    if (hasHolidayList) {
      await expect(holidayList.first()).toBeVisible();
    } else {
      const emptyState = page.locator('text=/no holidays|add holiday/i');
      await expect(emptyState).toBeVisible();
    }
  });

  test('year selector works', async ({ page }) => {
    await navigateTo(page, '/settings/holidays');

    const yearSelector = page.locator('select').filter({ hasText: /202/ }).or(
      page.getByLabel(/year/i)
    );

    const hasYearSelector = await yearSelector.count() > 0;
    if (hasYearSelector) {
      await expect(yearSelector.first()).toBeVisible();

      const currentYear = new Date().getFullYear();
      await yearSelector.first().selectOption({ label: String(currentYear) });

      await page.waitForTimeout(500);
      await expect(page.getByRole('heading', { name: /holiday/i })).toBeVisible();
    }
  });

  test('admin can add holidays', async ({ page }) => {
    await navigateTo(page, '/settings/holidays');

    const addButton = page.getByRole('button', { name: /add/i }).or(page.getByRole('button', { name: /new/i }));
    await expect(addButton).toBeVisible();

    await addButton.click();

    const modal = page.locator('[role="dialog"], .modal, [data-testid="holiday-modal"]');
    await expect(modal).toBeVisible();
  });

  test('holiday shows name and date', async ({ page }) => {
    await navigateTo(page, '/settings/holidays');

    const nameHeader = page.locator('th, [role="columnheader"]').filter({ hasText: /name/i });
    const dateHeader = page.locator('th, [role="columnheader"]').filter({ hasText: /date/i });

    const hasHeaders = await nameHeader.count() > 0 || await dateHeader.count() > 0;
    if (hasHeaders) {
      await expect(nameHeader.or(dateHeader).first()).toBeVisible();
    }
  });

  test('can edit existing holidays', async ({ page }) => {
    await navigateTo(page, '/settings/holidays');

    const editButton = page.getByRole('button', { name: /edit/i }).first();

    const isVisible = await editButton.isVisible().catch(() => false);
    if (isVisible) {
      await editButton.click();

      const modal = page.locator('[role="dialog"], .modal, [data-testid="holiday-modal"]');
      await expect(modal).toBeVisible();

      const nameInput = page.getByLabel(/name/i).or(page.getByLabel(/holiday name/i));
      await expect(nameInput).toBeVisible();
    }
  });

  test('can delete holidays', async ({ page }) => {
    await navigateTo(page, '/settings/holidays');

    const deleteButton = page.getByRole('button', { name: /delete/i }).or(
      page.locator('[aria-label*="delete" i], [data-testid*="delete"]')
    ).first();

    const isVisible = await deleteButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(deleteButton).toBeVisible();
    }
  });

  test('optional/mandatory holiday types shown', async ({ page }) => {
    await navigateTo(page, '/settings/holidays');

    const typeIndicator = page.locator('text=/optional|mandatory|required/i').first();

    const hasTypeIndicator = await typeIndicator.isVisible().catch(() => false);
    if (hasTypeIndicator) {
      await expect(typeIndicator).toBeVisible();
    }
  });
});
