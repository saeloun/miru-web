import { test, expect } from '@playwright/test';

test.describe('Time Tracking Page Analysis', () => {
  test('analyze weekly and monthly views', async ({ page }) => {
    // Login
    await page.goto('http://127.0.0.1:3000/test_login');
    await page.waitForTimeout(2000);
    
    // Navigate to time tracking
    await page.goto('http://127.0.0.1:3000/time-tracking');
    await page.waitForLoadState('networkidle');
    
    console.log('=== WEEKLY VIEW ANALYSIS ===');
    
    // Count Add Entry buttons in weekly view
    const weeklyAddButtons = await page.locator('button:has-text("Add Entry"), button:has-text("Add")').all();
    console.log(`Found ${weeklyAddButtons.length} Add Entry buttons in weekly view`);
    
    for (let i = 0; i < weeklyAddButtons.length; i++) {
      const button = weeklyAddButtons[i];
      const isVisible = await button.isVisible();
      const boundingBox = await button.boundingBox();
      console.log(`Button ${i + 1}: Visible=${isVisible}, Size=${boundingBox?.width}x${boundingBox?.height}`);
    }
    
    // Take screenshot of weekly view
    await page.screenshot({ path: 'weekly-view-current.png' });
    
    // Switch to month view
    console.log('\n=== MONTHLY VIEW ANALYSIS ===');
    await page.click('button:has-text("Month")');
    await page.waitForTimeout(2000);
    
    // Count Add Entry buttons in monthly view
    const monthlyAddButtons = await page.locator('button:has-text("Add Entry"), button:has-text("Add")').all();
    console.log(`Found ${monthlyAddButtons.length} Add Entry buttons in monthly view`);
    
    // Check if entries are visible on calendar
    const calendarEntries = await page.locator('.grid button span:has-text(":")').all();
    console.log(`Found ${calendarEntries.length} time entries displayed on calendar`);
    
    // Check for entry listing below calendar
    const entryListing = await page.locator('[class*="entry"], [class*="list"]').all();
    console.log(`Found ${entryListing.length} entry listing elements below calendar`);
    
    // Take screenshot of monthly view
    await page.screenshot({ path: 'monthly-view-current.png' });
    
    // Click on a day with entries
    const daysWithEntries = await page.locator('button:has(span:has-text(":"))').all();
    if (daysWithEntries.length > 0) {
      console.log('\n=== CLICKING ON DAY WITH ENTRIES ===');
      await daysWithEntries[0].click();
      await page.waitForTimeout(1000);
      
      // Check what happens after clicking
      const modal = await page.locator('[role="dialog"], .modal, .popup').first();
      const modalVisible = await modal.isVisible();
      console.log(`Modal/popup visible after clicking day: ${modalVisible}`);
      
      await page.screenshot({ path: 'after-day-click.png' });
    }
  });
});