import { test, expect } from "@playwright/test";
import { setupAuthenticatedSession } from "../helpers";

/**
 * Test Suite: Company Phone Number Validation
 *
 * Purpose: Verify that phone number validation works correctly for multiple countries
 * using libphonenumber-js on frontend and phonelib gem on backend.
 *
 * Coverage:
 * - Valid phone numbers from US, India, and UK
 * - Invalid phone numbers
 * - Phone numbers exceeding 15 character limit
 * - Empty/blank phone numbers
 * - Real-time validation feedback
 */

test.describe("Company Phone Number Validation", () => {
    test.beforeEach(async ({ page }) => {
        await setupAuthenticatedSession(page, "admin");
        await page.goto("/settings/organization");
        await page.waitForLoadState("networkidle");

        // Navigate to edit mode
        const editButton = page.locator('button:has-text("Edit Settings")');
        if (await editButton.isVisible()) {
            await editButton.click();
            await page.waitForLoadState("networkidle");
        }
    });

    test("should accept valid US phone number", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Clear existing value
        await phoneInput.clear();

        // Enter valid US phone number
        await phoneInput.fill("+14155552671");

        // Save changes
        await page.locator('button:has-text("Save Changes")').click();

        // Wait for success message
        await expect(page.locator('text=/Company details updated|Settings saved successfully/i')).toBeVisible({
            timeout: 10000
        });

        // Verify the phone number was saved
        await page.reload();
        await page.waitForLoadState("networkidle");

        const savedValue = await page.locator('text=/\\+1 415 555 2671|\\+14155552671/').first();
        await expect(savedValue).toBeVisible();
    });

    test("should accept valid Indian phone number", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Clear existing value
        await phoneInput.clear();

        // Enter valid Indian phone number
        await phoneInput.fill("+919876543210");

        // Save changes
        await page.locator('button:has-text("Save Changes")').click();

        // Wait for success message
        await expect(page.locator('text=/Company details updated|Settings saved successfully/i')).toBeVisible({
            timeout: 10000
        });

        // Verify the phone number was saved
        await page.reload();
        await page.waitForLoadState("networkidle");

        const savedValue = await page.locator('text=/\\+91 98765 43210|\\+919876543210/').first();
        await expect(savedValue).toBeVisible();
    });

    test("should accept valid UK phone number", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Clear existing value
        await phoneInput.clear();

        // Enter valid UK phone number
        await phoneInput.fill("+442071234567");

        // Save changes
        await page.locator('button:has-text("Save Changes")').click();

        // Wait for success message
        await expect(page.locator('text=/Company details updated|Settings saved successfully/i')).toBeVisible({
            timeout: 10000
        });

        // Verify the phone number was saved
        await page.reload();
        await page.waitForLoadState("networkidle");

        const savedValue = await page.locator('text=/\\+44 20 7123 4567|\\+442071234567/').first();
        await expect(savedValue).toBeVisible();
    });

    test("should reject invalid phone number", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Clear existing value
        await phoneInput.clear();

        // Enter invalid phone number
        await phoneInput.fill("123");

        // Trigger validation by blurring the field
        await phoneInput.blur();

        // Try to save
        await page.locator('button:has-text("Save Changes")').click();

        // Check for validation error message
        const errorMessage = page.locator('text=/Please enter a valid business phone number|Invalid phone number/i');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test("should reject phone number exceeding 15 characters", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Clear existing value
        await phoneInput.clear();

        // Enter phone number with more than 15 characters
        await phoneInput.fill("+1234567890123456");

        // Trigger validation by blurring the field
        await phoneInput.blur();

        // Try to save
        await page.locator('button:has-text("Save Changes")').click();

        // Check for validation error message
        const errorMessage = page.locator('text=/Maximum 15 characters|exceeds maximum length/i');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test("should allow blank phone number", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Clear existing value
        await phoneInput.clear();

        // Save with empty phone number
        await page.locator('button:has-text("Save Changes")').click();

        // Wait for success message
        await expect(page.locator('text=/Company details updated|Settings saved successfully/i')).toBeVisible({
            timeout: 10000
        });
    });

    test("should show real-time validation feedback", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Clear existing value
        await phoneInput.clear();

        // Start typing an invalid number
        await phoneInput.fill("12");
        await phoneInput.blur();

        // Wait a moment for validation
        await page.waitForTimeout(500);

        // Now type a valid number
        await phoneInput.clear();
        await phoneInput.fill("+14155552671");
        await phoneInput.blur();

        // Validation error should disappear
        const errorMessage = page.locator('text=/Please enter a valid business phone number|Invalid phone number/i');
        await expect(errorMessage).not.toBeVisible();
    });

    test("should enforce maxLength attribute on input", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Check if maxLength attribute is set
        const maxLength = await phoneInput.getAttribute("maxLength");
        expect(maxLength).toBe("15");

        // Try to type more than 15 characters
        await phoneInput.clear();
        await phoneInput.fill("+12345678901234567890");

        // Get the actual value
        const actualValue = await phoneInput.inputValue();

        // Value should be truncated to 15 characters
        expect(actualValue.length).toBeLessThanOrEqual(15);
    });

    test("should validate phone numbers with different formats", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Test various valid formats
        const validFormats = [
            "+14155552671",      // US with country code
            "+919876543210",     // India with country code
            "+442071234567",     // UK with country code
            "+61291234567",      // Australia
            "+33123456789",      // France
        ];

        for (const phoneNumber of validFormats) {
            await phoneInput.clear();
            await phoneInput.fill(phoneNumber);
            await phoneInput.blur();

            // Should not show error
            const errorMessage = page.locator('text=/Please enter a valid business phone number|Invalid phone number/i');
            await expect(errorMessage).not.toBeVisible();
        }
    });

    test("should reject clearly invalid formats", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Test various invalid formats
        const invalidFormats = [
            "abc",               // Letters only
            "123",               // Too short
            "00000000000",       // All zeros
            "+++123456789",      // Multiple plus signs
        ];

        for (const phoneNumber of invalidFormats) {
            await phoneInput.clear();
            await phoneInput.fill(phoneNumber);
            await phoneInput.blur();

            // Try to save
            await page.locator('button:has-text("Save Changes")').click();

            // Should show error
            const errorMessage = page.locator('text=/Please enter a valid business phone number|Invalid phone number|Maximum 15 characters/i');
            await expect(errorMessage).toBeVisible({ timeout: 3000 });

            // Wait a bit before next iteration
            await page.waitForTimeout(500);
        }
    });
});

test.describe("Company Phone Number Validation - Mobile View", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test.beforeEach(async ({ page }) => {
        await setupAuthenticatedSession(page, "admin");
        await page.goto("/settings/organization");
        await page.waitForLoadState("networkidle");

        // Navigate to edit mode
        const editButton = page.locator('button:has-text("Edit Settings")');
        if (await editButton.isVisible()) {
            await editButton.click();
            await page.waitForLoadState("networkidle");
        }
    });

    test("should validate phone number on mobile", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Clear and enter valid phone
        await phoneInput.clear();
        await phoneInput.fill("+14155552671");

        // Save
        await page.locator('button:has-text("Save Changes")').click();

        // Should succeed
        await expect(page.locator('text=/Company details updated|Settings saved successfully/i')).toBeVisible({
            timeout: 10000
        });
    });

    test("should show validation errors on mobile", async ({ page }) => {
        const phoneInput = page.locator('input[name="company_phone"]');

        // Enter invalid phone
        await phoneInput.clear();
        await phoneInput.fill("123");
        await phoneInput.blur();

        // Try to save
        await page.locator('button:has-text("Save Changes")').click();

        // Should show error
        const errorMessage = page.locator('text=/Please enter a valid business phone number|Invalid phone number/i');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
});
