/**
 * Preferences Settings — Page Load & Layout.
 * Covers: page load, title, notification categories, email delivery, unsubscribe section.
 */
import { test, expect } from "@playwright/test";
import { goToPreferences } from "./helpers";

test.describe("Preferences Settings — Page Load & Layout", () => {
    test("page loads with Email Preferences title", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.locator("h1").filter({ hasText: /email preferences/i })).toBeVisible();
    });

    test("page description is visible", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText(/manage your email notification settings/i)).toBeVisible();
    });

    test("Timesheet Notifications card is visible", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText(/timesheet notifications/i).first()).toBeVisible();
    });

    test("Billing Notifications card is visible for admin", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText(/billing notifications/i).first()).toBeVisible();
    });

    test("Email Delivery Settings card is visible", async ({ page }) => {
        await goToPreferences(page);
        await expect(page.getByText(/email delivery settings/i)).toBeVisible();
    });

    test("Email Delivery Settings card shows email address label", async ({ page }) => {
        await goToPreferences(page);
        const deliveryCard = page.getByText(/email delivery settings/i);
        await deliveryCard.scrollIntoViewIfNeeded();
        await expect(deliveryCard).toBeVisible();
        // The card should contain the user's email address text
        await expect(page.getByText(/email address/i).first()).toBeAttached();
    });

    test("Unsubscribe section is visible", async ({ page }) => {
        await goToPreferences(page);
        const unsubscribeCard = page.getByText(/unsubscribe from all emails/i).first();
        await unsubscribeCard.scrollIntoViewIfNeeded();
        await expect(unsubscribeCard).toBeVisible();
    });
});
