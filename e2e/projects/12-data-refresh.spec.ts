/**
 * Data Refresh — verifies the list refreshes after mutations.
 * Covers manual test section 19 (Data Refresh & Caching).
 */
import { test, expect } from "@playwright/test";
import {
    goToProjects,
    createProject,
    deleteProjectApi,
    uniqueProjectName,
    searchProjects,
    projectRow,
} from "./helpers";

test.describe("Data Refresh", () => {
    // §19.3 — List refreshes after create (via API + UI verification)
    test("newly created project appears after navigating back to list", async ({ page }) => {
        await goToProjects(page);

        // Create a project via API while on the page
        const name = uniqueProjectName("E2E-Refresh");
        const project = await createProject(page, { name });

        // Navigate away and back to trigger refetch
        await page.goto("/dashboard");
        await page.waitForLoadState("networkidle");
        await goToProjects(page);

        // The new project should be visible
        await searchProjects(page, name);
        await expect(projectRow(page, name)).toBeVisible({ timeout: 10_000 });

        // Cleanup
        await deleteProjectApi(page, project.id);
    });

    // §19.5 — List refreshes after delete
    test("deleted project disappears from the list", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DelRef") });

        await goToProjects(page);
        await searchProjects(page, project.name);
        await expect(projectRow(page, project.name)).toBeVisible({ timeout: 10_000 });

        // Delete via API
        await deleteProjectApi(page, project.id);

        // Navigate away and back
        await page.goto("/dashboard");
        await page.waitForLoadState("networkidle");
        await goToProjects(page);

        // Should no longer be visible
        await searchProjects(page, project.name);
        await expect(projectRow(page, project.name)).not.toBeVisible();
    });
});
