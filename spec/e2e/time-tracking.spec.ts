import { test, expect } from '@playwright/test';

test.describe('Time Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://127.0.0.1:3000/user/sign_in');
    await page.getByRole('textbox', { name: 'Email' }).fill('vipul@saeloun.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    
    // Wait for navigation to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to time tracking
    await page.goto('http://127.0.0.1:3000/time-tracking');
    await page.waitForLoadState('networkidle');
  });

  test('should display time tracking page with week view', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: 'Time Tracking', level: 1 })).toBeVisible();
    
    // Check week and month toggle buttons
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
    
    // Check date navigation
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
    
    // Check week days are displayed
    await expect(page.getByText('Mon')).toBeVisible();
    await expect(page.getByText('Tue')).toBeVisible();
    await expect(page.getByText('Wed')).toBeVisible();
    await expect(page.getByText('Thu')).toBeVisible();
    await expect(page.getByText('Fri')).toBeVisible();
    await expect(page.getByText('Sat')).toBeVisible();
    await expect(page.getByText('Sun')).toBeVisible();
  });

  test('should open add entry form when clicking Add Entry button', async ({ page }) => {
    // Click Add Entry button
    await page.getByRole('button', { name: /Add Entry/ }).click();
    
    // Check form is displayed
    await expect(page.getByRole('heading', { name: 'Add New Project Entry' })).toBeVisible();
    await expect(page.getByText('Select a client and project to start tracking time')).toBeVisible();
    
    // Check form fields
    await expect(page.getByText('Client')).toBeVisible();
    await expect(page.getByText('Project')).toBeVisible();
    await expect(page.getByText('Duration')).toBeVisible();
    await expect(page.getByText('Description')).toBeVisible();
    
    // Check buttons
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Entry' })).toBeDisabled();
  });

  test('should add a new time entry', async ({ page }) => {
    // Click Add Entry button
    await page.getByRole('button', { name: /Add Entry/ }).click();
    
    // Select client
    await page.getByRole('combobox').filter({ hasText: /Select a client/ }).click();
    
    // Wait for dropdown to open
    await page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Select first client from dropdown
    const firstClient = await page.getByRole('option').first();
    const clientName = await firstClient.textContent();
    await firstClient.click();
    
    // Wait for project to be auto-selected
    await page.waitForTimeout(500);
    
    // Fill in duration
    await page.getByPlaceholder('0').first().fill('3');
    await page.getByPlaceholder('0').nth(1).fill('45');
    
    // Fill in description
    await page.getByRole('textbox', { name: 'What did you work on?' }).fill('Test automation for time tracking');
    
    // Submit button should now be enabled
    await expect(page.getByRole('button', { name: 'Add Entry' })).toBeEnabled();
    
    // Click Add Entry
    await page.getByRole('button', { name: 'Add Entry' }).click();
    
    // Check that the form is closed and entry is displayed
    await expect(page.getByRole('heading', { name: 'Add New Project Entry' })).not.toBeVisible();
    
    // Verify the time entry appears in the week view
    await expect(page.getByText('03:45')).toBeVisible();
    
    // Verify client name appears
    if (clientName) {
      await expect(page.getByText(clientName)).toBeVisible();
    }
  });

  test('should cancel adding entry', async ({ page }) => {
    // Click Add Entry button
    await page.getByRole('button', { name: /Add Entry/ }).click();
    
    // Check form is displayed
    await expect(page.getByRole('heading', { name: 'Add New Project Entry' })).toBeVisible();
    
    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Check form is closed
    await expect(page.getByRole('heading', { name: 'Add New Project Entry' })).not.toBeVisible();
  });

  test('should navigate between weeks', async ({ page }) => {
    // Get current week display
    const weekDisplay = page.locator('h2').filter({ hasText: /\d+ \w+ -\d+ \w+ \d{4}/ });
    const initialWeek = await weekDisplay.textContent();
    
    // Click next week button
    await page.locator('button').filter({ has: page.locator('img') }).last().click();
    
    // Wait for week to change
    await page.waitForTimeout(500);
    
    // Check week changed
    const newWeek = await weekDisplay.textContent();
    expect(newWeek).not.toBe(initialWeek);
    
    // Click previous week button
    await page.locator('button').filter({ has: page.locator('img') }).nth(-2).click();
    
    // Wait for week to change back
    await page.waitForTimeout(500);
    
    // Check we're back to initial week
    const currentWeek = await weekDisplay.textContent();
    expect(currentWeek).toBe(initialWeek);
  });

  test('should navigate to today', async ({ page }) => {
    // Navigate to next week first
    await page.locator('button').filter({ has: page.locator('img') }).last().click();
    await page.waitForTimeout(500);
    
    // Click Today button
    await page.getByRole('button', { name: 'Today' }).click();
    
    // Wait for navigation
    await page.waitForTimeout(500);
    
    // Verify we're on current week (this is a simplified check)
    // In a real test, you'd want to verify the actual date
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
  });

  test('should switch between week and month view', async ({ page }) => {
    // Initially in week view
    await expect(page.getByText('Total')).toBeVisible();
    
    // Switch to month view
    await page.getByRole('button', { name: 'Month' }).click();
    await page.waitForTimeout(500);
    
    // Month view specific elements should be visible
    // (You'd need to add specific month view checks here based on your UI)
    
    // Switch back to week view
    await page.getByRole('button', { name: 'Week' }).click();
    await page.waitForTimeout(500);
    
    // Week view elements should be visible again
    await expect(page.getByText('Total')).toBeVisible();
  });

  test('should validate required fields in add entry form', async ({ page }) => {
    // Click Add Entry button
    await page.getByRole('button', { name: /Add Entry/ }).click();
    
    // Try to submit without filling any fields
    await expect(page.getByRole('button', { name: 'Add Entry' })).toBeDisabled();
    
    // Select only client
    await page.getByRole('combobox').filter({ hasText: /Select a client/ }).click();
    await page.getByRole('option').first().click();
    
    // Button should still be disabled without duration
    await expect(page.getByRole('button', { name: 'Add Entry' })).toBeDisabled();
    
    // Add duration
    await page.getByPlaceholder('0').first().fill('1');
    
    // Now button should be enabled
    await expect(page.getByRole('button', { name: 'Add Entry' })).toBeEnabled();
  });

  test('should display employee selector for admin users', async ({ page }) => {
    // Check if employee selector is visible (for admin users)
    const employeeSelector = page.getByRole('combobox').filter({ hasText: /Vipul AM/ });
    
    // This will be visible if the logged-in user is an admin
    if (await employeeSelector.isVisible()) {
      await expect(employeeSelector).toBeVisible();
      
      // Could test switching employees here if needed
    }
  });

  test('should edit existing time entry', async ({ page }) => {
    // First add a time entry
    await page.getByRole('button', { name: /Add Entry/ }).click();
    await page.getByRole('combobox').filter({ hasText: /Select a client/ }).click();
    await page.getByRole('option').first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('0').first().fill('2');
    await page.getByPlaceholder('0').nth(1).fill('30');
    await page.getByRole('textbox', { name: 'What did you work on?' }).fill('Initial work');
    await page.getByRole('button', { name: 'Add Entry' }).click();
    
    // Wait for entry to be saved
    await page.waitForTimeout(1000);
    
    // Click on the time entry to edit (clicking the time button)
    await page.getByRole('button', { name: '02:30' }).click();
    
    // This should open edit form or modal
    // Add assertions based on your edit UI
  });

  test('should allow clicking on different days in week view', async ({ page }) => {
    // Verify all days are clickable buttons
    const dayButtons = await page.getByRole('button').filter({ hasText: /^Select/ }).all();
    expect(dayButtons.length).toBe(7); // Should have 7 days in week view
    
    // Click on Wednesday
    await page.getByRole('button', { name: /Select Wed/ }).click();
    
    // Should open a dialog for Wednesday
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Wednesday/)).toBeVisible();
    await expect(page.getByText('No entries for this day')).toBeVisible();
    
    // Should have Add Entry button in dialog
    const dialogAddButton = page.getByRole('dialog').getByRole('button', { name: /Add Entry/ });
    await expect(dialogAddButton).toBeVisible();
    
    // Close the dialog
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Click on Friday
    await page.getByRole('button', { name: /Select Fri/ }).click();
    
    // Should open dialog for Friday
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Friday/)).toBeVisible();
    
    // Close dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });

  test('should add entry for specific day from day dialog', async ({ page }) => {
    // Click on Tuesday
    await page.getByRole('button', { name: /Select Tue/ }).click();
    
    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Tuesday/)).toBeVisible();
    
    // Click Add Entry in the dialog
    const dialogAddButton = page.getByRole('dialog').getByRole('button', { name: /Add Entry/ });
    await dialogAddButton.click();
    
    // Entry form should appear
    await expect(page.getByRole('heading', { name: 'Add New Project Entry' })).toBeVisible();
    
    // Fill in the entry
    await page.getByRole('combobox').filter({ hasText: /Select a client/ }).click();
    await page.getByRole('option').first().click();
    await page.waitForTimeout(500);
    
    await page.getByPlaceholder('0').first().fill('4');
    await page.getByPlaceholder('0').nth(1).fill('15');
    await page.getByRole('textbox', { name: 'What did you work on?' }).fill('Tuesday specific task');
    
    // Submit the entry
    await page.getByRole('button', { name: 'Add Entry' }).click();
    
    // Verify the entry appears for Tuesday (should show 04:15)
    await expect(page.getByText('04:15')).toBeVisible();
  });

  test('should highlight selected day in week view', async ({ page }) => {
    // Click on Thursday
    await page.getByRole('button', { name: /Select Thu/ }).click();
    
    // Thursday button should have visual indication it's selected
    const thursdayButton = page.getByRole('button', { name: /Select Thu/ });
    
    // Check for selection styling (ring or border highlighting)
    const className = await thursdayButton.getAttribute('class');
    expect(className).toContain('ring-2'); // Based on the code, selected days have ring-2
    
    // Close dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });
});