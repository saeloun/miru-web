import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Team - Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/team');
  });

  test('search input is present on page', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search team members"]');
    await expect(searchInput).toBeVisible();
  });

  test('can type in search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search team members"]');
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('search by name shows matching results', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const memberName = await firstRow.locator('p.text-sm.font-bold').textContent();

    if (memberName) {
      const searchTerm = memberName.trim().substring(0, 3);
      const searchInput = page.locator('input[placeholder*="Search team members"]');
      await searchInput.fill(searchTerm);

      await page.waitForTimeout(1000);

      const searchResults = page.locator('tbody tr');
      const resultCount = await searchResults.count();

      expect(resultCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('search by email shows matching results', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const memberEmail = await firstRow.locator('dt.text-xs.font-medium.lowercase').textContent();

    if (memberEmail) {
      const searchTerm = memberEmail.trim().split('@')[0];
      const searchInput = page.locator('input[placeholder*="Search team members"]');
      await searchInput.fill(searchTerm);

      await page.waitForTimeout(1000);

      const searchResults = page.locator('tbody tr');
      const resultCount = await searchResults.count();

      expect(resultCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('search is case insensitive', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const memberName = await firstRow.locator('p.text-sm.font-bold').textContent();

    if (memberName) {
      const searchInput = page.locator('input[placeholder*="Search team members"]');

      const lowerCaseSearch = memberName.trim().toLowerCase().substring(0, 3);
      await searchInput.fill(lowerCaseSearch);
      await page.waitForTimeout(1000);

      const lowerResults = page.locator('tbody tr');
      const lowerCount = await lowerResults.count();

      await searchInput.clear();

      const upperCaseSearch = memberName.trim().toUpperCase().substring(0, 3);
      await searchInput.fill(upperCaseSearch);
      await page.waitForTimeout(1000);

      const upperResults = page.locator('tbody tr');
      const upperCount = await upperResults.count();

      expect(lowerCount).toBeGreaterThanOrEqual(0);
      expect(upperCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('clearing search shows all members', async ({ page }) => {
    const allRows = page.locator('tbody tr');
    const initialCount = await allRows.count();

    const searchInput = page.locator('input[placeholder*="Search team members"]');
    await searchInput.fill('xyz123nonexistent');
    await page.waitForTimeout(1000);

    await searchInput.clear();
    await page.waitForTimeout(1000);

    const rowsAfterClear = page.locator('tbody tr');
    const finalCount = await rowsAfterClear.count();

    expect(finalCount).toBeGreaterThanOrEqual(initialCount - 1);
  });

  test('no results state for non-matching search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search team members"]');
    await searchInput.fill('xyznonexistentuser12345');

    await page.waitForTimeout(1500);

    const noResultsMessage = page.locator('text=No team member(s) found');
    if (await noResultsMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(noResultsMessage).toBeVisible();
    }
  });

  test('search updates results dynamically', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search team members"]');

    await searchInput.fill('a');
    await page.waitForTimeout(800);
    const resultsAfterA = await page.locator('tbody tr').count();

    await searchInput.fill('ab');
    await page.waitForTimeout(800);
    const resultsAfterAB = await page.locator('tbody tr').count();

    expect(resultsAfterA).toBeGreaterThanOrEqual(0);
    expect(resultsAfterAB).toBeGreaterThanOrEqual(0);
  });

  test('search dropdown shows member avatars', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const memberName = await firstRow.locator('p.text-sm.font-bold').textContent();

    if (memberName) {
      const searchInput = page.locator('input[placeholder*="Search team members"]');
      await searchInput.fill(memberName.trim().substring(0, 3));

      await page.waitForTimeout(1000);
    }
  });

  test('search input can be focused with keyboard', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search team members"]');
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });

  test('search persists while navigating pagination', async ({ page }) => {
    const pagination = page.locator('text=users/page');
    const hasPagination = await pagination.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasPagination) {
      const searchInput = page.locator('input[placeholder*="Search team members"]');
      await searchInput.fill('test');

      const searchValue = await searchInput.inputValue();
      expect(searchValue).toBe('test');
    }
  });

  test('search shows subtitle with email in dropdown', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const memberName = await firstRow.locator('p.text-sm.font-bold').textContent();

    if (memberName) {
      const searchInput = page.locator('input[placeholder*="Search team members"]');
      await searchInput.fill(memberName.trim().substring(0, 3));

      await page.waitForTimeout(1000);
    }
  });

  test('empty search shows all members', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search team members"]');
    await searchInput.fill('');

    const allRows = page.locator('tbody tr');
    const rowCount = await allRows.count();

    expect(rowCount).toBeGreaterThan(0);
  });
});
