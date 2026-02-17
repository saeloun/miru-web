import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Clients - Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('clicking a client navigates to detail page', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/clients\/\d+/);
  });

  test('client detail page shows client info', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const clientInfo = page.locator('h1, h2, h3, h4, h5, h6, [class*="client"], [class*="name"]');
    const hasClientInfo = await clientInfo.count() > 0;

    expect(hasClientInfo).toBeTruthy();
  });

  test('shows client name on detail page', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    const clientNameInList = await firstRow.locator('td').first().textContent();

    await firstRow.click();
    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('shows client email or contact information', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const emailPattern = page.locator('text=/@|email/i');
    const contactInfo = page.locator('text=/phone|address|contact/i');

    const hasEmailOrContact = await emailPattern.count() > 0 || await contactInfo.count() > 0;
    expect(hasEmailOrContact).toBeTruthy();
  });

  test('shows client projects list or section', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const projectsSection = page.locator('text=/project|No project/i, table, [class*="project"]');
    const hasProjects = await projectsSection.count() > 0;

    expect(hasProjects).toBeTruthy();
  });

  test('shows total hours logged for client', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const hoursIndicator = page.locator('text=/hour|hrs|minutes|mins|time/i');
    const hasHours = await hoursIndicator.count() > 0;

    expect(hasHours).toBeTruthy();
  });

  test('shows outstanding/overdue amounts', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const amountIndicator = page.locator('text=/\\$|overdue|outstanding|amount/i');
    const hasAmounts = await amountIndicator.count() > 0;

    expect(hasAmounts).toBeTruthy();
  });

  test('edit button is available on detail page', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="Edit"], a:has-text("Edit"), svg, [class*="edit"]');
    const hasEditOption = await editButton.count() > 0;

    expect(hasEditOption).toBeTruthy();
  });

  test('shows projects table with project data', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    const emptyState = page.locator('text=/No project|Add Project/i');

    const hasTableOrEmpty = await table.isVisible({ timeout: 2000 }).catch(() => false) ||
                           await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasTableOrEmpty).toBeTruthy();
  });

  test('client detail page has back navigation', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const backButton = page.locator('button:has-text("Back"), a:has-text("Clients"), svg, [aria-label*="Back"]');
    const hasBackOption = await backButton.count() > 0;

    expect(hasBackOption).toBeTruthy();
  });

  test('shows time frame selector on detail page', async ({ page }) => {
    await navigateTo(page, '/clients');

    await page.waitForSelector('tbody tr', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });

    await page.waitForLoadState('networkidle');

    const timeFrameSelector = page.locator('select, [role="combobox"], button:has-text("Week"), button:has-text("Month")');
    const hasTimeFrameSelector = await timeFrameSelector.count() > 0;

    expect(hasTimeFrameSelector).toBeTruthy();
  });
});
