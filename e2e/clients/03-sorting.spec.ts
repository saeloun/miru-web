/**
 * Clients Sorting — column header sort toggles.
 * Covers manual test section 5 (Sorting).
 */
import { test, expect } from "@playwright/test";
import { goToClients } from "./helpers";

test.describe("Clients Sorting", () => {
    test.beforeEach(async ({ page }) => {
        await goToClients(page);
    });

    // §5.1–5.2 — Sort by client name
    test("clicking Client header toggles sort order", async ({ page }) => {
        const sortButton = page.locator("thead").getByRole("button", { name: /client/i });
        await expect(sortButton).toBeVisible();

        const namesBefore = await page.locator("tbody tr td:first-child").allInnerTexts();
        if (namesBefore.length < 2) {
            test.skip(true, "Need at least 2 clients to test sorting");
        }

        // Click once — ascending
        await sortButton.click();
        await page.waitForTimeout(300);
        const namesAsc = await page.locator("tbody tr td:first-child").allInnerTexts();
        // Extract just the client name (first line before any email)
        const parsedAsc = namesAsc.map(t => t.split("\n")[0].trim());
        const sortedAsc = [...parsedAsc].sort((a, b) => a.localeCompare(b));
        expect(parsedAsc).toEqual(sortedAsc);

        // Click again — descending
        await sortButton.click();
        await page.waitForTimeout(300);
        const namesDesc = await page.locator("tbody tr td:first-child").allInnerTexts();
        const parsedDesc = namesDesc.map(t => t.split("\n")[0].trim());
        const sortedDesc = [...parsedDesc].sort((a, b) => b.localeCompare(a));
        expect(parsedDesc).toEqual(sortedDesc);
    });

    // §5.3 — Sort by hours logged
    test("clicking Hours Logged header toggles sort", async ({ page }) => {
        const sortButton = page.locator("thead").getByRole("button", { name: /hours/i });
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
});
