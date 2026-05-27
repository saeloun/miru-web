/**
 * Billing Settings — Alerts & Query Parameters.
 * Covers: success/cancelled alerts from Stripe redirect, error state.
 */
import { test, expect } from "@playwright/test";
import { goToBillingWithQuery } from "./helpers";

test.describe("Billing Settings — Alerts", () => {
    test("shows success alert when billing=success query param present", async ({ page }) => {
        await goToBillingWithQuery(page, "billing=success");

        await expect(
            page.getByText(/subscription updated/i).first(),
        ).toBeVisible({ timeout: 10_000 });
    });

    test("shows cancelled alert when billing=cancelled query param present", async ({ page }) => {
        await goToBillingWithQuery(page, "billing=cancelled");

        await expect(
            page.getByText(/checkout cancelled/i).first(),
        ).toBeVisible({ timeout: 10_000 });
    });

    test("shows error alert when API load fails", async ({ page }) => {
        // Mock the subscription endpoint to return 500
        await page.route("**/api/v1/subscription", route => {
            if (route.request().method() === "GET") {
                return route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({ error: "Internal Server Error" }),
                });
            }
            return route.continue();
        });

        await page.goto("/settings/billing");

        await expect(
            page.getByText(/unable to load billing details/i),
        ).toBeVisible({ timeout: 15_000 });
    });
});
