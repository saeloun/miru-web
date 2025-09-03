import { test, expect } from '@playwright/test';

test.describe('Time Tracking CRUD Operations', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://127.0.0.1:3000/users/sign_in');
    
    // Wait for the page to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login form
    await page.fill('input[type="email"]', 'vipul@saeloun.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to time tracking page
    await page.click('a[href="/time-tracking"]');
    await page.waitForURL('**/time-tracking', { timeout: 10000 });
  });

  test('should edit an existing time entry with comprehensive validation', async ({ page }) => {
    // Navigate to Monday which has entries
    await page.click('button[aria-label*="Select Mon, Sep 01"]');
    
    // Wait for entries to load and verify we have entries to edit
    await page.waitForTimeout(1000);
    const editButtons = await page.locator('button[title="Edit entry"]').count();
    expect(editButtons).toBeGreaterThan(0);
    
    // Store the original text and duration of the first entry
    const originalNote = await page.locator('.text-slate-700').first().textContent();
    const originalDuration = await page.locator('.text-3xl.font-bold.text-slate-900.tabular-nums').first().textContent();
    
    // Click edit button on the first entry
    await page.locator('button[title="Edit entry"]').first().click();
    
    // Wait for edit form to appear and verify all fields are populated
    await page.waitForSelector('textarea[placeholder*="Add notes"]', { timeout: 5000 });
    
    // Locate form fields
    const clientDropdown = page.locator('button[role="combobox"]').first();
    const projectDropdown = page.locator('button[role="combobox"]').nth(1);
    const noteField = page.locator('textarea[placeholder*="Add notes"]').first();
    const durationField = page.locator('input[name="timeInput"]').first();
    const billableCheckbox = page.locator('input[type="checkbox"]#billable');
    
    // Verify original values are populated in the form
    const currentNote = await noteField.inputValue();
    expect(currentNote).toBeTruthy(); // Should have some value
    
    const currentDuration = await durationField.inputValue();
    expect(currentDuration).toMatch(/\d{2}:\d{2}/); // Should be in HH:MM format
    
    // Edit all fields with new values
    await noteField.clear();
    await noteField.fill('Comprehensive Edit Test - Updated Entry\n• Task 1: Implemented new feature\n• Task 2: Added comprehensive tests\n• Task 3: Updated documentation\n• Task 4: Code review completed');
    
    await durationField.clear();
    await durationField.fill('05:45');
    
    // Toggle billable status if checkbox is enabled
    const isDisabled = await billableCheckbox.isDisabled();
    if (!isDisabled) {
      const isChecked = await billableCheckbox.isChecked();
      await billableCheckbox.click();
      const newCheckedState = await billableCheckbox.isChecked();
      expect(newCheckedState).toBe(!isChecked);
    }
    
    // Save the changes by clicking Update Entry button
    await page.click('button:has-text("Update Entry")');
    
    // Wait for save to complete and form to close
    await page.waitForTimeout(2000);
    
    // Verify form is closed
    await expect(page.locator('textarea[placeholder*="Add notes"]')).not.toBeVisible();
    
    // Verify all changes are displayed in the entry card
    await expect(page.locator('text=Comprehensive Edit Test - Updated Entry')).toBeVisible();
    await expect(page.locator('text=Task 1: Implemented new feature')).toBeVisible();
    await expect(page.locator('text=Task 2: Added comprehensive tests')).toBeVisible();
    await expect(page.locator('text=Task 3: Updated documentation')).toBeVisible();
    await expect(page.locator('text=Task 4: Code review completed')).toBeVisible();
    await expect(page.locator('text=05:45')).toBeVisible();
    
    // Verify original values are no longer visible
    if (originalNote && !originalNote.includes('Comprehensive Edit Test')) {
      const originalFirstLine = originalNote.split('\n')[0].trim();
      if (originalFirstLine) {
        const originalElements = await page.locator(`text="${originalFirstLine}"`).count();
        expect(originalElements).toBe(0);
      }
    }
    
    // Test navigation persistence
    await page.click('button[aria-label*="Select Tue, Sep 02"]');
    await page.waitForTimeout(500);
    await page.click('button[aria-label*="Select Mon, Sep 01"]');
    await page.waitForTimeout(1000);
    
    // Verify changes persist after navigation
    await expect(page.locator('text=Comprehensive Edit Test - Updated Entry')).toBeVisible();
    await expect(page.locator('text=05:45')).toBeVisible();
    
    // Test page reload persistence
    await page.reload();
    await page.waitForTimeout(1500);
    
    // Re-navigate to Monday after reload
    await page.click('button[aria-label*="Select Mon, Sep 01"]');
    await page.waitForTimeout(1000);
    
    // Final verification after reload
    await expect(page.locator('text=Comprehensive Edit Test - Updated Entry')).toBeVisible();
    await expect(page.locator('text=Task 1: Implemented new feature')).toBeVisible();
    await expect(page.locator('text=05:45')).toBeVisible();
    
    // Verify day total is updated correctly
    const dayTotal = await page.locator('.text-4xl.font-bold.text-blue-600').textContent();
    expect(dayTotal).toContain('h'); // Should show hours format
  });

  test('should delete a time entry and persist the deletion', async ({ page }) => {
    // Navigate to Tuesday which has entries
    await page.click('button[aria-label*="Select Tue, Sep 02"]');
    
    // Wait for entries to load
    await page.waitForTimeout(1000);
    
    // Count initial entries
    const initialEntryCount = await page.locator('[title="Delete entry"]').count();
    expect(initialEntryCount).toBeGreaterThan(0);
    
    // Get the text of the first entry before deletion
    const firstEntryText = await page.locator('p').filter({ hasText: /Test me|Updated entry/ }).first().textContent();
    
    // Click delete button on the first entry
    await page.locator('button[title="Delete entry"]').first().click();
    
    // Confirm deletion if there's a confirmation dialog
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    // Wait for deletion to complete
    await page.waitForTimeout(1500);
    
    // Verify entry was deleted
    const newEntryCount = await page.locator('[title="Delete entry"]').count();
    expect(newEntryCount).toBe(initialEntryCount - 1);
    
    // If there were entries left, verify the deleted entry is gone
    if (newEntryCount > 0 && firstEntryText) {
      await expect(page.locator(`text="${firstEntryText}"`)).not.toBeVisible();
    }
    
    // Navigate to another day and back to verify deletion persisted
    await page.click('button[aria-label*="Select Wed, Sep 03"]');
    await page.waitForTimeout(500);
    await page.click('button[aria-label*="Select Tue, Sep 02"]');
    await page.waitForTimeout(1000);
    
    // Verify deletion still persisted
    const finalEntryCount = await page.locator('[title="Delete entry"]').count();
    expect(finalEntryCount).toBe(newEntryCount);
  });

  test('should add a new time entry and verify it persists', async ({ page }) => {
    // Click on Monday
    await page.click('button[aria-label*="Select Mon, Sep 01"]');
    
    // Wait for the page to update
    await page.waitForTimeout(500);
    
    // Click Add Entry button
    await page.click('button:has-text("Add Entry")');
    
    // Wait for the form to appear
    await page.waitForTimeout(500);
    
    // Fill in the new entry form
    const clientDropdown = page.locator('select').first();
    const projectDropdown = page.locator('select').nth(1);
    const noteField = page.locator('textarea').first();
    const durationField = page.locator('input[placeholder*="00:00"]').first();
    
    // Select client and project (if dropdowns exist)
    const clientSelectExists = await clientDropdown.isVisible().catch(() => false);
    if (clientSelectExists) {
      await clientDropdown.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      await projectDropdown.selectOption({ index: 1 });
    }
    
    // Fill in note and duration
    await noteField.fill('New Playwright Test Entry\nThis is a test entry created by automation\n• Task 1 completed\n• Task 2 in progress');
    await durationField.fill('01:30');
    
    // Save the entry
    await page.click('button:has-text("Save")');
    
    // Wait for save to complete
    await page.waitForTimeout(1500);
    
    // Verify the new entry appears
    await expect(page.locator('text=New Playwright Test Entry')).toBeVisible();
    await expect(page.locator('text=01:30')).toBeVisible();
    
    // Refresh the page to verify persistence
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Verify entry still exists after refresh
    await expect(page.locator('text=New Playwright Test Entry')).toBeVisible();
    await expect(page.locator('text=01:30')).toBeVisible();
  });

  test('should handle edit cancellation properly', async ({ page }) => {
    // Navigate to Tuesday which has entries
    await page.click('button[aria-label*="Select Tue, Sep 02"]');
    
    // Wait for entries to load
    await page.waitForTimeout(1000);
    
    // Get original entry text
    const originalText = await page.locator('p').filter({ hasText: /Test me|Updated entry/ }).first().textContent();
    
    // Click edit button on the first entry
    await page.locator('button[title="Edit entry"]').first().click();
    
    // Wait for edit form to appear
    await page.waitForTimeout(500);
    
    // Make changes but don't save
    const noteField = page.locator('textarea').first();
    await noteField.fill('This change should not be saved');
    
    // Click cancel or close the form
    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    } else {
      // Press escape to cancel
      await page.keyboard.press('Escape');
    }
    
    // Wait for form to close
    await page.waitForTimeout(500);
    
    // Verify original text is still there
    if (originalText) {
      await expect(page.locator(`text="${originalText}"`)).toBeVisible();
    }
    
    // Verify the unsaved change is not visible
    await expect(page.locator('text=This change should not be saved')).not.toBeVisible();
  });

  test('should properly handle edit form validation', async ({ page }) => {
    // Navigate to Monday
    await page.click('button[aria-label*="Select Mon, Sep 01"]');
    await page.waitForTimeout(1000);
    
    // Click edit on first entry
    await page.locator('button[title="Edit entry"]').first().click();
    await page.waitForSelector('textarea[placeholder*="Add notes"]', { timeout: 5000 });
    
    // Test empty duration validation
    const durationField = page.locator('input[name="timeInput"]').first();
    await durationField.clear();
    
    // Try to save with empty duration
    const updateButton = page.locator('button:has-text("Update Entry")');
    const isDisabled = await updateButton.isDisabled();
    expect(isDisabled).toBe(true); // Button should be disabled with invalid data
    
    // Fill valid duration
    await durationField.fill('02:30');
    
    // Now button should be enabled
    const isEnabledNow = await updateButton.isDisabled();
    expect(isEnabledNow).toBe(false);
    
    // Test invalid time format
    await durationField.clear();
    await durationField.fill('99:99');
    await durationField.blur();
    
    // Field should auto-correct or show error
    const correctedValue = await durationField.inputValue();
    expect(correctedValue).not.toBe('99:99');
    
    // Cancel the edit
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
    
    // Verify form is closed
    await expect(page.locator('textarea[placeholder*="Add notes"]')).not.toBeVisible();
  });

  test('should update day total when entries are edited', async ({ page }) => {
    // Navigate to Monday with entries
    await page.click('button[aria-label*="Select Mon, Sep 01"]');
    await page.waitForTimeout(1000);
    
    // Get the initial day total
    const dayTotalElement = page.locator('.text-4xl.font-bold.text-blue-600').first();
    const initialTotal = await dayTotalElement.textContent();
    console.log('Initial day total:', initialTotal);
    
    // Click edit on an entry
    await page.locator('button[title="Edit entry"]').first().click();
    await page.waitForSelector('textarea[placeholder*="Add notes"]', { timeout: 5000 });
    
    // Change the duration to a significantly different value
    const durationField = page.locator('input[name="timeInput"]').first();
    const originalDuration = await durationField.inputValue();
    
    // Set a new duration that's very different
    await durationField.clear();
    await durationField.fill('08:00'); // 8 hours
    
    // Save the changes
    await page.click('button:has-text("Update Entry")');
    await page.waitForTimeout(2000);
    
    // Get the updated day total
    const updatedTotal = await dayTotalElement.textContent();
    console.log('Updated day total:', updatedTotal);
    
    // Verify the total has changed
    expect(updatedTotal).not.toBe(initialTotal);
    
    // Verify the new duration is displayed in the entry
    await expect(page.locator('text=08:00')).toBeVisible();
  });

  test('should handle rapid sequential edits without data loss', async ({ page }) => {
    // Navigate to Monday
    await page.click('button[aria-label*="Select Mon, Sep 01"]');
    await page.waitForTimeout(1000);
    
    const editButtons = await page.locator('button[title="Edit entry"]').count();
    expect(editButtons).toBeGreaterThan(0);
    
    // Edit first entry
    await page.locator('button[title="Edit entry"]').first().click();
    await page.waitForSelector('textarea[placeholder*="Add notes"]', { timeout: 5000 });
    
    const noteField = page.locator('textarea[placeholder*="Add notes"]').first();
    await noteField.clear();
    await noteField.fill('Sequential Edit 1 - Testing rapid updates\n• First modification');
    
    const durationField = page.locator('input[name="timeInput"]').first();
    await durationField.clear();
    await durationField.fill('03:15');
    
    await page.click('button:has-text("Update Entry")');
    await page.waitForTimeout(1500);
    
    // Verify first edit
    await expect(page.locator('text=Sequential Edit 1 - Testing rapid updates')).toBeVisible();
    await expect(page.locator('text=03:15')).toBeVisible();
    
    // Immediately edit the same entry again
    await page.locator('button[title="Edit entry"]').first().click();
    await page.waitForSelector('textarea[placeholder*="Add notes"]', { timeout: 5000 });
    
    const noteField2 = page.locator('textarea[placeholder*="Add notes"]').first();
    const currentValue = await noteField2.inputValue();
    expect(currentValue).toContain('Sequential Edit 1');
    
    await noteField2.clear();
    await noteField2.fill('Sequential Edit 2 - Second rapid update\n• Modified again\n• Additional changes');
    
    const durationField2 = page.locator('input[name="timeInput"]').first();
    await durationField2.clear();
    await durationField2.fill('04:45');
    
    await page.click('button:has-text("Update Entry")');
    await page.waitForTimeout(1500);
    
    // Verify second edit overwrote the first
    await expect(page.locator('text=Sequential Edit 2 - Second rapid update')).toBeVisible();
    await expect(page.locator('text=Sequential Edit 1')).not.toBeVisible();
    await expect(page.locator('text=04:45')).toBeVisible();
    await expect(page.locator('text=03:15')).not.toBeVisible();
    
    // Test persistence after rapid edits
    await page.reload();
    await page.waitForTimeout(1500);
    await page.click('button[aria-label*="Select Mon, Sep 01"]');
    await page.waitForTimeout(1000);
    
    // Final state should be preserved
    await expect(page.locator('text=Sequential Edit 2 - Second rapid update')).toBeVisible();
    await expect(page.locator('text=04:45')).toBeVisible();
  });
});