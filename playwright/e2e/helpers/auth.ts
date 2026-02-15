import { type Page, expect } from '@playwright/test';

export const TEST_USER = {
  email: 'vipul@saeloun.com',
  password: 'password',
};

export async function login(page: Page): Promise<void> {
  await page.goto('/user/sign_in');
  const emailInput = page.getByRole('textbox', { name: /email/i });
  const passwordInput = page.getByRole('textbox', { name: /password/i });

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page).not.toHaveURL(/\/user\/sign_in/, { timeout: 15000 });
  await page.locator('a:has-text("Dashboard"):visible').first().waitFor({ state: 'visible', timeout: 10000 });
}

export async function loginIfNeeded(page: Page): Promise<void> {
  const emailInput = page.getByRole('textbox', { name: /email/i });
  if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await emailInput.fill(TEST_USER.email);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_USER.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).not.toHaveURL(/\/user\/sign_in/, { timeout: 15000 });
  }
}

export async function expectLoggedIn(page: Page): Promise<void> {
  await expect(page.getByRole('textbox', { name: /email/i })).not.toBeVisible({ timeout: 5000 });
}

export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await loginIfNeeded(page);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}
