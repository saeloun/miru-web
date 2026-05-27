/**
 * Empty State & Error State — edge cases when no projects exist or API fails.
 * Covers manual test sections 11 (Empty State) and 12 (Error State).
 */
import { test, expect } from "@playwright/test";

test.describe("Empty & Error States", () => {
    // §12.1 — API error state
    test("shows error state when API fails", async ({ page }) => {
        // Block the projects API to simulate a failure
        await page.route("**/api/v1/projects", route =>
            route.fulfill({ status: 500, body: "Internal Server Error" }),
        );

        await page.goto("/projects");

        // Should show the error state with warning icon
        await expect(page.getByText(/failed to load projects/i)).toBeVisible({ timeout: 15_000 });
    });

    // §12.2 — No crash on error
    test("page does not crash on API error", async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on("console", msg => {
            if (msg.type() === "error") consoleErrors.push(msg.text());
        });

        await page.route("**/api/v1/projects", route =>
            route.fulfill({ status: 500, body: "Internal Server Error" }),
        );

        await page.goto("/projects");
        await expect(page.getByText(/failed to load projects/i)).toBeVisible({ timeout: 15_000 });

        // No unhandled React errors (uncaught exceptions)
        const criticalErrors = consoleErrors.filter(
            e => e.includes("Uncaught") || e.includes("unhandled"),
        );
        expect(criticalErrors).toHaveLength(0);
    });

    // §11.1 — Empty state shown when no projects
    test("shows empty state when API returns no projects", async ({ page }) => {
        // Mock the API to return empty projects
        await page.route("**/api/v1/projects", route =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ projects: [], clients: [], total_count: 0 }),
            }),
        );

        await page.goto("/projects");

        await expect(page.getByText(/no projects yet/i)).toBeVisible({ timeout: 15_000 });
    });

    // §11.2 — Create from empty state
    test("empty state shows create button for admin", async ({ page }) => {
        await page.route("**/api/v1/projects", route => {
            if (route.request().method() === "GET") {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ projects: [], clients: [], total_count: 0 }),
                });
            }
            return route.continue();
        });

        await page.goto("/projects");

        const createBtn = page.getByRole("button", { name: /create.*first.*project/i });
        await expect(createBtn).toBeVisible({ timeout: 15_000 });

        // Clicking it should open the create dialog
        await createBtn.click();
        await expect(page.getByRole("heading", { name: /create project/i })).toBeVisible();
    });
});
