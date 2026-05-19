/**
 * Organization Settings — Mobile Validation.
 * Covers: required field validation and numeric validation on a mobile viewport.
 */
import { test, expect } from "@playwright/test";
import { goToOrgEdit } from "./helpers";

test.describe("Organization Settings — Mobile Validation", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("shows validation error when company name is empty", async ({ page }) => {
        await goToOrgEdit(page);

        const nameInput = page.locator("input[aria-label='Company Name']");
        await expect(nameInput).toBeVisible({ timeout: 10_000 });

        await nameInput.fill("");

        const rateInput = page.locator("input[aria-label='Standard Rate']");
        const originalRate = await rateInput.inputValue();
        await rateInput.fill(originalRate);

        const saveBtn = page.getByRole("button", { name: /save changes/i });
        if (await saveBtn.isEnabled()) {
            await saveBtn.click();
        }

        await expect(page.locator(".text-destructive").first()).toBeVisible({
            timeout: 10_000,
        });

        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("shows validation error when address line 1 is empty", async ({ page }) => {
        await goToOrgEdit(page);

        const addr1 = page.locator("input[aria-label='Address Line 1']");
        await expect(addr1).toBeVisible({ timeout: 10_000 });

        await addr1.fill("");

        const saveBtn = page.getByRole("button", { name: /save changes/i });
        if (await saveBtn.isEnabled()) {
            await saveBtn.click();
        }

        await expect(page.locator(".text-destructive").first()).toBeVisible({
            timeout: 10_000,
        });

        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("shows validation error for a negative standard rate", async ({ page }) => {
        await goToOrgEdit(page);

        const rateInput = page.locator("input[aria-label='Standard Rate']");
        await expect(rateInput).toBeVisible({ timeout: 10_000 });

        await rateInput.fill("-100");

        const saveBtn = page.getByRole("button", { name: /save changes/i });
        if (await saveBtn.isEnabled()) {
            await saveBtn.click();
        }

        await expect(page.locator(".text-destructive").first()).toBeVisible({
            timeout: 10_000,
        });

        await page.getByRole("button", { name: /cancel/i }).click();
    });
});
