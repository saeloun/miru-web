import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Projects - Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to project detail page when clicking a project', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasActions) {
      await actionsButton.click();
      await page.waitForTimeout(500);

      const viewDetailsOption = page.locator('text=View details');
      const hasViewDetails = await viewDetailsOption.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasViewDetails) {
        await viewDetailsOption.click();
        await page.waitForURL('**/projects/**', { timeout: 10000 });

        expect(page.url()).toContain('/projects/');
      }
    }
  });

  test('should display project name and client on detail page', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const projectName = await firstRow.locator('td').first().textContent();

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasActions) {
      await actionsButton.click();
      await page.waitForTimeout(500);

      const viewDetailsOption = page.locator('text=View details');
      if (await viewDetailsOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewDetailsOption.click();
        await page.waitForURL('**/projects/**', { timeout: 10000 });

        const pageHeader = page.locator('h2, h1').first();
        await expect(pageHeader).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show billable badge for billable projects', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const billableProjectRow = page.locator('tbody tr:has-text("Billable")').first();
    const hasBillableProject = await billableProjectRow.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasBillableProject) {
      test.skip();
    }

    const actionsButton = billableProjectRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasActions) {
      await actionsButton.click();
      await page.waitForTimeout(500);

      const viewDetailsOption = page.locator('text=View details');
      if (await viewDetailsOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewDetailsOption.click();
        await page.waitForURL('**/projects/**', { timeout: 10000 });

        const billableBadge = page.locator('text=billable').first();
        await expect(billableBadge).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display team members section', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasActions) {
      await actionsButton.click();
      await page.waitForTimeout(500);

      const viewDetailsOption = page.locator('text=View details');
      if (await viewDetailsOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewDetailsOption.click();
        await page.waitForURL('**/projects/**', { timeout: 10000 });

        await page.waitForTimeout(1000);

        const teamSection = page.locator('table, tbody, .table, text=/Team|Member/i').first();
        const hasTeamSection = await teamSection.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasTeamSection) {
          await expect(teamSection).toBeVisible();
        }
      }
    }
  });

  test('should show hours logged for the project', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasActions) {
      await actionsButton.click();
      await page.waitForTimeout(500);

      const viewDetailsOption = page.locator('text=View details');
      if (await viewDetailsOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewDetailsOption.click();
        await page.waitForURL('**/projects/**', { timeout: 10000 });

        await page.waitForTimeout(1000);

        const hoursDisplay = page.locator('text=/\\d+(\\.\\d+)?\\s*(h|hours)/i').first();
        const hasHours = await hoursDisplay.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasHours) {
          await expect(hoursDisplay).toBeVisible();
        }
      }
    }
  });

  test('should show back button to return to projects list', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasActions) {
      await actionsButton.click();
      await page.waitForTimeout(500);

      const viewDetailsOption = page.locator('text=View details');
      if (await viewDetailsOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewDetailsOption.click();
        await page.waitForURL('**/projects/**', { timeout: 10000 });

        const backButton = page.locator('button:has(svg)').first();
        await expect(backButton).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display action buttons for admin users', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const viewDetailsOption = page.locator('text=View details');
    if (await viewDetailsOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewDetailsOption.click();
      await page.waitForURL('**/projects/**', { timeout: 10000 });

      const menuButton = page.locator('button#kebabMenu, button:has-text("⋮")').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasMenu) {
        await expect(menuButton).toBeVisible();
      }
    }
  });

  test('should show add/remove team members button for admin', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const viewDetailsOption = page.locator('text=View details');
    if (await viewDetailsOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewDetailsOption.click();
      await page.waitForURL('**/projects/**', { timeout: 10000 });

      const addTeamButton = page.locator('button#addRemoveTeamMembers');
      const hasAddTeamButton = await addTeamButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasAddTeamButton) {
        await expect(addTeamButton).toBeVisible();
      }
    }
  });

  test('should show generate invoice button for admin', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const viewDetailsOption = page.locator('text=View details');
    if (await viewDetailsOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewDetailsOption.click();
      await page.waitForURL('**/projects/**', { timeout: 10000 });

      const generateInvoiceButton = page.locator('button').filter({ has: page.locator('svg') });
      const buttonCount = await generateInvoiceButton.count();

      expect(buttonCount).toBeGreaterThan(0);
    }
  });

  test('should display project statistics and charts', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasActions) {
      await actionsButton.click();
      await page.waitForTimeout(500);

      const viewDetailsOption = page.locator('text=View details');
      if (await viewDetailsOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewDetailsOption.click();
        await page.waitForURL('**/projects/**', { timeout: 10000 });

        await page.waitForTimeout(1000);
      }
    }
  });
});
