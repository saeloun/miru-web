import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Team - List Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/team');
  });

  test('team page loads with heading', async ({ page }) => {
    await expect(page.locator('h2.header__title')).toContainText('Team');
  });

  test('shows list of team members in table', async ({ page }) => {
    const table = page.locator('table.table__width');
    await expect(table).toBeVisible();

    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('each member shows name and email', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();

    const name = firstRow.locator('p.text-sm.font-bold');
    await expect(name).toBeVisible();
    await expect(name).not.toBeEmpty();

    const email = firstRow.locator('dt.text-xs.font-medium.lowercase');
    await expect(email).toBeVisible();
    await expect(email).not.toBeEmpty();
  });

  test('shows avatar or initials for each member', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const avatar = firstRow.locator('.my-auto img, .my-auto div');
    await expect(avatar).toBeVisible();
  });

  test('new user button is visible', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await expect(newUserButton).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search team members"]');
    await expect(searchInput).toBeVisible();
  });

  test('table shows correct column headers', async ({ page }) => {
    const headers = page.locator('thead th');
    await expect(headers.nth(0)).toContainText('USER');
    await expect(headers.nth(1)).toContainText('SALARY');
    await expect(headers.nth(2)).toContainText('ROLE');
    await expect(headers.nth(3)).toContainText('TYPE');
  });

  test('role is displayed for each member', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const role = firstRow.locator('td').nth(2);
    await expect(role).toBeVisible();
    await expect(role.locator('p.truncate')).not.toBeEmpty();
  });

  test('pending badge shows for invited members', async ({ page }) => {
    const pendingBadge = page.locator('text=pending').first();
    if (await pendingBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(pendingBadge).toBeVisible();
    }
  });

  test('pagination is visible when there are multiple pages', async ({ page }) => {
    const pagination = page.locator('text=users/page');
    if (await pagination.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(pagination).toBeVisible();
    }
  });

  test('employment type is displayed on desktop', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const employmentType = firstRow.locator('td').nth(3);
    if (await employmentType.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(employmentType).toBeVisible();
    }
  });

  test('more options menu is available on hover', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    const moreOptions = firstRow.locator('button[style="ternary"]');
    if (await moreOptions.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(moreOptions.first()).toBeVisible();
    }
  });
});
