import { test, expect } from '@playwright/test';

test.describe('Time Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://127.0.0.1:3000/users/sign_in');
    
    // Wait for the page to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login form using the actual selectors from our React app
    await page.fill('input[type="email"]', 'vipul@saeloun.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to time tracking page
    await page.click('a[href="/time-tracking"]');
    await page.waitForURL('**/time-tracking', { timeout: 10000 });
  });

  test('should display the time tracking page', async ({ page }) => {
    // Check if the page title is visible
    await expect(page.locator('h1:has-text("Time Tracking")')).toBeVisible();
    
    // Check if the week view is displayed by default
    await expect(page.locator('button:has-text("Week")')).toBeVisible();
    
    // Check if days of the week are displayed
    await expect(page.locator('button[aria-label*="Select Mon"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Select Tue"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Select Wed"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Select Thu"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Select Fri"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Select Sat"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Select Sun"]')).toBeVisible();
  });

  test('should allow selecting different days', async ({ page }) => {
    // Click on Tuesday
    await page.click('button[aria-label*="Select Tue"]');
    
    // Check if Tuesday is selected (has aria-pressed="true")
    await expect(page.locator('button[aria-label*="Select Tue"][aria-pressed="true"]')).toBeVisible();
    
    // Click on Wednesday
    await page.click('button[aria-label*="Select Wed"]');
    
    // Check if Wednesday is now selected
    await expect(page.locator('button[aria-label*="Select Wed"][aria-pressed="true"]')).toBeVisible();
    
    // Check that Tuesday is no longer selected
    await expect(page.locator('button[aria-label*="Select Tue"][aria-pressed="false"]')).toBeVisible();
  });

  test('should display entries for days with data', async ({ page }) => {
    // Click on Tuesday September 2nd (which has an entry)
    await page.click('button[aria-label*="Select Tue, Sep 02"]');
    
    // Wait for entries to load
    await page.waitForTimeout(500);
    
    // Check if the entry is displayed
    await expect(page.locator('text=Entries for Tuesday, September 2')).toBeVisible();
    
    // Check if the test entry is visible
    await expect(page.locator('text=Test me')).toBeVisible();
    await expect(page.locator('text=Olson LLC')).toBeVisible();
    await expect(page.locator('text=Quo Lux')).toBeVisible();
    await expect(page.locator('text=00:45')).toBeVisible();
  });

  test('should show no entries message for empty days', async ({ page }) => {
    // Click on a day without entries (e.g., Monday)
    await page.click('button[aria-label*="Select Mon"]');
    
    // Check if the no entries message is displayed
    await expect(page.locator('text=No entries for Monday')).toBeVisible();
    await expect(page.locator('text=Click "Add Entry" to create your first entry for this day')).toBeVisible();
  });

  test('should navigate between weeks', async ({ page }) => {
    // Get the current week dates
    const currentWeekHeader = await page.locator('h2').textContent();
    
    // Click previous week button
    await page.click('button[aria-label="Previous week"]');
    
    // Wait for navigation
    await page.waitForTimeout(500);
    
    // Check that the week has changed
    const newWeekHeader = await page.locator('h2').textContent();
    expect(newWeekHeader).not.toBe(currentWeekHeader);
    
    // Click next week button to go back
    await page.click('button[aria-label="Next week"]');
    
    // Wait for navigation
    await page.waitForTimeout(500);
    
    // Check that we're back to the original week
    const finalWeekHeader = await page.locator('h2').textContent();
    expect(finalWeekHeader).toBe(currentWeekHeader);
  });

  test('should navigate to today when Today button is clicked', async ({ page }) => {
    // Navigate to a different week first
    await page.click('button[aria-label="Previous week"]');
    await page.waitForTimeout(500);
    
    // Click Today button
    await page.click('button:has-text("Today")');
    
    // Wait for navigation
    await page.waitForTimeout(500);
    
    // Check that today's date is visible and selected
    const today = new Date();
    const todayDate = today.getDate();
    
    // Look for today's date being selected
    await expect(page.locator(`button[aria-label*="${todayDate}"][aria-label*="Today"][aria-pressed="true"]`)).toBeVisible();
  });

  test('should display Add Entry button', async ({ page }) => {
    // Check if Add Entry button is visible
    await expect(page.locator('button:has-text("Add Entry")')).toBeVisible();
    
    // Click the Add Entry button
    await page.click('button:has-text("Add Entry")');
    
    // Check if the entry form appears (this would depend on your implementation)
    // You may need to adjust this based on what happens when Add Entry is clicked
    await page.waitForTimeout(500);
  });

  test('should switch between Week and Month views', async ({ page }) => {
    // Check that Week view is active by default
    await expect(page.locator('button:has-text("Week")')).toBeVisible();
    
    // Click Month view button
    await page.click('button:has-text("Month")');
    
    // Wait for view change
    await page.waitForTimeout(500);
    
    // Check that Month view is now active (you may need to adjust this based on your UI)
    // The calendar or layout should change when switching views
    
    // Switch back to Week view
    await page.click('button:has-text("Week")');
    
    // Wait for view change
    await page.waitForTimeout(500);
    
    // Verify we're back in week view
    await expect(page.locator('button[aria-label*="Select Mon"]')).toBeVisible();
  });

  test('should display total hours for the week', async ({ page }) => {
    // Check if the total hours display is visible
    await expect(page.locator('text=Total')).toBeVisible();
    
    // The total should show hours in HH:MM format
    await expect(page.locator('text=/\\d{2}:\\d{2}/')).toBeVisible();
  });

  test('should highlight the current day', async ({ page }) => {
    // Look for Today indicator
    const todayButton = page.locator('button[aria-label*="Today"]');
    
    // Check if today's button has special styling or indicator
    await expect(todayButton).toBeVisible();
    
    // Today should have some special indication (like a badge or different styling)
    // This depends on your implementation
  });
});