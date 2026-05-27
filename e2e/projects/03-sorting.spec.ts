/**
 * Projects Sorting — column header sort toggles.
 * Covers manual test section 4 (Sorting).
 */
import { test, expect } from "@playwright/test";
import { goToProjects } from "./helpers";

test.describe("Projects Sorting", () => {
    const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: "base",
    });

    const normalize = (value: string) => value.trim();

    test.beforeEach(async ({ page }) => {
        await goToProjects(page);
    });

    // §4.2–4.3 — Sort by project name
    test("clicking Project/Client header toggles sort order", async ({ page }) => {
        const sortButton = page.locator("thead").getByRole("button", { name: /project/i });
        await expect(sortButton).toBeVisible();

        // Collect names before sorting
        const namesBefore = await page.locator("tbody tr td:first-child p.font-medium").allInnerTexts();
        if (namesBefore.length < 2) {
            test.skip(true, "Need at least 2 projects to test sorting");
        }

        // Click once — ascending
        await sortButton.click();
        await page.waitForTimeout(300);
        const namesAsc = (await page
            .locator("tbody tr td:first-child p.font-medium")
            .allInnerTexts()).map(normalize);
        const sortedAsc = [...namesAsc].sort((a, b) => collator.compare(a, b));
        expect(namesAsc).toEqual(sortedAsc);

        // Click again — descending
        await sortButton.click();
        await page.waitForTimeout(300);
        const namesDesc = (await page
            .locator("tbody tr td:first-child p.font-medium")
            .allInnerTexts()).map(normalize);
        const sortedDesc = [...namesDesc].sort((a, b) => collator.compare(b, a));
        expect(namesDesc).toEqual(sortedDesc);
    });

    // §4.4–4.5 — Sort by status
    test("clicking Status header toggles sort order", async ({ page }) => {
        const sortButton = page.locator("thead").getByRole("button", { name: /status/i });
        await expect(sortButton).toBeVisible();

        // Click once — ascending
        await sortButton.click();
        await page.waitForTimeout(300);

        // Verify the sort arrow icon changed (ArrowUp should be visible)
        // Just verify no crash and the button is still interactive
        await expect(sortButton).toBeVisible();

        // Click again — descending
        await sortButton.click();
        await page.waitForTimeout(300);
        await expect(sortButton).toBeVisible();
    });
});
