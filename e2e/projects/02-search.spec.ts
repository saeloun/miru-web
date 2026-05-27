/**
 * Projects Search — global filter on the projects table.
 * Covers manual test section 3 (Search / Global Filter).
 *
 * Each test creates its own project for full parallel isolation.
 */
import { test, expect } from "@playwright/test";
import { goToProjects, createProject, deleteProjectApi, uniqueProjectName } from "./helpers";

test.describe("Projects Search", () => {
    // §3.1 — Search input visible
    test("search input is visible with placeholder", async ({ page }) => {
        await goToProjects(page);
        const searchInput = page.getByPlaceholder(/search/i);
        await expect(searchInput).toBeVisible();
    });

    // §3.2 — Search filters rows
    test("typing a project name filters the table", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-Srch") });
        try {
            await goToProjects(page);
            const searchInput = page.getByPlaceholder(/search/i);
            await searchInput.fill(project.name);
            await page.waitForTimeout(300);

            const visibleRows = page.locator("tbody tr");
            const count = await visibleRows.count();
            expect(count).toBeGreaterThan(0);

            for (let i = 0; i < count; i++) {
                await expect(visibleRows.nth(i)).toContainText(project.name);
            }
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §3.5 — No results state
    test("non-matching search shows no results", async ({ page }) => {
        await goToProjects(page);
        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill("ZZZZNONEXISTENT999");
        await page.waitForTimeout(300);

        await expect(page.getByText(/no results/i)).toBeVisible({ timeout: 5_000 });
    });

    // §3.6 — Clear search restores all rows
    test("clearing search restores all rows", async ({ page }) => {
        await goToProjects(page);
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
