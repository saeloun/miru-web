/**
 * Empty State & Error State — edge cases.
 * Covers manual test sections 10 and 1.4.
 */
import { test, expect } from "@playwright/test";

test.describe("Team — Empty & Error States", () => {
    test("shows error state when API fails", async ({ page }) => {
        await page.route("**/api/v1/team*", route =>
            route.fulfill({ status: 500, body: "Internal Server Error" }),
        );
        await page.goto("/team");
        await expect(page.getByText(/failed to load team members/i)).toBeVisible({ timeout: 15_000 });
    });

    test("shows empty state when API returns no members", async ({ page }) => {
        // The jbuilder uses `json.key_format! camelize: :lower` so keys are camelCase
        await page.route("**/api/v1/team*", route =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    combinedDetails: [],
                    paginationDetails: { items: 0, page: 1, pages: 0, next: null, prev: null, last: true },
                }),
            }),
        );

        await page.goto("/team");
        // The empty state text from the component
        await expect(page.getByText(/no team members yet/i)).toBeVisible({ timeout: 15_000 });
    });

    test("empty state shows Invite Member button for admin", async ({ page }) => {
        await page.route("**/api/v1/team*", route => {
            if (route.request().method() === "GET") {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        combinedDetails: [],
                        paginationDetails: { items: 0, page: 1, pages: 0, next: null, prev: null, last: true },
                    }),
                });
            }
            return route.continue();
        });

        await page.goto("/team");
        await expect(page.getByText(/no team members yet/i)).toBeVisible({ timeout: 15_000 });
        const inviteBtn = page.getByRole("button", { name: /invite member/i }).first();
        await expect(inviteBtn).toBeVisible();
    });
});
