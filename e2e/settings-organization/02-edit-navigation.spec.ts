/**
 * Organization Settings — Edit Page Navigation.
 * Covers: navigating to edit, form fields populated, cancel returns to details.
 */
import { test, expect } from "@playwright/test";
import { goToOrgSettings, goToOrgEdit, fetchCompanyDetails } from "./helpers";

test.describe("Organization Settings — Edit Navigation", () => {
    test("clicking Edit Settings navigates to edit page", async ({ page }) => {
        await goToOrgSettings(page);
        await page.getByRole("button", { name: /edit settings/i }).click();
        await expect(page).toHaveURL(/\/settings\/organization\/edit/);
        // Edit form should have Cancel and Save buttons
        await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible({ timeout: 10_000 });
        await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible();
    });

    test("edit page loads with company name populated", async ({ page }) => {
        const details = await fetchCompanyDetails(page);
        await goToOrgEdit(page);

        const nameInput = page.locator("input[aria-label='Company Name']");
        await expect(nameInput).toBeVisible({ timeout: 10_000 });
        await expect(nameInput).toHaveValue(details.name);
    });

    test("edit page loads with address fields populated", async ({ page }) => {
        await goToOrgEdit(page);

        const addr1 = page.locator("input[aria-label='Address Line 1']");
        await expect(addr1).toBeVisible({ timeout: 10_000 });
        // Address should have some value from seed data
        const value = await addr1.inputValue();
        expect(value.length).toBeGreaterThan(0);
    });

    test("edit page loads with standard rate populated", async ({ page }) => {
        await goToOrgEdit(page);

        const rateInput = page.locator("input[aria-label='Standard Rate']");
        await expect(rateInput).toBeVisible({ timeout: 10_000 });
        const value = await rateInput.inputValue();
        expect(parseFloat(value)).toBeGreaterThanOrEqual(0);
    });

    test("cancel button returns to details page", async ({ page }) => {
        await goToOrgEdit(page);
        await page.getByRole("button", { name: /cancel/i }).click();
        await expect(page).toHaveURL(/\/settings\/organization$/);
        // Details page should show the Edit Settings button
        await expect(page.getByRole("button", { name: /edit settings/i })).toBeVisible({ timeout: 10_000 });
    });
});
