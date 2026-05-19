/**
 * Preferences Settings — Unsubscribe Flow.
 * Covers: unsubscribe confirmation, unsubscribed state, re-enable.
 * Each test restores original preferences after modification.
 */
import { test, expect } from "@playwright/test";
import {
    fetchCurrentUser,
    fetchPreferences,
    goToPreferences,
    updatePreferences,
} from "./helpers";

test.describe("Preferences Settings — Unsubscribe Flow", () => {
    test("clicking Unsubscribe shows confirmation dialog", async ({ page }) => {
        await goToPreferences(page);

        const unsubBtn = page.getByRole("button", { name: /unsubscribe from all emails/i });
        await unsubBtn.scrollIntoViewIfNeeded();
        await unsubBtn.click();

        // Confirmation dialog should appear
        await expect(
            page.getByText(/confirm unsubscribe from all emails/i),
        ).toBeVisible({ timeout: 5_000 });

        // "Yes, Unsubscribe from All" button should be visible
        await expect(
            page.getByRole("button", { name: /yes, unsubscribe from all/i }),
        ).toBeVisible();

        // Cancel button should also be visible
        await expect(
            page.getByRole("button", { name: /cancel/i }),
        ).toBeVisible();
    });

    test("unsubscribe from all emails only flips the unsubscribe flag", async ({
        page,
    }) => {
        const user = await fetchCurrentUser(page);
        const originalPreferences = await fetchPreferences(page, user.id);

        try {
            await goToPreferences(page);

            const unsubBtn = page.getByRole("button", {
                name: /unsubscribe from all emails/i,
            });
            await unsubBtn.scrollIntoViewIfNeeded();
            await unsubBtn.click();

            await page.getByRole("button", { name: /yes, unsubscribe from all/i }).click();
            const saveResponse = page.waitForResponse(
                response =>
                    response.url().includes("/notification_preferences") &&
                    response.request().method() === "PATCH" &&
                    response.ok()
            );
            await page.getByRole("button", { name: /save changes/i }).click();
            const savedPreferences = await saveResponse.then(response => response.json());

            expect(savedPreferences.unsubscribed_from_all).toBe(true);
            expect(savedPreferences.notification_enabled).toBe(
                originalPreferences.notification_enabled
            );
            expect(savedPreferences.invoice_email_notifications).toBe(
                originalPreferences.invoice_email_notifications
            );
            expect(savedPreferences.payment_email_notifications).toBe(
                originalPreferences.payment_email_notifications
            );
            expect(savedPreferences.timesheet_reminder_enabled).toBe(
                originalPreferences.timesheet_reminder_enabled
            );
            expect(savedPreferences.monthly_report_digest_enabled).toBe(
                originalPreferences.monthly_report_digest_enabled
            );

            await expect(
                page.getByRole("button", { name: /save changes/i })
            ).toBeHidden({ timeout: 10_000 });
            await expect(
                page.getByText(/you're unsubscribed from all emails/i)
            ).toBeVisible();
        } finally {
            await updatePreferences(page, user.id, {
                notification_enabled: originalPreferences.notification_enabled,
                timesheet_reminder_enabled:
                    originalPreferences.timesheet_reminder_enabled,
                invoice_email_notifications:
                    originalPreferences.invoice_email_notifications,
                payment_email_notifications:
                    originalPreferences.payment_email_notifications,
                monthly_report_digest_enabled:
                    originalPreferences.monthly_report_digest_enabled,
                unsubscribed_from_all: false,
            });
        }
    });

    test("cancelling unsubscribe confirmation dismisses dialog", async ({ page }) => {
        await goToPreferences(page);

        const unsubBtn = page.getByRole("button", { name: /unsubscribe from all emails/i });
        await unsubBtn.scrollIntoViewIfNeeded();
        await unsubBtn.click();

        await expect(
            page.getByText(/confirm unsubscribe from all emails/i),
        ).toBeVisible({ timeout: 5_000 });

        // Click Cancel
        await page.getByRole("button", { name: /cancel/i }).first().click();

        // Confirmation should disappear
        await expect(
            page.getByText(/confirm unsubscribe from all emails/i),
        ).toBeHidden({ timeout: 5_000 });
    });

    test("confirming unsubscribe disables all toggles and shows unsubscribed alert", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const originalPrefs = await fetchPreferences(page, user.id);

        try {
            await goToPreferences(page);

            const unsubBtn = page.getByRole("button", { name: /unsubscribe from all emails/i });
            await unsubBtn.scrollIntoViewIfNeeded();
            await unsubBtn.click();

            // Confirm
            await page.getByRole("button", { name: /yes, unsubscribe from all/i }).click();

            // Unsubscribed alert should appear
            await expect(
                page.getByText(/you're unsubscribed from all emails/i),
            ).toBeVisible({ timeout: 5_000 });

            // Re-enable button should be visible
            await expect(
                page.getByRole("button", { name: /re-enable email notifications/i }),
            ).toBeVisible();

            // All switches should be disabled
            const switches = page.locator("[role='switch']");
            const count = await switches.count();
            for (let i = 0; i < count; i++) {
                await expect(switches.nth(i)).toBeDisabled();
            }

            // Save to persist, then cancel to avoid saving
            await page.getByRole("button", { name: /cancel/i }).click();
        } finally {
            // Restore original preferences
            await updatePreferences(page, user.id, {
                notification_enabled: originalPrefs.notification_enabled,
                timesheet_reminder_enabled: originalPrefs.timesheet_reminder_enabled,
                invoice_email_notifications: originalPrefs.invoice_email_notifications,
                payment_email_notifications: originalPrefs.payment_email_notifications,
                unsubscribed_from_all: false,
            });
        }
    });

    test("re-enable button restores toggles", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const originalPrefs = await fetchPreferences(page, user.id);

        try {
            await goToPreferences(page);

            // Unsubscribe first
            const unsubBtn = page.getByRole("button", { name: /unsubscribe from all emails/i });
            await unsubBtn.scrollIntoViewIfNeeded();
            await unsubBtn.click();
            await page.getByRole("button", { name: /yes, unsubscribe from all/i }).click();

            await expect(
                page.getByRole("button", { name: /re-enable email notifications/i }),
            ).toBeVisible({ timeout: 5_000 });

            // Click Re-enable
            await page.getByRole("button", { name: /re-enable email notifications/i }).click();

            // Unsubscribed alert should disappear
            await expect(
                page.getByText(/you're unsubscribed from all emails/i),
            ).toBeHidden({ timeout: 5_000 });

            // Switches should be enabled again
            const firstSwitch = page.locator("[role='switch']").first();
            await expect(firstSwitch).toBeEnabled();

            // Cancel to avoid saving
            await page.getByRole("button", { name: /cancel/i }).click();
        } finally {
            await updatePreferences(page, user.id, {
                notification_enabled: originalPrefs.notification_enabled,
                timesheet_reminder_enabled: originalPrefs.timesheet_reminder_enabled,
                invoice_email_notifications: originalPrefs.invoice_email_notifications,
                payment_email_notifications: originalPrefs.payment_email_notifications,
                unsubscribed_from_all: false,
            });
        }
    });
});
