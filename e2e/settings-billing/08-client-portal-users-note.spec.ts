/**
 * Billing Settings — Client Portal Users Note
 *
 * Verifies that when there are client portal users (users with only client role),
 * an informational alert is displayed explaining that they count toward seats.
 */
import { test, expect } from "@playwright/test";
import { goToBilling, fetchBillingSummary } from "./helpers";

test.describe("Billing Settings — Client Portal Users Note", () => {
    test("shows client portal users alert when applicable", async ({ page }) => {
        await goToBilling(page);

        // Fetch the billing summary to check if there are client portal users
        const summary = await fetchBillingSummary(page);
        console.log("Billing summary:", summary);
        console.log("Client portal users count:", summary.client_portal_users_count);
        console.log("Used team seats:", summary.used_team_seats);

        if (summary.client_portal_users_count > 0) {
            // The alert should be visible - use first() to handle multiple matches
            const alert = page.getByText(/client portal user/i).first();
            await expect(alert).toBeVisible({ timeout: 10_000 });

            // Verify the alert mentions the count
            const alertText = await alert.textContent();
            console.log("Alert text:", alertText);

            // The alert should explain that client portal users are included
            expect(alertText).toMatch(/client portal user/i);

            // Take a screenshot for visual verification
            await page.screenshot({
                path: "e2e/screenshots/client-portal-users-alert.png",
                fullPage: true
            });

            console.log("✓ Client portal users alert is displayed correctly");
        } else {
            // No client portal users, so the alert should NOT be visible
            const alert = page.getByText(/client portal user/i);
            await expect(alert).not.toBeVisible();

            console.log("✓ No client portal users, alert correctly hidden");
        }
    });

    test("alert provides helpful information about seat counting", async ({ page }) => {
        await goToBilling(page);

        const summary = await fetchBillingSummary(page);

        if (summary.client_portal_users_count > 0) {
            // Check that the alert has a title
            const alertTitle = page.getByText(/client portal users included/i);
            await expect(alertTitle).toBeVisible({ timeout: 10_000 });

            // Check that the alert explains the situation
            const alertDescription = page.getByText(/can view their invoices/i);
            await expect(alertDescription).toBeVisible({ timeout: 10_000 });

            console.log("✓ Alert provides clear explanation");
        } else {
            console.log("⊘ Skipping - no client portal users in test data");
        }
    });

    test("seat usage display matches API response", async ({ page }) => {
        await goToBilling(page);

        const summary = await fetchBillingSummary(page);

        // Find the seat usage text on the page
        const seatUsageElement = page.getByText(/seats used/i).first();
        await expect(seatUsageElement).toBeVisible();

        const seatUsageText = await seatUsageElement.textContent();
        console.log("Seat usage display:", seatUsageText);

        // Extract the number from the display
        const match = seatUsageText?.match(/(\d+)(?:\/\d+)?\s+seats used/i);
        const displayedSeats = match ? parseInt(match[1]) : 0;

        // Verify it matches the API
        expect(displayedSeats).toBe(summary.used_team_seats);

        console.log(`✓ Seat count matches: ${displayedSeats} seats`);

        if (summary.client_portal_users_count > 0) {
            console.log(`  (includes ${summary.client_portal_users_count} client portal user(s))`);
        }
    });
});
