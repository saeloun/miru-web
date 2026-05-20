/**
 * Page Load & Layout — clients page loads, stats cards, time frame selector.
 * Covers manual test sections 1 (Page Load & Layout) and 2 (Stats Cards).
 */
import { test, expect } from "@playwright/test";
import { goToClients } from "./helpers";

test.describe("Clients Page Load & Layout", () => {
    // §1.1 — Page loads successfully
    test("page loads without errors", async ({ page }) => {
        await goToClients(page);
        await expect(page.getByText(/manage/i).first()).toBeVisible();
    });

    // §1.4 — Error state: the component catches API errors and shows empty state
    test("shows empty state when API returns 500", async ({ page }) => {
        await page.route("**/api/v1/clients*", route =>
            route.fulfill({ status: 500, body: "Internal Server Error" }),
        );
        await page.goto("/clients");
        // The component catches errors and falls back to empty data, showing the empty state
        await expect(
            page.getByText(/aren't any clients/i),
        ).toBeVisible({ timeout: 15_000 });
    });

    // §2.1–2.3 — Stats cards
    test("stats cards display Total Clients, Hours Tracked, and Outstanding", async ({ page }) => {
        await goToClients(page);
        await expect(page.getByText(/total clients/i)).toBeVisible();
        await expect(page.getByText(/hours tracked/i)).toBeVisible();
        await expect(page.getByText(/outstanding/i)).toBeVisible();
    });

    // §1.5 — Time frame selector
    test("time frame selector is visible", async ({ page }) => {
        await goToClients(page);
        const selector = page.locator("#timeFrame");
        await expect(selector).toBeVisible();
    });

    // §3.1 — All Clients card with table
    test("All Clients card with table is visible", async ({ page }) => {
        await goToClients(page);
        await expect(page.getByText(/all clients/i).first()).toBeVisible();
    });
});
