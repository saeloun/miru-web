/**
 * Profile Settings — Edit Page Navigation.
 * Covers: navigating to edit, form populated, cancel returns to details.
 */
import { test, expect } from "@playwright/test";
import { goToProfile, goToProfileEdit } from "./helpers";

test.describe("Profile Settings — Edit Navigation", () => {
    test("clicking Edit navigates to edit page", async ({ page }) => {
        await goToProfile(page);
        // The DetailsHeader has an Edit button
        await page.getByRole("button", { name: /edit/i }).first().click();
        await expect(page).toHaveURL(/\/settings\/profile\/edit/);
        await expect(page.locator("#first_name")).toBeVisible({ timeout: 10_000 });
    });

    test("edit page loads with first name populated", async ({ page }) => {
        await goToProfileEdit(page);
        const firstNameInput = page.locator("#first_name");
        const value = await firstNameInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
    });

    test("edit page loads with last name populated", async ({ page }) => {
        await goToProfileEdit(page);
        const lastNameInput = page.locator("#last_name");
        const value = await lastNameInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
    });

    test("cancel button returns to details page", async ({ page }) => {
        await goToProfileEdit(page);
        await page.getByRole("button", { name: /cancel/i }).click();
        await expect(page).toHaveURL(/\/settings\/profile$/);
        await expect(page.getByText(/personal information/i).first()).toBeVisible({ timeout: 10_000 });
    });
});
