/**
 * Profile Settings — Edit Form Fields.
 * Covers: all form inputs visibility and editability.
 */
import { test, expect } from "@playwright/test";
import { goToProfileEdit } from "./helpers";

test.describe("Profile Settings — Edit Form Fields", () => {
    test("first name input is editable", async ({ page }) => {
        await goToProfileEdit(page);
        const input = page.locator("#first_name");
        await expect(input).toBeVisible();
        await expect(input).toBeEditable();
    });

    test("last name input is editable", async ({ page }) => {
        await goToProfileEdit(page);
        const input = page.locator("#last_name");
        await expect(input).toBeVisible();
        await expect(input).toBeEditable();
    });

    test("date of birth field is present", async ({ page }) => {
        await goToProfileEdit(page);
        const input = page.locator("#date_of_birth");
        await expect(input).toBeVisible();
    });

    test("phone number input is present", async ({ page }) => {
        await goToProfileEdit(page);
        const input = page.locator("#phone_number");
        await expect(input).toBeAttached();
    });

    test("personal email input is editable", async ({ page }) => {
        await goToProfileEdit(page);
        const input = page.locator("#email_id");
        await expect(input).toBeVisible();
        await expect(input).toBeEditable();
    });

    test("address line 1 input is editable", async ({ page }) => {
        await goToProfileEdit(page);
        const input = page.locator("#address_line_1");
        await input.scrollIntoViewIfNeeded();
        await expect(input).toBeVisible();
        await expect(input).toBeEditable();
    });

    test("LinkedIn URL input is present", async ({ page }) => {
        await goToProfileEdit(page);
        const input = page.locator("#linkedin");
        await input.scrollIntoViewIfNeeded();
        await expect(input).toBeVisible();
    });

    test("GitHub URL input is present", async ({ page }) => {
        await goToProfileEdit(page);
        const input = page.locator("#github");
        await input.scrollIntoViewIfNeeded();
        await expect(input).toBeVisible();
    });

    test("profile image upload button is visible", async ({ page }) => {
        await goToProfileEdit(page);
        // The upload button has a data-testid
        await expect(page.locator("[data-testid='profile-image-edit-trigger']")).toBeVisible({ timeout: 10_000 });
    });

    test("passkeys panel is visible", async ({ page }) => {
        await goToProfileEdit(page);
        const passkeysTitle = page.getByText(/passkeys/i).first();
        await passkeysTitle.scrollIntoViewIfNeeded();
        await expect(passkeysTitle).toBeVisible();
        await expect(page.getByRole("button", { name: /add passkey/i })).toBeVisible();
    });

    test("authenticator app 2FA panel is visible", async ({ page }) => {
        await goToProfileEdit(page);
        // The title is "Authenticator App 2FA"
        const totpTitle = page.getByText(/authenticator app/i).first();
        await totpTitle.scrollIntoViewIfNeeded();
        await expect(totpTitle).toBeVisible({ timeout: 10_000 });
    });
});
