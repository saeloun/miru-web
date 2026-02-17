import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Team - Inviting Members', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/team');
  });

  test('new user button opens invitation form', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    const modalHeading = page.locator('h6:has-text("Create New User")');
    await expect(modalHeading).toBeVisible();
  });

  test('invitation form has all required fields', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('label:has-text("Role")')).toBeVisible();
  });

  test('role options are available', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    await expect(page.locator('label:has-text("Admin")')).toBeVisible();
    await expect(page.locator('label:has-text("Employee")')).toBeVisible();
    await expect(page.locator('label:has-text("Bookkeeper")')).toBeVisible();
    await expect(page.locator('label:has-text("Client")')).toBeVisible();
  });

  test('submit button is disabled when form is empty', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    const submitButton = page.locator('button[type="submit"]:has-text("SEND INVITE")');
    await expect(submitButton).toBeDisabled();
  });

  test('form validation - email is required', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', '');
    await page.locator('input[name="email"]').blur();

    const submitButton = page.locator('button[type="submit"]:has-text("SEND INVITE")');
    await expect(submitButton).toBeDisabled();
  });

  test('form validation - email must be valid format', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.locator('input[name="email"]').blur();

    const errorMessage = page.locator('text=Invalid email ID');
    await expect(errorMessage).toBeVisible();
  });

  test('form validation - first name is required', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    await page.fill('input[name="firstName"]', '');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.locator('input[name="firstName"]').blur();

    const submitButton = page.locator('button[type="submit"]:has-text("SEND INVITE")');
    await expect(submitButton).toBeDisabled();
  });

  test('form validation - last name is required', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', '');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.locator('input[name="lastName"]').blur();

    const submitButton = page.locator('button[type="submit"]:has-text("SEND INVITE")');
    await expect(submitButton).toBeDisabled();
  });

  test('form validation - names must contain only letters', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    await page.fill('input[name="firstName"]', 'Test123');
    await page.locator('input[name="firstName"]').blur();

    const errorMessage = page.locator('text=First Name must contain only letters');
    await expect(errorMessage).toBeVisible();
  });

  test('cancel button closes form', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    const modalHeading = page.locator('h6:has-text("Create New User")');
    await expect(modalHeading).toBeVisible();

    const closeButton = page.locator('button[style="ternary"]').first();
    await closeButton.click();

    await expect(modalHeading).not.toBeVisible();
  });

  test('can select different roles', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    const adminRadio = page.locator('input#admin');
    await adminRadio.click();
    await expect(adminRadio).toBeChecked();

    const employeeRadio = page.locator('input#employee');
    await employeeRadio.click();
    await expect(employeeRadio).toBeChecked();
    await expect(adminRadio).not.toBeChecked();
  });

  test('employee role is selected by default', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    const employeeRadio = page.locator('input#employee');
    await expect(employeeRadio).toBeChecked();
  });

  test('submit button is enabled with valid input', async ({ page }) => {
    const newUserButton = page.locator('button:has-text("New User")');
    await newUserButton.click();

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);

    const submitButton = page.locator('button[type="submit"]:has-text("SEND INVITE")');
    await expect(submitButton).toBeEnabled();
  });
});
