import { test, expect } from '@playwright/test';
import { login, navigateTo, TEST_USER } from '../helpers/auth';

test.describe('Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/');
  });

  test('dashboard loads successfully after login', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toMatch(/\/$|\/time-tracking/);

    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('dashboard displays page title or heading', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const headingText = await heading.textContent();
    expect(headingText).toBeTruthy();
    expect(headingText?.length).toBeGreaterThan(0);
  });

  test('shows revenue summary box', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const revenueBox = page.locator('text=/revenue/i, [data-testid*="revenue"], .revenue').first();
    const revenueCard = page.locator('div:has-text("Revenue"), div:has-text("Total Revenue")').first();

    const revenueBoxVisible = await revenueBox.isVisible({ timeout: 5000 }).catch(() => false);
    const revenueCardVisible = await revenueCard.isVisible({ timeout: 5000 }).catch(() => false);

    expect(revenueBoxVisible || revenueCardVisible).toBeTruthy();
  });

  test('shows outstanding invoices summary box', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const outstandingBox = page.locator('text=/outstanding/i, [data-testid*="outstanding"]').first();
    const outstandingCard = page.locator('div:has-text("Outstanding"), div:has-text("Outstanding Invoices")').first();

    const outstandingBoxVisible = await outstandingBox.isVisible({ timeout: 5000 }).catch(() => false);
    const outstandingCardVisible = await outstandingCard.isVisible({ timeout: 5000 }).catch(() => false);

    expect(outstandingBoxVisible || outstandingCardVisible).toBeTruthy();
  });

  test('shows overdue invoices summary box', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const overdueBox = page.locator('text=/overdue/i, [data-testid*="overdue"]').first();
    const overdueCard = page.locator('div:has-text("Overdue"), div:has-text("Overdue Invoices")').first();

    const overdueBoxVisible = await overdueBox.isVisible({ timeout: 5000 }).catch(() => false);
    const overdueCardVisible = await overdueCard.isVisible({ timeout: 5000 }).catch(() => false);

    expect(overdueBoxVisible || overdueCardVisible).toBeTruthy();
  });

  test('shows recent activity or entries section', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const recentActivity = page.locator('text=/recent|activity|entries|latest/i').first();
    const activitySection = page.locator('[data-testid*="recent"], [data-testid*="activity"]').first();

    const activityVisible = await recentActivity.isVisible({ timeout: 5000 }).catch(() => false);
    const sectionVisible = await activitySection.isVisible({ timeout: 5000 }).catch(() => false);

    expect(activityVisible || sectionVisible).toBeTruthy();
  });

  test('dashboard cards or widgets are visible', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const cards = page.locator('div[class*="card"], div[class*="widget"], div[class*="panel"], div[class*="box"]');
    const cardCount = await cards.count();

    expect(cardCount).toBeGreaterThan(0);
  });

  test('date range or filter controls exist', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const dateFilter = page.locator('input[type="date"], select:has-text("Month"), select:has-text("Year"), button:has-text("Filter")').first();
    const dateRangeButton = page.locator('button:has-text("This Month"), button:has-text("This Week"), button:has-text("Today")').first();
    const filterButton = page.locator('[data-testid*="filter"], [aria-label*="filter"]').first();

    const dateFilterVisible = await dateFilter.isVisible({ timeout: 3000 }).catch(() => false);
    const dateRangeVisible = await dateRangeButton.isVisible({ timeout: 3000 }).catch(() => false);
    const filterVisible = await filterButton.isVisible({ timeout: 3000 }).catch(() => false);

    expect(dateFilterVisible || dateRangeVisible || filterVisible).toBeTruthy();
  });

  test('dashboard content loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.waitForLoadState('domcontentloaded');

    const mainContent = page.locator('main, [role="main"], .main-content').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(15000);
  });

  test('dashboard shows data or empty state', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const dataContent = page.locator('text=/revenue|outstanding|overdue|recent/i').first();
    const emptyState = page.locator('text=/no data|empty|no results/i').first();

    const hasData = await dataContent.isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasData || hasEmptyState).toBeTruthy();
  });

  test('dashboard is responsive to window resize', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    const mobileContent = page.locator('main, [role="main"]').first();
    await expect(mobileContent).toBeVisible({ timeout: 5000 });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const desktopContent = page.locator('main, [role="main"]').first();
    await expect(desktopContent).toBeVisible({ timeout: 5000 });
  });

  test('dashboard navigation breadcrumb or title is visible', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const breadcrumb = page.locator('nav[aria-label*="breadcrumb"], .breadcrumb').first();
    const pageTitle = page.locator('h1, h2, [data-testid*="page-title"]').first();

    const breadcrumbVisible = await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false);
    const titleVisible = await pageTitle.isVisible({ timeout: 3000 }).catch(() => false);

    expect(breadcrumbVisible || titleVisible).toBeTruthy();
  });
});
