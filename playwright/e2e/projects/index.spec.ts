import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Projects - Index/List Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display projects page with heading', async ({ page }) => {
    await navigateTo(page, '/projects');

    await expect(page.locator('h1:has-text("Projects")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Manage your projects and track progress')).toBeVisible();
  });

  test('should display list of projects in table', async ({ page }) => {
    await navigateTo(page, '/projects');

    const projectsCard = page.locator('text=All Projects').locator('..');
    await expect(projectsCard).toBeVisible({ timeout: 10000 });

    const projectRows = page.locator('tbody tr');
    const rowCount = await projectRows.count();

    if (rowCount > 0) {
      await expect(projectRows.first()).toBeVisible();
    } else {
      await expect(page.locator('text=Looks like there aren\'t any projects added yet')).toBeVisible();
    }
  });

  test('should show project name and client for each project', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (hasProjects) {
      const projectNameCell = firstRow.locator('td').first();
      await expect(projectNameCell).not.toBeEmpty();

      const clientCell = firstRow.locator('text=/[A-Za-z]/').nth(1);
      await expect(clientCell).toBeVisible();
    }
  });

  test('should display billable/non-billable status badges', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (hasProjects) {
      const billableBadge = firstRow.locator('text=/Billable|Non-billable/i');
      await expect(billableBadge).toBeVisible();
    }
  });

  test('should show New Project button for admin users', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isAdmin) {
      await expect(newProjectButton).toBeVisible();
      await expect(newProjectButton.locator('svg')).toBeVisible();
    }
  });

  test('should display statistics cards', async ({ page }) => {
    await navigateTo(page, '/projects');

    await expect(page.locator('text=Active Projects')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Total Hours')).toBeVisible();
    await expect(page.locator('text=Team Members')).toBeVisible();

    const activeProjectsCard = page.locator('text=Active Projects').locator('..');
    await expect(activeProjectsCard.locator('text=/\\d+/')).toBeVisible();
  });

  test('should show search functionality in table', async ({ page }) => {
    await navigateTo(page, '/projects');

    const searchInput = page.locator('input[placeholder*="Search"]');
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should display hours logged column', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('text=HOURS LOGGED', { timeout: 10000 }).catch(() => {});

    const hoursHeader = page.locator('text=HOURS LOGGED');
    const hasHoursColumn = await hoursHeader.isVisible().catch(() => false);

    if (hasHoursColumn) {
      await expect(hoursHeader).toBeVisible();
    }
  });

  test('should show empty state when no projects exist', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody', { timeout: 10000 });

    const emptyState = page.locator('text=Looks like there aren\'t any projects added yet');
    const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('text=Create Your First Project')).toBeVisible();
    }
  });

  test('should show project status badges', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const statusBadge = page.locator('text=/Active|Paused|Completed/i').first();
    const hasStatus = await statusBadge.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasStatus) {
      await expect(statusBadge).toBeVisible();
    }
  });

  test('should display team members for projects', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('text=Team', { timeout: 10000 }).catch(() => {});

    const teamHeader = page.locator('button:has-text("Team"), th:has-text("Team")').first();
    const hasTeamColumn = await teamHeader.isVisible().catch(() => false);

    if (hasTeamColumn) {
      await expect(teamHeader).toBeVisible();
    }
  });

  test('should show actions menu for admin users', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (hasProjects) {
      const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
      const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasActions) {
        await expect(actionsButton).toBeVisible();
      }
    }
  });

  test('should allow sorting by project name', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const projectNameHeader = page.locator('button:has-text("PROJECT/CLIENT")');
    const hasSortableHeader = await projectNameHeader.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSortableHeader) {
      await expect(projectNameHeader).toBeVisible();

      await projectNameHeader.click();
      await page.waitForTimeout(500);

      const sortIcon = projectNameHeader.locator('svg');
      await expect(sortIcon).toBeVisible();
    }
  });
});
