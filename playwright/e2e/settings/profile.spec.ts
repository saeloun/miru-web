import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Settings - Profile', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('profile page loads with heading', async ({ page }) => {
    await navigateTo(page, '/settings/profile');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });

  test('shows user first name, last name, email', async ({ page }) => {
    await navigateTo(page, '/settings/profile');

    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('shows user avatar/profile picture', async ({ page }) => {
    await navigateTo(page, '/settings/profile');

    const avatar = page.locator('img[alt*="avatar" i], img[alt*="profile" i], [data-testid="profile-avatar"]').first();
    await expect(avatar).toBeVisible();
  });

  test('edit button available', async ({ page }) => {
    await navigateTo(page, '/settings/profile');

    const editButton = page.getByRole('button', { name: /edit/i });
    await expect(editButton).toBeVisible();
  });

  test('can update first name and last name', async ({ page }) => {
    await navigateTo(page, '/settings/profile');

    const editButton = page.getByRole('button', { name: /edit/i });
    await editButton.click();

    const firstNameInput = page.getByLabel(/first name/i);
    const lastNameInput = page.getByLabel(/last name/i);

    await firstNameInput.fill('UpdatedFirst');
    await lastNameInput.fill('UpdatedLast');

    await expect(firstNameInput).toHaveValue('UpdatedFirst');
    await expect(lastNameInput).toHaveValue('UpdatedLast');
  });

  test('save persists changes', async ({ page }) => {
    await navigateTo(page, '/settings/profile');

    const editButton = page.getByRole('button', { name: /edit/i });
    await editButton.click();

    const firstNameInput = page.getByLabel(/first name/i);
    const originalFirstName = await firstNameInput.inputValue();

    const testFirstName = `Test${Date.now()}`;
    await firstNameInput.fill(testFirstName);

    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();

    await page.waitForTimeout(1000);

    await page.reload();
    await expect(page.getByLabel(/first name/i)).toHaveValue(testFirstName);

    await editButton.click();
    await firstNameInput.fill(originalFirstName);
    await saveButton.click();
  });

  test('email is displayed', async ({ page }) => {
    await navigateTo(page, '/settings/profile');

    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();

    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBeTruthy();
    expect(emailValue).toContain('@');
  });
});
