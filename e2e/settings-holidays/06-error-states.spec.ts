/**
 * Holidays Settings — Error States.
 * Covers: API error on save (mocked with field errors and generic errors).
 */
import { test, expect } from "@playwright/test";
import { goToHolidays } from "./helpers";

test.describe("Holidays Settings — Error States", () => {
    test("shows field validation errors when save returns 422", async ({ page }) => {
        await goToHolidays(page);

        // Enter edit mode
        await page.getByRole("button", { name: /edit/i }).click();
        await expect(page.getByRole("button", { name: "Add Holiday" })).toBeVisible({ timeout: 5_000 });

        // Add a holiday
        await page.getByRole("button", { name: "Add Holiday" }).click();

        // Fill in name only on the newly added row (date will be empty)
        const nameInput = page.locator("input[placeholder='Enter holiday name']").last();
        await nameInput.fill("Error Test Holiday");

        // Mock the update endpoint to return 422 with field errors
        await page.route("**/api/v1/holidays/*", route => {
            if (route.request().method() === "PATCH") {
                return route.fulfill({
                    status: 422,
                    contentType: "application/json",
                    body: JSON.stringify({
                        field_errors: {
                            add_holiday_infos: {
                                "0": { date: ["can't be blank"] },
                            },
                        },
                    }),
                });
            }
            return route.continue();
        });

        // Save
        await page.getByRole("button", { name: /save changes/i }).click();

        // Should show validation error inline (red text)
        await expect(
            page.locator(".text-destructive").first(),
        ).toBeVisible({ timeout: 10_000 });

        // Cancel to clean up
        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("shows error toast when save fails with non-field error", async ({ page }) => {
        await goToHolidays(page);

        // Enter edit mode
        await page.getByRole("button", { name: /edit/i }).click();

        // Mock the update endpoint to return 500
        await page.route("**/api/v1/holidays/*", route => {
            if (route.request().method() === "PATCH") {
                return route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({ error: "Internal Server Error" }),
                });
            }
            return route.continue();
        });

        // Save (even with no changes, it should attempt the API call)
        await page.getByRole("button", { name: /save changes/i }).click();

        // Should show error toast
        const toast = page.locator("[data-sonner-toast]").filter({ hasText: /failed/i });
        await expect(toast).toBeVisible({ timeout: 10_000 });

        // Cancel to clean up
        await page.getByRole("button", { name: /cancel/i }).click();
    });
});
