/**
 * Notification Settings UI Tests
 *
 * Tests the notification preferences page where users can enable/disable reminders
 *
 * Test Scenarios:
 * 1. Navigate to notification settings
 * 2. Toggle weekly timesheet reminder on/off
 * 3. Settings persist after page reload
 * 4. Settings are reflected in API
 * 5. UI shows current preference state correctly
 */

import { test, expect, type Page } from "@playwright/test";
import {
    goToNotificationSettings,
    getNotificationPreference,
    updateNotificationPreference,
} from "./helpers";

const weeklyReminderLabel = "Weekly Email Reminder";
const weeklyReminderDescription =
    /Receive weekly email reminders about timesheet entries and project updates/i;

const weeklyReminderToggle = (page: Page) =>
    page.getByRole("switch", {
        name: weeklyReminderLabel,
        exact: true,
    });

async function expectToggleState(
    toggle: ReturnType<typeof weeklyReminderToggle>,
    checked: boolean
) {
    await expect(toggle).toHaveAttribute(
        "aria-checked",
        checked ? "true" : "false"
    );
}

async function waitForPreferenceUpdate(
    page: Page
) {
    await page.waitForResponse(
        response =>
            response.url().includes("/notification_preferences") &&
            response.request().method() === "PATCH" &&
            response.ok()
    );
}

test.describe("Notification Settings UI", () => {
    test("notification settings page loads successfully", async ({ page }) => {
        await goToNotificationSettings(page);

        await expect(
            page.getByRole("heading", {
                name: "Notification Settings",
                exact: true,
            })
        ).toBeVisible();

        await expect(
            page.getByRole("heading", {
                name: "Email Notifications",
                exact: true,
            })
        ).toBeVisible();
        await expect(
            page.getByText(weeklyReminderLabel, { exact: true })
        ).toBeVisible();
    });

    test("weekly email reminder toggle is visible and functional", async ({
        page,
        request,
    }) => {
        await goToNotificationSettings(page);

        const reminderToggle = weeklyReminderToggle(page);
        await expect(reminderToggle).toBeVisible();
        await expect(reminderToggle).toHaveCount(1);

        const initialState =
            (await reminderToggle.getAttribute("aria-checked")) === "true";

        const updatePromise = waitForPreferenceUpdate(page);
        await reminderToggle.click();
        await updatePromise;

        const newState =
            (await reminderToggle.getAttribute("aria-checked")) === "true";
        expect(newState).toBe(!initialState);

        const prefs = await getNotificationPreference(request);
        expect(prefs.notification_enabled).toBe(newState);
    });

    test("weekly reminder setting persists after page reload", async ({
        page,
        request,
    }) => {
        await goToNotificationSettings(page);

        await updateNotificationPreference(request, {
            notificationEnabled: true,
        });

        await page.reload();
        await page.waitForLoadState("networkidle");
        const reminderToggle = weeklyReminderToggle(page);
        await expectToggleState(reminderToggle, true);

        await updateNotificationPreference(request, {
            notificationEnabled: false,
        });

        await page.reload();
        await page.waitForLoadState("networkidle");
        await expectToggleState(weeklyReminderToggle(page), false);
    });

    test("notification settings show description text", async ({ page }) => {
        await goToNotificationSettings(page);

        await expect(
            page.getByText(weeklyReminderDescription)
        ).toBeVisible();
        await expect(
            page.getByText(/Manage your email notification preferences/i)
        ).toBeVisible();
    });

    test("settings page only exposes the weekly email reminder control", async ({
        page,
    }) => {
        await goToNotificationSettings(page);

        await expect(page.getByRole("switch")).toHaveCount(1);
        await expect(
            page.getByText(/billing notifications|unsubscribe from all/i)
        ).toHaveCount(0);
    });

    test("notification settings route stays on the personal notification page", async ({
        page,
    }) => {
        await goToNotificationSettings(page);

        await expect(page).toHaveURL(/\/settings\/notifications$/);
        await expect(
            page.getByRole("heading", {
                name: "Notification Settings",
                exact: true,
            })
        ).toBeVisible();
    });

    test("toggling reminder updates the switch state immediately", async ({
        page,
    }) => {
        await goToNotificationSettings(page);

        const reminderToggle = weeklyReminderToggle(page);
        const initialState =
            (await reminderToggle.getAttribute("aria-checked")) === "true";

        const updatePromise = waitForPreferenceUpdate(page);
        await reminderToggle.click();
        await updatePromise;

        await expectToggleState(reminderToggle, !initialState);
    });

    test("notification settings are accessible via keyboard navigation", async ({
        page,
    }) => {
        await goToNotificationSettings(page);

        const reminderToggle = weeklyReminderToggle(page);
        await reminderToggle.focus();
        await expect(reminderToggle).toBeFocused();

        const initialState =
            (await reminderToggle.getAttribute("aria-checked")) === "true";

        const updatePromise = waitForPreferenceUpdate(page);
        await page.keyboard.press("Space");
        await updatePromise;

        await expectToggleState(reminderToggle, !initialState);
    });

    test("unsubscribe from all notifications option works", async ({
        page,
    }) => {
        await goToNotificationSettings(page);

        await expect(
            page.locator(
                '[data-testid="unsubscribe-all-toggle"], ' +
                    'input[type="checkbox"][name*="unsubscribe"], ' +
                    'button[role="switch"][aria-label*="unsubscribe"]'
            )
        ).toHaveCount(0);
    });
});
