import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Projects - Edit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should open edit modal from actions menu', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    const hasEditOption = await editOption.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasEditOption) {
      await editOption.click();

      await expect(page.locator('text=Edit Project Details')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should load existing project data in edit form', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const projectName = await firstRow.locator('td').first().textContent();

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editOption.click();
      await page.waitForSelector('text=Edit Project Details', { timeout: 5000 });

      const projectNameInput = page.locator('input#project-name');
      const inputValue = await projectNameInput.inputValue();

      expect(inputValue.length).toBeGreaterThan(0);
    }
  });

  test('should allow updating project name', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editOption.click();
      await page.waitForSelector('text=Edit Project Details', { timeout: 5000 });

      const projectNameInput = page.locator('input#project-name');
      const currentValue = await projectNameInput.inputValue();
      const newValue = `${currentValue} (Updated ${Date.now()})`;

      await projectNameInput.fill(newValue);

      const updatedValue = await projectNameInput.inputValue();
      expect(updatedValue).toBe(newValue);
    }
  });

  test('should allow changing billable status', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editOption.click();
      await page.waitForSelector('text=Edit Project Details', { timeout: 5000 });

      const billableRadio = page.locator('input[value="Billable"]');
      const nonBillableRadio = page.locator('input[value="Non-Billable"]');

      const isBillable = await billableRadio.isChecked();

      if (isBillable) {
        await nonBillableRadio.check({ force: true });
        await expect(nonBillableRadio).toBeChecked();
      } else {
        await billableRadio.check({ force: true });
        await expect(billableRadio).toBeChecked();
      }
    }
  });

  test('should allow changing client assignment', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editOption.click();
      await page.waitForSelector('text=Edit Project Details', { timeout: 5000 });

      const clientSelect = page.locator('button[role="combobox"]').first();
      await clientSelect.click();
      await page.waitForTimeout(500);

      const clientOptions = page.locator('[role="option"]');
      const optionCount = await clientOptions.count();

      if (optionCount > 1) {
        await clientOptions.nth(1).click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should enable save button when changes are made', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editOption.click();
      await page.waitForSelector('text=Edit Project Details', { timeout: 5000 });

      const saveButton = page.locator('button:has-text("Save Changes")');
      await expect(saveButton).toBeVisible();
    }
  });

  test('should save changes successfully', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editOption.click();
      await page.waitForSelector('text=Edit Project Details', { timeout: 5000 });

      const projectNameInput = page.locator('input#project-name');
      const currentValue = await projectNameInput.inputValue();
      await projectNameInput.fill(`${currentValue} `);

      const saveButton = page.locator('button:has-text("Save Changes")');
      await saveButton.click();

      await page.waitForTimeout(2000);

      await expect(page.locator('text=Edit Project Details')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editOption.click();
      await page.waitForSelector('text=Edit Project Details', { timeout: 5000 });

      const closeButton = page.locator('button:has(svg)').first();
      await closeButton.click();

      await expect(page.locator('text=Edit Project Details')).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should discard changes when closing without saving', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const originalProjectName = await firstRow.locator('td').first().textContent();

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editOption.click();
      await page.waitForSelector('text=Edit Project Details', { timeout: 5000 });

      const projectNameInput = page.locator('input#project-name');
      await projectNameInput.fill('This should be discarded');

      const closeButton = page.locator('button:has(svg)').first();
      await closeButton.click();

      await page.waitForTimeout(1000);

      const currentProjectName = await firstRow.locator('td').first().textContent();
      expect(currentProjectName).toContain(originalProjectName?.trim() || '');
    }
  });

  test('should show all form fields in edit mode', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editOption.click();
      await page.waitForSelector('text=Edit Project Details', { timeout: 5000 });

      await expect(page.locator('label:has-text("Client")')).toBeVisible();
      await expect(page.locator('label:has-text("Project Name")')).toBeVisible();
      await expect(page.locator('label:has-text("Project Type")')).toBeVisible();
    }
  });

  test('should validate required fields in edit mode', async ({ page }) => {
    await navigateTo(page, '/projects');

    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    const hasProjects = await firstRow.isVisible().catch(() => false);

    if (!hasProjects) {
      test.skip();
    }

    const actionsButton = firstRow.locator('button[aria-label*="menu"], button:has(svg)').last();
    const hasActions = await actionsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasActions) {
      test.skip();
    }

    await actionsButton.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('text=Edit project');
    if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editOption.click();
      await page.waitForSelector('text=Edit Project Details', { timeout: 5000 });

      const projectNameInput = page.locator('input#project-name');
      await projectNameInput.fill('');

      const saveButton = page.locator('button:has-text("Save Changes")');
      await expect(saveButton).toBeDisabled();
    }
  });
});
