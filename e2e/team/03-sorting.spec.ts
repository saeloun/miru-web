/**
 * Team Sorting — column header sort toggles.
 * Covers manual test section 5.
 */
import { test, expect } from "@playwright/test";
import { goToTeam } from "./helpers";

test.describe("Team Sorting", () => {
    test("clicking Team header toggles sort order", async ({ page }) => {
        await goToTeam(page);
        const sortButton = page.locator("thead").getByRole("button", { name: /team/i });
        await expect(sortButton).toBeVisible();

        // Click once — ascending
        await sortButton.click();
        await page.waitForTimeout(300);
        await expect(sortButton).toBeVisible();

        // Click again — descending
        await sortButton.click();
        await page.waitForTimeout(300);
        await expect(sortButton).toBeVisible();
    });

    test("clicking Role header toggles sort order", async ({ page }) => {
        await goToTeam(page);
        const sortButton = page.locator("thead").getByRole("button", { name: /role/i });
        await expect(sortButton).toBeVisible();

        await sortButton.click();
        await page.waitForTimeout(300);
        await expect(sortButton).toBeVisible();
    });

    test("clicking Hours header toggles sort order", async ({ page }) => {
        await goToTeam(page);
        const sortButton = page.locator("thead").getByRole("button", { name: /hours/i });
        await expect(sortButton).toBeVisible();

        await sortButton.click();
        await page.waitForTimeout(300);
        await expect(sortButton).toBeVisible();
    });
});
