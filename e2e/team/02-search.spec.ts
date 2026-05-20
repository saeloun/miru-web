/**
 * Team Search — global filter on the team table.
 * Covers manual test section 4.
 */
import { test, expect } from "@playwright/test";
import { goToTeam } from "./helpers";

test.describe("Team Search", () => {
    test("search input is visible with placeholder", async ({ page }) => {
        await goToTeam(page);
        const searchInput = page.getByPlaceholder(/search/i);
        await expect(searchInput).toBeVisible();
    });

    test("typing a member name filters the table", async ({ page }) => {
        await goToTeam(page);
        // Use the admin user's name which should always exist
        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill("Vipul");
        await page.waitForTimeout(300);

        const visibleRows = page.locator("tbody tr");
        const count = await visibleRows.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            await expect(visibleRows.nth(i)).toContainText(/vipul/i);
        }
    });

    test("non-matching search shows no results", async ({ page }) => {
        await goToTeam(page);
        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill("ZZZZNONEXISTENT999");
        await page.waitForTimeout(300);

        await expect(page.getByText(/no results/i)).toBeVisible({ timeout: 5_000 });
    });

    test("clearing search restores all rows", async ({ page }) => {
        await goToTeam(page);
        const searchInput = page.getByPlaceholder(/search/i);

        await searchInput.fill("ZZZZNONEXISTENT999");
        await page.waitForTimeout(300);
        await expect(page.getByText(/no results/i)).toBeVisible();

        await searchInput.clear();
        await page.waitForTimeout(300);

        const rows = page.locator("tbody tr");
        const count = await rows.count();
        expect(count).toBeGreaterThan(0);
    });
});
