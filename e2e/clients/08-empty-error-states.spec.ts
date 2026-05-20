/**
 * Empty State & Error State — edge cases when no clients exist or API fails.
 * Covers manual test sections 10 (Empty State) and 1.4 (Error State).
 *
 * NOTE: The ClientsTable component catches API errors internally and returns
 * fallback empty data, so a 500 response shows the empty state (not an error state).
 */
import { test, expect } from "@playwright/test";

test.describe("Empty & Error States", () => {
    // §1.4 — API error shows empty state (component catches errors)
    test("shows empty state when API returns 500", async ({ page }) => {
        await page.route("**/api/v1/clients*", route =>
            route.fulfill({ status: 500, body: "Internal Server Error" }),
        );

        await page.goto("/clients");
        await expect(page.getByText(/aren't any clients/i)).toBeVisible({ timeout: 15_000 });
    });

    // §10.1 — Empty state shown when no clients
    test("shows empty state when API returns empty client list", async ({ page }) => {
        await page.route("**/api/v1/clients*", route =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    client_details: [],
                    total_minutes: 0,
                    overdue_outstanding_amount: { overdue_amount: 0, outstanding_amount: 0 },
                }),
            }),
        );

        await page.goto("/clients");
        await expect(page.getByText(/aren't any clients/i)).toBeVisible({ timeout: 15_000 });
    });

    // §10.2 — Create from empty state
    test("empty state shows Add Your First Client button for admin", async ({ page }) => {
        await page.route("**/api/v1/clients*", route => {
            if (route.request().method() === "GET") {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        client_details: [],
                        total_minutes: 0,
                        overdue_outstanding_amount: { overdue_amount: 0, outstanding_amount: 0 },
                    }),
                });
            }
            return route.continue();
        });

        await page.goto("/clients");

        const createBtn = page.getByRole("button", { name: /add your first client/i });
        await expect(createBtn).toBeVisible({ timeout: 15_000 });

        await createBtn.click();
        await expect(
            page.getByRole("heading", { name: /add new client/i }),
        ).toBeVisible();
    });
});
