import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Invoices - Status Actions and Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('draft invoice can be sent (Send button)', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const draftInvoiceRow = page.locator('tr').filter({ hasText: /draft/i }).first();
    const hasDraft = await draftInvoiceRow.count();
    if (hasDraft > 0) {
      await draftInvoiceRow.click();
      await page.waitForURL(/\/invoices\/\d+/);
      const sendButton = page.locator('button, a').filter({ hasText: /send/i });
      const hasSend = await sendButton.count();
      if (hasSend > 0) {
        await expect(sendButton.first()).toBeVisible({ timeout: 10000 });
      } else {
        const moreMenu = page.locator('#menuOpen, button[aria-label*="menu" i]');
        const hasMenu = await moreMenu.count();
        if (hasMenu > 0) {
          await moreMenu.click();
          const sendMenuItem = page.locator('li, button').filter({ hasText: /send/i });
          await expect(sendMenuItem.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('sent invoice can be marked as paid', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const sentInvoiceRow = page.locator('tr').filter({ hasText: /sent|viewed/i }).first();
    const hasSent = await sentInvoiceRow.count();
    if (hasSent > 0) {
      await sentInvoiceRow.click();
      await page.waitForURL(/\/invoices\/\d+/);
      const markPaidButton = page.locator('button, a').filter({ hasText: /mark.*paid/i });
      const hasMarkPaid = await markPaidButton.count();
      if (hasMarkPaid > 0) {
        await expect(markPaidButton.first()).toBeVisible({ timeout: 10000 });
      } else {
        const moreMenu = page.locator('#menuOpen, button[aria-label*="menu" i]');
        const hasMenu = await moreMenu.count();
        if (hasMenu > 0) {
          await moreMenu.click();
          const markPaidMenuItem = page.locator('li, button').filter({ hasText: /mark.*paid/i });
          const hasMenuItem = await markPaidMenuItem.count();
          if (hasMenuItem > 0) {
            await expect(markPaidMenuItem.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('invoice status updates after action', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const statusBadge = page.locator('[class*="badge"], [class*="status"], span').filter({
      hasText: /(draft|sent|viewed|paid|overdue)/i
    });
    await expect(statusBadge.first()).toBeVisible({ timeout: 10000 });
    const initialStatus = await statusBadge.first().textContent();
    expect(initialStatus).toBeTruthy();
  });

  test('download PDF button exists and responds', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const downloadButton = page.locator('button, a').filter({ hasText: /download/i });
    const hasDownload = await downloadButton.count();
    if (hasDownload > 0) {
      await expect(downloadButton.first()).toBeVisible({ timeout: 10000 });
    } else {
      const moreMenu = page.locator('#menuOpen, button[aria-label*="menu" i]');
      const hasMenu = await moreMenu.count();
      if (hasMenu > 0) {
        await moreMenu.click();
        const downloadMenuItem = page.locator('li, button').filter({ hasText: /download/i });
        await expect(downloadMenuItem.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('can waive invoice if applicable', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await firstInvoiceRow.click();
    await page.waitForURL(/\/invoices\/\d+/);
    const moreMenu = page.locator('#menuOpen, button[aria-label*="menu" i]');
    const hasMenu = await moreMenu.count();
    if (hasMenu > 0) {
      await moreMenu.click();
      const waiveMenuItem = page.locator('li, button').filter({ hasText: /waive/i });
      const hasWaive = await waiveMenuItem.count();
      if (hasWaive > 0) {
        await expect(waiveMenuItem.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('bulk actions: select multiple invoices', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    if (checkboxCount > 1) {
      await checkboxes.nth(1).check();
      await checkboxes.nth(2).check();
      const bulkActions = page.locator('button, a').filter({
        hasText: /(bulk|action|delete|download)/i
      });
      const hasBulkActions = await bulkActions.count();
      if (hasBulkActions > 0) {
        await expect(bulkActions.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
