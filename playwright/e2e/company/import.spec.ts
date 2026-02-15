import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Company - Import', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('import page loads under settings', async ({ page }) => {
    await navigateTo(page, '/settings/import');
    await expect(page.getByRole('heading', { name: /import/i })).toBeVisible();
  });

  test('shows import options', async ({ page }) => {
    await navigateTo(page, '/settings/import');

    const importOption = page.locator('text=/csv|excel|file|upload/i').first();
    await expect(importOption).toBeVisible();
  });

  test('file upload area/button is visible', async ({ page }) => {
    await navigateTo(page, '/settings/import');

    const uploadButton = page.getByRole('button', { name: /upload|choose file|select file/i }).or(
      page.locator('input[type="file"]')
    );

    await expect(uploadButton.first()).toBeVisible();
  });

  test('import instructions or template download available', async ({ page }) => {
    await navigateTo(page, '/settings/import');

    const instructions = page.locator('text=/instruction|how to|guide|template|download/i').first();
    const hasInstructions = await instructions.isVisible().catch(() => false);

    if (hasInstructions) {
      await expect(instructions).toBeVisible();
    }

    const downloadLink = page.locator('a').filter({ hasText: /download|template/i }).first();
    const hasDownloadLink = await downloadLink.isVisible().catch(() => false);

    if (hasDownloadLink) {
      await expect(downloadLink).toBeVisible();
    }

    expect(hasInstructions || hasDownloadLink).toBeTruthy();
  });
});
