import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Reports - Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/reports');
  });

  test('reports page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible();
    await expect(page.getByText('Generate insights and analytics from your business data')).toBeVisible();
  });

  test('displays stats cards with metrics', async ({ page }) => {
    await expect(page.getByText('Available Reports')).toBeVisible();
    await expect(page.getByText('Time Reports')).toBeVisible();
    await expect(page.getByText('Financial Reports')).toBeVisible();
    await expect(page.getByText('Recently Viewed')).toBeVisible();
  });

  test('category tabs are visible and functional', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'All Reports' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Time' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Financial' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Client' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Team' })).toBeVisible();
  });

  test('time entry report card exists', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Time Entry Report' })).toBeVisible();
    await expect(page.getByText('A comprehensive summary of time entries added by your team members')).toBeVisible();
  });

  test('revenue by client report card exists', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Revenue by Client' })).toBeVisible();
    await expect(page.getByText('Revenue breakdown by client with trends and comparisons')).toBeVisible();
  });

  test('outstanding and overdue invoices report card exists', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Outstanding & Overdue Invoices' })).toBeVisible();
    await expect(page.getByText('Detailed overview of outstanding and overdue invoices across all clients')).toBeVisible();
  });

  test('can filter reports by category', async ({ page }) => {
    await page.getByRole('tab', { name: 'Financial' }).click();
    await expect(page.getByRole('heading', { name: 'Revenue by Client' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Outstanding & Overdue Invoices' })).toBeVisible();

    await page.getByRole('tab', { name: 'Time' }).click();
    await expect(page.getByRole('heading', { name: 'Time Entry Report' })).toBeVisible();
  });

  test('quick actions section is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate Weekly Timesheet/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View Overdue Invoices/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Monthly Revenue Report/i })).toBeVisible();
  });

  test('schedule reports button exists', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Schedule Reports/i })).toBeVisible();
  });

  test('coming soon section shows unavailable reports', async ({ page }) => {
    const comingSoonHeading = page.getByRole('heading', { name: 'Coming Soon', exact: true });
    if (await comingSoonHeading.isVisible()) {
      await expect(page.getByText('Coming Soon').first()).toBeVisible();
    }
  });

  test('can navigate to time entry report', async ({ page }) => {
    await page.getByRole('heading', { name: 'Time Entry Report' }).click();
    await page.waitForURL('**/reports/time-entry');
    await expect(page).toHaveURL(/\/reports\/time-entry/);
  });

  test('can navigate to revenue report via quick action', async ({ page }) => {
    await page.getByRole('button', { name: /Monthly Revenue Report/i }).click();
    await page.waitForURL('**/reports/revenue-by-client');
    await expect(page).toHaveURL(/\/reports\/revenue-by-client/);
  });
});
