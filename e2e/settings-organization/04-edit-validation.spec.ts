/**
 * Organization Settings — Edit Form Validation.
 * Covers: required field validation, format validation.
 */
import { test, expect } from "@playwright/test";
import { goToOrgEdit } from "./helpers";

test.describe("Organization Settings — Edit Validation", () => {
    test("validation error when company name is empty", async ({ page }) => {
        await goToOrgEdit(page);

        const nameInput = page.locator("input[aria-label='Company Name']");
        await expect(nameInput).toBeVisible({ timeout: 10_000 });

        // Clear the name and make a change to enable save
        await nameInput.fill("");

        // Also change another field to enable the save button
        const rateInput = page.locator("input[aria-label='Standard Rate']");
        const originalRate = await rateInput.inputValue();
        await rateInput.fill(originalRate);

        // Try to save
        const saveBtn = page.getByRole("button", { name: /save changes/i });
        // The button may be enabled since we changed fields
        if (await saveBtn.isEnabled()) {
            await saveBtn.click();
        }

        // Should show validation error
        await expect(page.locator(".text-destructive").first()).toBeVisible({ timeout: 10_000 });

        // Cancel to clean up
        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("validation error when address line 1 is empty", async ({ page }) => {
        await goToOrgEdit(page);

        const addr1 = page.locator("input[aria-label='Address Line 1']");
        await expect(addr1).toBeVisible({ timeout: 10_000 });

        // Clear address line 1
        await addr1.fill("");

        // Try to save
        const saveBtn = page.getByRole("button", { name: /save changes/i });
        if (await saveBtn.isEnabled()) {
            await saveBtn.click();
        }

        // Should show validation error
        await expect(page.locator(".text-destructive").first()).toBeVisible({ timeout: 10_000 });

        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("validation error for negative standard rate", async ({ page }) => {
        await goToOrgEdit(page);

        const rateInput = page.locator("input[aria-label='Standard Rate']");
        await expect(rateInput).toBeVisible({ timeout: 10_000 });

        // Enter a negative rate
        await rateInput.fill("-100");

        const saveBtn = page.getByRole("button", { name: /save changes/i });
        if (await saveBtn.isEnabled()) {
            await saveBtn.click();
        }

        // Should show validation error
        await expect(page.locator(".text-destructive").first()).toBeVisible({ timeout: 10_000 });

        await page.getByRole("button", { name: /cancel/i }).click();
    });
});
