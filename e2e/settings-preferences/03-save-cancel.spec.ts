/**
 * Preferences Settings — Save & Cancel.
 * Covers: save/cancel button visibility, toggling and saving, cancel reverting.
 * Each test restores original preferences after modification.
 */
import { test, expect } from "@playwright/test";
import { goToPreferences, fetchCurrentUser, fetchPreferences, updatePreferences } from "./helpers";

test.describe("Preferences Settings — Save & Cancel", () => {
    test("save and cancel buttons are hidden initially", async ({ page }) => {
        await goToPreferences(page);
        // No Save Changes button should be visible on initial load
        await expect(page.getByRole("button", { name: /save changes/i })).toBeHidden();
    });

    test("toggling a preference shows save and cancel buttons", async ({ page }) => {
        await goToPreferences(page);

        // Click the first toggle switch
        const firstSwitch = page.locator("[role='switch']").first();
        await firstSwitch.click();

        // Save and Cancel buttons should appear
        await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible({ timeout: 5_000 });
        await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    });

    test("cancel reverts toggle to original state", async ({ page }) => {
        await goToPreferences(page);

        // Get the initial state of the first switch
        const firstSwitch = page.locator("[role='switch']").first();
        const initialChecked = await firstSwitch.getAttribute("data-state");

        // Toggle it
        await firstSwitch.click();

        // Cancel
        await page.getByRole("button", { name: /cancel/i }).click();

        // Should revert to original state
        const afterCancel = await firstSwitch.getAttribute("data-state");
        expect(afterCancel).toBe(initialChecked);

        // Save button should be hidden again
        await expect(page.getByRole("button", { name: /save changes/i })).toBeHidden();
    });

    test("save persists the toggle change", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const originalPrefs = await fetchPreferences(page, user.id);

        try {
            await goToPreferences(page);

            // Find the weekly_reminder switch and get its current state
            const weeklySwitch = page.locator("#weekly_reminder");
            const initialState = await weeklySwitch.getAttribute("data-state");

            // Toggle it
            await weeklySwitch.click();

            // Save
            await page.getByRole("button", { name: /save changes/i }).click();

            // Wait for save to complete — buttons should disappear
            await expect(page.getByRole("button", { name: /save changes/i })).toBeHidden({ timeout: 10_000 });

            // Verify the switch state changed
            const newState = await weeklySwitch.getAttribute("data-state");
            expect(newState).not.toBe(initialState);
        } finally {
            // Restore original preferences via API
            await updatePreferences(page, user.id, {
                notification_enabled: originalPrefs.notification_enabled,
                timesheet_reminder_enabled: originalPrefs.timesheet_reminder_enabled,
                invoice_email_notifications: originalPrefs.invoice_email_notifications,
                payment_email_notifications: originalPrefs.payment_email_notifications,
                unsubscribed_from_all: originalPrefs.unsubscribed_from_all,
            });
        }
    });

    test("enabled count badge updates after toggle", async ({ page }) => {
        await goToPreferences(page);

        // Get the initial count text
        const countBadge = page.getByText(/of \d+ enabled/i).first();
        const initialText = await countBadge.innerText();

        // Toggle a switch
        const firstSwitch = page.locator("[role='switch']").first();
        await firstSwitch.click();

        // The count should change
        const newText = await countBadge.innerText();
        expect(newText).not.toBe(initialText);

        // Cancel to revert
        await page.getByRole("button", { name: /cancel/i }).click();
    });
});
