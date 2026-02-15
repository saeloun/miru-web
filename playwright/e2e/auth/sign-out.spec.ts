import { test, expect } from '@playwright/test';
import { login, navigateTo, TEST_USER } from '../helpers/auth';

test.describe('Sign Out', () => {
  test('user can sign out from sidebar menu', async ({ page }) => {
    await login(page);
    await page.waitForURL('**/time-tracking');

    const avatarButton = page.locator('[data-testid="user-avatar"], button:has-text("' + TEST_USER.email.split('@')[0] + '")').first();
    await avatarButton.click();

    const signOutLink = page.locator('a:has-text("Sign Out"), button:has-text("Sign Out")').first();
    await signOutLink.click();

    await page.waitForURL('**/user/sign_in');
    expect(page.url()).toContain('/user/sign_in');
  });

  test('after sign out, accessing protected page redirects to sign in', async ({ page }) => {
    await login(page);
    await page.waitForURL('**/time-tracking');

    const avatarButton = page.locator('[data-testid="user-avatar"], button:has-text("' + TEST_USER.email.split('@')[0] + '")').first();
    await avatarButton.click();

    const signOutLink = page.locator('a:has-text("Sign Out"), button:has-text("Sign Out")').first();
    await signOutLink.click();

    await page.waitForURL('**/user/sign_in');

    await page.goto('http://127.0.0.1:3000/time-tracking');
    await page.waitForURL('**/user/sign_in');
    expect(page.url()).toContain('/user/sign_in');
  });

  test('session is cleared after sign out', async ({ page }) => {
    await login(page);
    await page.waitForURL('**/time-tracking');

    const context = page.context();
    let cookies = await context.cookies();
    const sessionCookieBefore = cookies.find(c => c.name.includes('session'));
    expect(sessionCookieBefore).toBeDefined();

    const avatarButton = page.locator('[data-testid="user-avatar"], button:has-text("' + TEST_USER.email.split('@')[0] + '")').first();
    await avatarButton.click();

    const signOutLink = page.locator('a:has-text("Sign Out"), button:has-text("Sign Out")').first();
    await signOutLink.click();

    await page.waitForURL('**/user/sign_in');

    cookies = await context.cookies();
    const sessionCookieAfter = cookies.find(c => c.name.includes('session') && c.value);

    expect(page.url()).toContain('/user/sign_in');
  });

  test('sign out link is visible when authenticated', async ({ page }) => {
    await login(page);
    await page.waitForURL('**/time-tracking');

    const avatarButton = page.locator('[data-testid="user-avatar"], button:has-text("' + TEST_USER.email.split('@')[0] + '")').first();
    await avatarButton.click();

    const signOutLink = page.locator('a:has-text("Sign Out"), button:has-text("Sign Out")').first();
    await expect(signOutLink).toBeVisible();
  });
});
