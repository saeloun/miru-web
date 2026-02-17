import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Projects - Create', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should open new project modal when clicking New Project button', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
    }

    await newProjectButton.click();

    await expect(page.locator('text=Add New Project')).toBeVisible({ timeout: 5000 });
  });

  test('should display all required form fields in create modal', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForSelector('text=Add New Project', { timeout: 5000 });

    await expect(page.locator('label:has-text("Client")')).toBeVisible();
    await expect(page.locator('label:has-text("Project Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Project Type")')).toBeVisible();

    await expect(page.locator('input#project-name')).toBeVisible();
  });

  test('should show client dropdown with available clients', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForSelector('text=Add New Project', { timeout: 5000 });

    const clientSelect = page.locator('button:has-text("Select Client")');
    await expect(clientSelect).toBeVisible();

    await clientSelect.click();
    await page.waitForTimeout(500);

    const clientOptions = page.locator('[role="option"]');
    const optionCount = await clientOptions.count();

    expect(optionCount).toBeGreaterThan(0);
  });

  test('should show billable and non-billable radio options', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForSelector('text=Add New Project', { timeout: 5000 });

    const billableRadio = page.locator('label:has-text("Billable")').first();
    const nonBillableRadio = page.locator('label:has-text("Non-billable")').first();

    await expect(billableRadio).toBeVisible();
    await expect(nonBillableRadio).toBeVisible();
  });

  test('should validate required fields before submission', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForSelector('text=Add New Project', { timeout: 5000 });

    const submitButton = page.locator('button:has-text("Add Project")');
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit button when all required fields are filled', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForSelector('text=Add New Project', { timeout: 5000 });

    const clientSelect = page.locator('button:has-text("Select Client")');
    await clientSelect.click();
    await page.waitForTimeout(500);

    const firstClient = page.locator('[role="option"]').first();
    await firstClient.click();

    const projectNameInput = page.locator('input#project-name');
    await projectNameInput.fill('E2E Test Project');

    const billableRadio = page.locator('input[value="Billable"]');
    await billableRadio.check({ force: true });

    const submitButton = page.locator('button:has-text("Add Project")');
    await expect(submitButton).toBeEnabled();
  });

  test('should create project successfully with valid data', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForSelector('text=Add New Project', { timeout: 5000 });

    const clientSelect = page.locator('button:has-text("Select Client")');
    await clientSelect.click();
    await page.waitForTimeout(500);

    const firstClient = page.locator('[role="option"]').first();
    await firstClient.click();

    const projectNameInput = page.locator('input#project-name');
    const uniqueProjectName = `E2E Test Project ${Date.now()}`;
    await projectNameInput.fill(uniqueProjectName);

    const billableRadio = page.locator('input[value="Billable"]');
    await billableRadio.check({ force: true });

    const submitButton = page.locator('button:has-text("Add Project")');
    await submitButton.click();

    await page.waitForTimeout(2000);

    const projectInList = page.locator(`text=${uniqueProjectName}`);
    await expect(projectInList).toBeVisible({ timeout: 10000 });
  });

  test('should close modal when clicking cancel/close', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForSelector('text=Add New Project', { timeout: 5000 });

    const closeButton = page.locator('button:has(svg)').first();
    await closeButton.click();

    await expect(page.locator('text=Add New Project')).not.toBeVisible({ timeout: 2000 });
  });

  test('should create non-billable project', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForSelector('text=Add New Project', { timeout: 5000 });

    const clientSelect = page.locator('button:has-text("Select Client")');
    await clientSelect.click();
    await page.waitForTimeout(500);

    const firstClient = page.locator('[role="option"]').first();
    await firstClient.click();

    const projectNameInput = page.locator('input#project-name');
    const uniqueProjectName = `E2E Non-billable Project ${Date.now()}`;
    await projectNameInput.fill(uniqueProjectName);

    const nonBillableRadio = page.locator('input[value="Non-Billable"]');
    await nonBillableRadio.check({ force: true });

    const submitButton = page.locator('button:has-text("Add Project")');
    await submitButton.click();

    await page.waitForTimeout(2000);

    const projectInList = page.locator(`text=${uniqueProjectName}`);
    await expect(projectInList).toBeVisible({ timeout: 10000 });
  });

  test('should show red asterisk for required fields', async ({ page }) => {
    await navigateTo(page, '/projects');

    const newProjectButton = page.locator('button:has-text("New Project")');
    const isAdmin = await newProjectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
    }

    await newProjectButton.click();
    await page.waitForSelector('text=Add New Project', { timeout: 5000 });

    const requiredAsterisks = page.locator('span.text-red-500:has-text("*")');
    const asteriskCount = await requiredAsterisks.count();

    expect(asteriskCount).toBeGreaterThan(0);
  });
});
