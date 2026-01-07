import { test, expect } from '@playwright/test';

test.describe('Invoice Edit Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/invoices');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[name="user[email]"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('vipul@saeloun.com');
      await page.fill('input[name="user[password]"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/invoices');
    }
  });

  test('should enable Save button on form changes and save successfully', async ({ page }) => {
    await page.waitForSelector('text=Invoices', { timeout: 10000 });
    
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await expect(firstInvoiceRow).toBeVisible({ timeout: 10000 });
    
    await firstInvoiceRow.click();
    await page.waitForURL('**/invoices/**/edit', { timeout: 10000 });
    
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeDisabled();
    
    const invoiceNumberInput = page.locator('input[name="invoiceNumber"]');
    const currentValue = await invoiceNumberInput.inputValue();
    await invoiceNumberInput.fill(currentValue + '-EDITED');
    
    await expect(saveButton).toBeEnabled();
    
    await saveButton.click();
    
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/Invoice.*saved|updated/i);
    
    await page.waitForTimeout(1000);
    await expect(saveButton).toBeDisabled();
  });

  test('should add timesheet entries to invoice', async ({ page }) => {
    await page.waitForSelector('text=Invoices', { timeout: 10000 });
    
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await expect(firstInvoiceRow).toBeVisible({ timeout: 10000 });
    
    await firstInvoiceRow.click();
    await page.waitForURL('**/invoices/**/edit', { timeout: 10000 });
    
    const timesheetButton = page.locator('button:has-text("Select timesheet entries")');
    if (await timesheetButton.isVisible()) {
      await timesheetButton.click();
      
      await page.waitForSelector('[role="combobox"]', { timeout: 5000 });
      
      const selectAllCheckbox = page.locator('text=Select All').locator('..').locator('input[type="checkbox"]');
      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.click();
        
        const addButton = page.locator('button:has-text("Add")').filter({ hasText: /Add \d+ entr/i });
        if (await addButton.isVisible()) {
          await addButton.click();
          
          await expect(page.locator('tr').filter({ hasText: /\$\d+/ })).toHaveCount(1, { timeout: 5000 });
          
          const saveButton = page.locator('button:has-text("Save")');
          await expect(saveButton).toBeEnabled();
        }
      }
    }
  });

  test('should show error toast on save failure', async ({ page }) => {
    await page.waitForSelector('text=Invoices', { timeout: 10000 });
    
    const firstInvoiceRow = page.locator('tr').filter({ hasText: /INV-\d+/ }).first();
    await expect(firstInvoiceRow).toBeVisible({ timeout: 10000 });
    
    await firstInvoiceRow.click();
    await page.waitForURL('**/invoices/**/edit', { timeout: 10000 });
    
    await page.route('**/internal_api/v1/invoices/**', route => {
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: { base: ['Invoice number already exists'] }
        })
      });
    });
    
    const invoiceNumberInput = page.locator('input[name="invoiceNumber"]');
    const currentValue = await invoiceNumberInput.inputValue();
    await invoiceNumberInput.fill(currentValue + '-DUP');
    
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();
    
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/Invoice number already exists/i);
  });
});