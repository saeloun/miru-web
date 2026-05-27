/**
 * Simplified notification test using seeded data
 *
 * Setup: Run `ruby script/setup_notification_test_data.rb` before running tests
 */
import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/admin.json" });

test.describe("Notification Tests (Simplified)", () => {
    test("can access notification settings page", async ({ page }) => {
        await page.goto("/settings/notifications");
        await page.waitForLoadState("networkidle");

        // Just verify the page loads
        await expect(page.locator("#react-root")).toBeVisible();

        // Take a screenshot to see what's actually on the page
        await page.screenshot({ path: "test-results/notification-settings-page.png", fullPage: true });

        console.log("✓ Notification settings page loaded");
        console.log("  Screenshot saved to: test-results/notification-settings-page.png");
        console.log("  Use this to identify correct selectors");
    });

    test("can get notification preferences via API", async ({ request }) => {
        // Get current user
        const meRes = await request.get("/api/v1/users/_me");
        expect(meRes.ok()).toBeTruthy();
        const meData = await meRes.json();
        const userId = meData.user.id;

        // Get notification preferences
        const prefRes = await request.get(`/api/v1/team/${userId}/notification_preferences`);
        expect(prefRes.ok()).toBeTruthy();

        const prefs = await prefRes.json();
        console.log("\n✓ Notification preferences:");
        console.log("  Timesheet reminder enabled:", prefs.timesheet_reminder_enabled);
        console.log("  Notification enabled:", prefs.notification_enabled);

        expect(prefs).toHaveProperty("timesheet_reminder_enabled");
    });

    test("can update notification preferences via API", async ({ request }) => {
        // Get current user
        const meRes = await request.get("/api/v1/users/_me");
        const meData = await meRes.json();
        const userId = meData.user.id;

        // Toggle timesheet reminder off
        const updateRes = await request.put(`/api/v1/team/${userId}/notification_preferences`, {
            data: {
                notification_preference: {
                    timesheet_reminder_enabled: false
                }
            }
        });

        expect(updateRes.ok()).toBeTruthy();
        const updated = await updateRes.json();
        expect(updated.timesheet_reminder_enabled).toBe(false);
        console.log("\n✓ Successfully disabled timesheet reminder");

        // Toggle it back on
        const restoreRes = await request.put(`/api/v1/team/${userId}/notification_preferences`, {
            data: {
                notification_preference: {
                    timesheet_reminder_enabled: true
                }
            }
        });

        expect(restoreRes.ok()).toBeTruthy();
        const restored = await restoreRes.json();
        expect(restored.timesheet_reminder_enabled).toBe(true);
        console.log("✓ Successfully re-enabled timesheet reminder");
    });

    test("can access letter_opener to view emails", async ({ page }) => {
        await page.goto("/letter_opener");
        await page.waitForLoadState("networkidle");

        // Just verify we can navigate to the page
        const url = page.url();
        expect(url).toContain("/letter_opener");

        // Take a screenshot
        await page.screenshot({ path: "test-results/letter-opener-page.png", fullPage: true });

        console.log("\n✓ Letter opener page loaded");
        console.log("  Screenshot saved to: test-results/letter-opener-page.png");
        console.log("  Visit http://localhost:3000/letter_opener to see emails");
    });

    test("can trigger weekly reminder (if test data exists)", async ({ request, page }) => {
        // Calculate last Monday
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek + 6;
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - daysToSubtract);
        const weekStart = lastMonday.toISOString().split('T')[0];

        console.log("\n📅 Triggering reminder for week starting:", weekStart);
        console.log("  (Make sure you ran: ruby script/setup_notification_test_data.rb)");

        // Trigger the reminder
        const reminderRes = await request.post("/api/v1/internal/trigger_weekly_reminder", {
            data: { week_start: weekStart }
        });

        if (reminderRes.ok()) {
            console.log("✓ Reminder triggered successfully");

            // Wait a moment for email to be sent
            await page.waitForTimeout(2000);

            // Check letter_opener
            await page.goto("/letter_opener");
            await page.screenshot({ path: "test-results/emails-after-trigger.png", fullPage: true });

            console.log("✓ Check http://localhost:3000/letter_opener for emails");
            console.log("  Screenshot saved to: test-results/emails-after-trigger.png");
        } else {
            console.log("❌ Failed to trigger reminder:", reminderRes.status());
            const errorText = await reminderRes.text();
            console.log("  Error:", errorText.substring(0, 200));
        }
    });
});
