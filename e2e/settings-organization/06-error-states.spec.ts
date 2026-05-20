/**
 * Organization Settings — Error States.
 * Covers: API error on load (mocked), API error on save (mocked).
 */
import { test, expect } from "@playwright/test";

test.describe("Organization Settings — Error States", () => {
    test("shows error alert when API load fails", async ({ page }) => {
        // Mock the companies index endpoint to return 500
        await page.route("**/api/v1/companies", route => {
            if (route.request().method() === "GET") {
                return route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({ error: "Internal Server Error" }),
                });
            }
            return route.continue();
        });

        await page.goto("/settings/organization");

        // The component shows an Alert with error message
        await expect(
            page.getByText(/failed to load organization details/i),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows error toast when save fails", async ({ page }) => {
        await page.goto("/settings/organization/edit");
        await expect(page.locator("input[aria-label='Company Name']")).toBeVisible({ timeout: 15_000 });

        // Make a change to enable save
        const nameInput = page.locator("input[aria-label='Company Name']");
        const original = await nameInput.inputValue();
        await nameInput.fill(original + "x");

        // Mock ALL PUT requests to companies to return 500
        await page.route(/\/api\/v1\/companies\/\d+/, route => {
            if (route.request().method() === "PUT") {
                return route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({ error: "Internal Server Error" }),
                });
            }
            return route.continue();
        });

        await page.getByRole("button", { name: /save changes/i }).click();

        // Should show error toast — "Error in updating organization details"
        const toast = page.locator("[data-sonner-toast]");
        await expect(toast.first()).toBeVisible({ timeout: 10_000 });

        // Cancel to clean up
        await page.getByRole("button", { name: /cancel/i }).click();
    });
});
