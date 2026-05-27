/**
 * Preferences Settings — Notification Toggles.
 * Covers: all 5 toggle switches, their labels, descriptions, and badges.
 */
import { test, expect } from "@playwright/test";
import {
    fetchCurrentUser,
    fetchPreferences,
    goToPreferences,
    updatePreferences,
} from "./helpers";

test.describe("Preferences Settings — Notification Toggles", () => {
    test("Weekly Timesheet Reminder toggle is visible", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText(/weekly timesheet reminder/i)).toBeVisible();
        // The switch should be present
        await expect(page.locator("#weekly_reminder")).toBeAttached();
    });

    test("Missing Entry Reminders toggle is visible", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText(/missing entry reminders/i)).toBeVisible();
        await expect(page.locator("#timesheet_reminder")).toBeAttached();
    });

    test("Invoice Email Notifications toggle is visible for admin", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText(/invoice email notifications/i)).toBeVisible();
        await expect(page.locator("#invoice_notifications")).toBeAttached();
    });

    test("Payment Email Notifications toggle is visible for admin", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText(/payment email notifications/i)).toBeVisible();
        await expect(page.locator("#payment_notifications")).toBeAttached();
    });

    test("Monthly Cash Flow Digest toggle is visible for admin", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText(/monthly cash flow digest/i)).toBeVisible();
        await expect(page.locator("#monthly_report_digest")).toBeAttached();
    });

    test("Active badge is visible on weekly reminder", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText("Active").first()).toBeVisible();
    });

    test("Important badge is visible on invoice notifications", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText("Important").first()).toBeVisible();
    });

    test("Monthly badge is visible on digest", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText("Monthly").first()).toBeVisible();
    });

    test("enabled count badge is visible on category cards", async ({ page }) => {
        await goToPreferences(page);
        // Should show "X of Y enabled" badge on at least one category
        await expect(page.getByText(/of \d+ enabled/i).first()).toBeVisible();
    });

    test("notification toggles can be switched off and persisted", async ({
        page,
    }) => {
        const user = await fetchCurrentUser(page);
        const originalPreferences = await fetchPreferences(page, user.id);

        const toggleMap = [
            {
                selector: "#weekly_reminder",
                key: "notification_enabled",
            },
            {
                selector: "#timesheet_reminder",
                key: "timesheet_reminder_enabled",
            },
            {
                selector: "#invoice_notifications",
                key: "invoice_email_notifications",
            },
            {
                selector: "#payment_notifications",
                key: "payment_email_notifications",
            },
            {
                selector: "#monthly_report_digest",
                key: "monthly_report_digest_enabled",
            },
        ] as const;

        try {
            await goToPreferences(page);

            const initialStates = new Map<string, string | null>();
            for (const { selector } of toggleMap) {
                initialStates.set(
                    selector,
                    await page.locator(selector).getAttribute("data-state")
                );
            }

            for (const { selector } of toggleMap) {
                await page.locator(selector).click();
            }

            await expect(
                page.getByRole("button", { name: /save changes/i })
            ).toBeVisible({ timeout: 5_000 });
            const saveResponse = page.waitForResponse(
                response =>
                    response.url().includes("/notification_preferences") &&
                    response.request().method() === "PATCH" &&
                    response.ok()
            );
            await page.getByRole("button", { name: /save changes/i }).click();
            await saveResponse;
            await expect(
                page.getByRole("button", { name: /save changes/i })
            ).toBeHidden({ timeout: 10_000 });

            for (const { selector } of toggleMap) {
                const currentState = await page
                    .locator(selector)
                    .getAttribute("data-state");
                expect(currentState).not.toBe(initialStates.get(selector));
            }

            const updatedPreferences = await fetchPreferences(page, user.id);
            for (const { key } of toggleMap) {
                expect(updatedPreferences[key]).toBe(
                    !originalPreferences[key]
                );
            }
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
                unsubscribed_from_all:
                    originalPreferences.unsubscribed_from_all,
            });
        }
    });
});
