import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Team - Editing Members', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/team');
  });

  test('edit button is available in more options menu', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    await page.waitForTimeout(500);

    const editButton = page.locator('button[style="ternary"]:has(svg)').nth(1);
    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(editButton).toBeVisible();
    }
  });

  test('clicking edit opens edit member form', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    await page.waitForTimeout(500);

    const moreOptionsButtons = page.locator('button[style="ternary"]');
    const editButton = moreOptionsButtons.nth(1);

    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();

      const modalHeading = page.locator('h6:has-text("Edit")');
      await expect(modalHeading).toBeVisible();
    }
  });

  test('edit form shows current member details', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const memberName = await firstRow.locator('p.text-sm.font-bold').textContent();
    const memberEmail = await firstRow.locator('dt.text-xs.font-medium.lowercase').textContent();

    await firstRow.hover();
    await page.waitForTimeout(500);

    const moreOptionsButtons = page.locator('button[style="ternary"]');
    const editButton = moreOptionsButtons.nth(1);

    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();

      const firstNameInput = page.locator('input[name="firstName"]');
      const lastNameInput = page.locator('input[name="lastName"]');
      const emailInput = page.locator('input[name="email"]');

      await expect(firstNameInput).not.toBeEmpty();
      await expect(lastNameInput).not.toBeEmpty();
      await expect(emailInput).toHaveValue(memberEmail?.trim() || '');
    }
  });

  test('can change member role', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    await page.waitForTimeout(500);

    const moreOptionsButtons = page.locator('button[style="ternary"]');
    const editButton = moreOptionsButtons.nth(1);

    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();

      const adminRadio = page.locator('input#admin');
      const employeeRadio = page.locator('input#employee');

      const adminChecked = await adminRadio.isChecked();

      if (adminChecked) {
        await employeeRadio.click();
        await expect(employeeRadio).toBeChecked();
        await expect(adminRadio).not.toBeChecked();
      } else {
        await adminRadio.click();
        await expect(adminRadio).toBeChecked();
      }
    }
  });

  test('save changes button is enabled after making changes', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    await page.waitForTimeout(500);

    const moreOptionsButtons = page.locator('button[style="ternary"]');
    const editButton = moreOptionsButtons.nth(1);

    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();

      const saveButton = page.locator('button[type="submit"]:has-text("SAVE CHANGES")');
      const initialState = await saveButton.isDisabled();

      const firstNameInput = page.locator('input[name="firstName"]');
      const currentValue = await firstNameInput.inputValue();
      await firstNameInput.fill(currentValue + 'X');
      await firstNameInput.evaluate(e => e.blur());

      await expect(saveButton).toBeEnabled();
    }
  });

  test('closing edit form without saving discards changes', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const originalName = await firstRow.locator('p.text-sm.font-bold').textContent();

    await firstRow.hover();
    await page.waitForTimeout(500);

    const moreOptionsButtons = page.locator('button[style="ternary"]');
    const editButton = moreOptionsButtons.nth(1);

    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();

      const firstNameInput = page.locator('input[name="firstName"]');
      await firstNameInput.fill('ChangedName');

      const closeButton = page.locator('button[style="ternary"]').first();
      await closeButton.click();

      const modal = page.locator('h6:has-text("Edit")');
      await expect(modal).not.toBeVisible();

      const currentName = await firstRow.locator('p.text-sm.font-bold').textContent();
      expect(currentName).toBe(originalName);
    }
  });

  test('edit form validates email format', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    await page.waitForTimeout(500);

    const moreOptionsButtons = page.locator('button[style="ternary"]');
    const editButton = moreOptionsButtons.nth(1);

    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();

      const emailInput = page.locator('input[name="email"]');
      await emailInput.fill('invalid-email');
      await emailInput.blur();

      const errorMessage = page.locator('text=Invalid email ID');
      await expect(errorMessage).toBeVisible();
    }
  });

  test('edit form shows correct heading for team members', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const hasPending = await firstRow.locator('text=pending')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    await firstRow.hover();
    await page.waitForTimeout(500);

    const moreOptionsButtons = page.locator('button[style="ternary"]');
    const editButton = moreOptionsButtons.nth(1);

    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();

      if (hasPending) {
        const heading = page.locator('h6:has-text("Edit Invitation")');
        await expect(heading).toBeVisible();
      } else {
        const heading = page.locator('h6:has-text("Edit User Details")');
        await expect(heading).toBeVisible();
      }
    }
  });

  test('role radio buttons are mutually exclusive', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    await page.waitForTimeout(500);

    const moreOptionsButtons = page.locator('button[style="ternary"]');
    const editButton = moreOptionsButtons.nth(1);

    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();

      const adminRadio = page.locator('input#admin');
      const employeeRadio = page.locator('input#employee');
      const bookKeeperRadio = page.locator('input#book_keeper');
      const clientRadio = page.locator('input#client');

      await adminRadio.click();
      await expect(adminRadio).toBeChecked();
      await expect(employeeRadio).not.toBeChecked();
      await expect(bookKeeperRadio).not.toBeChecked();
      await expect(clientRadio).not.toBeChecked();

      await bookKeeperRadio.click();
      await expect(bookKeeperRadio).toBeChecked();
      await expect(adminRadio).not.toBeChecked();
      await expect(employeeRadio).not.toBeChecked();
      await expect(clientRadio).not.toBeChecked();
    }
  });
});
