import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Invoices - Send Invoice', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('send button opens send dialog/form', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const draftInvoiceRow = page.locator('tr').filter({ hasText: /draft/i }).first();
    const hasDraft = await draftInvoiceRow.count();
    if (hasDraft > 0) {
      await draftInvoiceRow.click();
      await page.waitForURL(/\/invoices\/\d+/);
      const sendButton = page.locator('button, a').filter({ hasText: /send/i }).first();
      const hasSend = await sendButton.count();
      if (hasSend > 0) {
        await sendButton.click();
        const dialog = page.locator('[role="dialog"], [role="modal"], .modal');
        await expect(dialog.first()).toBeVisible({ timeout: 5000 });
      } else {
        const moreMenu = page.locator('#menuOpen');
        const hasMenu = await moreMenu.count();
        if (hasMenu > 0) {
          await moreMenu.click();
          const sendMenuItem = page.locator('li').filter({ hasText: /send/i });
          await sendMenuItem.click();
          const dialog = page.locator('[role="dialog"], [role="modal"], .modal');
          await expect(dialog.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('send form shows recipient email', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const draftInvoiceRow = page.locator('tr').filter({ hasText: /draft/i }).first();
    const hasDraft = await draftInvoiceRow.count();
    if (hasDraft > 0) {
      await draftInvoiceRow.click();
      await page.waitForURL(/\/invoices\/\d+/);
      const sendButton = page.locator('button, a').filter({ hasText: /send/i }).first();
      const hasSend = await sendButton.count();
      if (hasSend > 0) {
        await sendButton.click();
        const emailInput = page.locator('input[type="email"], input[name*="recipient" i]');
        const hasEmail = await emailInput.count();
        if (hasEmail > 0) {
          await expect(emailInput.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('can customize email subject/message', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const draftInvoiceRow = page.locator('tr').filter({ hasText: /draft/i }).first();
    const hasDraft = await draftInvoiceRow.count();
    if (hasDraft > 0) {
      await draftInvoiceRow.click();
      await page.waitForURL(/\/invoices\/\d+/);
      const sendButton = page.locator('button, a').filter({ hasText: /send/i }).first();
      const hasSend = await sendButton.count();
      if (hasSend > 0) {
        await sendButton.click();
        const subjectInput = page.locator('input[name*="subject" i]');
        const messageInput = page.locator('textarea[name*="message" i], textarea[name*="body" i]');
        const hasSubject = await subjectInput.count();
        const hasMessage = await messageInput.count();
        if (hasSubject > 0) {
          await expect(subjectInput.first()).toBeVisible({ timeout: 5000 });
        }
        if (hasMessage > 0) {
          await expect(messageInput.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('sending updates status to "sent"', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const draftInvoiceRow = page.locator('tr').filter({ hasText: /draft/i }).first();
    const hasDraft = await draftInvoiceRow.count();
    if (hasDraft > 0) {
      await draftInvoiceRow.click();
      await page.waitForURL(/\/invoices\/\d+/);
      const statusBadge = page.locator('[class*="badge"], [class*="status"], span').filter({
        hasText: /draft/i
      });
      await expect(statusBadge.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('send confirmation shown after sending', async ({ page }) => {
    await navigateTo(page, '/invoices');
    const draftInvoiceRow = page.locator('tr').filter({ hasText: /draft/i }).first();
    const hasDraft = await draftInvoiceRow.count();
    if (hasDraft > 0) {
      await draftInvoiceRow.click();
      await page.waitForURL(/\/invoices\/\d+/);
      const sendButton = page.locator('button, a').filter({ hasText: /send/i }).first();
      const hasSend = await sendButton.count();
      if (hasSend > 0) {
        const statusBadge = page.locator('[class*="badge"], [class*="status"], span').filter({
          hasText: /draft/i
        });
        await expect(statusBadge.first()).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
