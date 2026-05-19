/**
 * Billing Settings — Action Buttons.
 * Covers: trial button, upgrade button, manage billing button visibility
 * based on mocked billing states.
 */
import { test, expect } from "@playwright/test";

/** Mock the subscription API to return a specific billing state. */
async function mockBillingState(page: any, overrides: Record<string, any> = {}) {
    const defaultSummary = {
        plan_tier: "free",
        plan_label: "free",
        billing_exempt: false,
        subscription_status: null,
        subscription_ends_at: null,
        subscription_interval: null,
        has_stripe_customer: false,
        team_member_limit: 3,
        used_team_seats: 2,
        team_member_limit_reached: false,
        trial_active: false,
        trial_available: true,
        trial_started_at: null,
        trial_ends_at: null,
        pro_access: false,
    };

    await page.route("**/api/v1/subscription", (route: any) => {
        if (route.request().method() === "GET") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ ...defaultSummary, ...overrides }),
            });
        }
        return route.continue();
    });
}

test.describe("Billing Settings — Action Buttons", () => {
    test("shows Start Trial button when trial is available", async ({ page }) => {
        await mockBillingState(page, { trial_available: true });
        await page.goto("/settings/billing");

        await expect(
            page.getByRole("button", { name: /start 30-day pro trial/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows Upgrade with Stripe button on free plan", async ({ page }) => {
        await mockBillingState(page, { plan_tier: "free", billing_exempt: false });
        await page.goto("/settings/billing");

        await expect(
            page.getByRole("button", { name: /upgrade with stripe/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows Manage Billing button when paid", async ({ page }) => {
        await mockBillingState(page, {
            plan_tier: "paid",
            plan_label: "paid",
            has_stripe_customer: true,
            trial_available: false,
        });
        await page.goto("/settings/billing");

        await expect(
            page.getByRole("button", { name: /manage billing in stripe/i }),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("hides Upgrade button when billing exempt", async ({ page }) => {
        await mockBillingState(page, { billing_exempt: true, trial_available: false });
        await page.goto("/settings/billing");

        // Wait for the page to load
        await expect(page.getByText(/membership/i).first()).toBeVisible({ timeout: 15_000 });

        // Upgrade button should not be visible
        await expect(
            page.getByRole("button", { name: /upgrade with stripe/i }),
        ).toBeHidden();
    });

    test("hides Start Trial button when trial not available", async ({ page }) => {
        await mockBillingState(page, { trial_available: false });
        await page.goto("/settings/billing");

        await expect(page.getByText(/membership/i).first()).toBeVisible({ timeout: 15_000 });

        // The "Start 30-day Pro trial" button in the membership card should not be visible
        // (Note: the Pro plan card may still show a trial button, so check the membership card area)
        const membershipCard = page.locator("text=Membership").locator("xpath=ancestor::div[contains(@class,'shadow-sm')]").first();
        await expect(
            membershipCard.getByRole("button", { name: /start 30-day pro trial/i }),
        ).toBeHidden();
    });

    test("shows trial active alert when trial is running", async ({ page }) => {
        const futureDate = new Date(Date.now() + 30 * 86400000).toISOString();
        await mockBillingState(page, {
            trial_active: true,
            trial_available: false,
            trial_ends_at: futureDate,
            plan_label: "pro_trial",
            pro_access: true,
        });
        await page.goto("/settings/billing");

        await expect(
            page.getByText(/pro trial active/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });
});
