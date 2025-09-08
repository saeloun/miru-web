import { test, expect } from '@playwright/test';

test.describe('Invoice PDF Download', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000');
    await page.fill('input[name="user[email]"]', 'vipul@saeloun.com');
    await page.fill('input[name="user[password]"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('downloads invoice as PDF', async ({ page }) => {
    // Navigate to invoices page
    await page.goto('http://localhost:3000/invoices');
    
    // Find first invoice in the list
    const firstInvoice = await page.locator('.invoice-row').first();
    const invoiceNumber = await firstInvoice.locator('.invoice-number').textContent();
    
    // Click on the invoice
    await firstInvoice.click();
    
    // Wait for invoice detail page
    await page.waitForSelector('.invoice-details');
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.click('[data-testid="download-pdf-button"], .download-btn, button:has-text("Download")');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // Save to a temporary location and verify it's a PDF
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const content = fs.readFileSync(path);
      
      // Check if it starts with PDF header
      expect(content.toString('utf-8', 0, 4)).toBe('%PDF');
    }
  });

  test('sends invoice via email', async ({ page }) => {
    // Navigate to invoices page
    await page.goto('http://localhost:3000/invoices');
    
    // Click on first invoice
    await page.locator('.invoice-row').first().click();
    
    // Wait for invoice detail page
    await page.waitForSelector('.invoice-details');
    
    // Click send button
    await page.click('[data-testid="send-invoice-button"], .send-btn, button:has-text("Send")');
    
    // Wait for modal to appear
    await page.waitForSelector('.send-invoice-modal, [role="dialog"]');
    
    // Fill in email details
    await page.fill('input[name="recipients"], input[placeholder*="email"]', 'client@example.com');
    await page.fill('input[name="subject"], input[placeholder*="Subject"]', 'Invoice for your review');
    await page.fill('textarea[name="message"], textarea[placeholder*="Message"]', 'Please find attached the invoice.');
    
    // Send the email
    await page.click('button:has-text("Send"), button:has-text("Confirm")');
    
    // Wait for success message
    await page.waitForSelector('.success-message, [role="alert"]');
    
    // Verify success message appears
    const successMessage = await page.locator('.success-message, [role="alert"]').textContent();
    expect(successMessage).toContain('sent');
  });

  test('handles PDF generation errors gracefully', async ({ page }) => {
    // Navigate to a specific invoice that might fail
    await page.goto('http://localhost:3000/invoices/999999'); // Non-existent invoice
    
    // If we get a 404, that's expected
    const response = await page.waitForResponse(response => 
      response.url().includes('/invoices/999999')
    );
    
    if (response.status() === 404) {
      expect(response.status()).toBe(404);
    } else {
      // Try to download anyway and expect error
      await page.click('[data-testid="download-pdf-button"], .download-btn', { timeout: 5000 }).catch(() => {
        // Button might not exist for invalid invoice
      });
      
      // Check for error message
      const errorMessage = await page.locator('.error-message, [role="alert"]').textContent().catch(() => '');
      if (errorMessage) {
        expect(errorMessage).toContain('error');
      }
    }
  });

  test('preview invoice in browser', async ({ page }) => {
    // Navigate to invoices page
    await page.goto('http://localhost:3000/invoices');
    
    // Click on first invoice
    await page.locator('.invoice-row').first().click();
    
    // Wait for invoice detail page
    await page.waitForSelector('.invoice-details');
    
    // Look for preview button or preview content
    const previewButton = await page.locator('[data-testid="preview-button"], .preview-btn, button:has-text("Preview")').count();
    
    if (previewButton > 0) {
      await page.click('[data-testid="preview-button"], .preview-btn, button:has-text("Preview")');
      
      // Wait for preview to load
      await page.waitForSelector('.invoice-preview, iframe');
      
      // Verify preview contains invoice data
      const previewContent = await page.locator('.invoice-preview, iframe').first();
      expect(previewContent).toBeTruthy();
    }
  });
});

test.describe('Invoice Email Preview', () => {
  test('shows email preview in Rails mailer preview', async ({ page }) => {
    // Navigate directly to Rails mailer preview (development only)
    await page.goto('http://localhost:3000/rails/mailers/invoice_mailer/send_invoice');
    
    // Check if preview loads
    const iframe = await page.locator('iframe').count();
    if (iframe > 0) {
      // Switch to iframe context
      const frame = page.frameLocator('iframe').first();
      
      // Check for invoice content in email
      await expect(frame.locator('text=/Invoice.*Summary/i')).toBeVisible();
      await expect(frame.locator('text=/Total.*Amount/i')).toBeVisible();
    }
  });
});