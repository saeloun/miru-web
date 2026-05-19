/**
 * Kebab Menu Actions — copy ID, view details, navigation.
 * Covers manual test sections 6 (Row Click) and 10 (Kebab Menu Actions).
 *
 * Each test creates its own project for full parallel isolation.
 */
import { test, expect } from "@playwright/test";
import {
    goToProjects,
    createProject,
    openKebabMenu,
    deleteProjectApi,
    uniqueProjectName,
} from "./helpers";

test.describe("Kebab Menu & Row Navigation", () => {
    // §10.1–10.2 — Kebab menu opens with expected items
    test("kebab menu shows all expected actions", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-KbAll") });
        try {
            await goToProjects(page);
            await openKebabMenu(page, project.name);

            await expect(page.getByRole("menuitem", { name: /copy project id/i })).toBeVisible();
            await expect(page.getByRole("menuitem", { name: /view details/i })).toBeVisible();
            await expect(page.getByRole("menuitem", { name: /edit project/i })).toBeVisible();
            await expect(page.getByRole("menuitem", { name: /delete project/i })).toBeVisible();
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §10.4 — View Details navigates to project page
    test("View Details navigates to the project details page", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-KbVw") });
        try {
            await goToProjects(page);
            await openKebabMenu(page, project.name);

            await page.getByRole("menuitem", { name: /view details/i }).click();

            await page.waitForURL(/\/projects\/\d+/, { timeout: 10_000 });
            expect(page.url()).toContain("/projects/");
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §6.1 — Row click navigates to project details
    test("clicking a project row navigates to its details page", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-KbRow") });
        try {
            await goToProjects(page);

            const row = page.locator("tbody tr").filter({ hasText: project.name });
            await expect(row).toBeVisible();

            await row.locator("td").first().click();

            await page.waitForURL(/\/projects\/\d+/, { timeout: 10_000 });
            expect(page.url()).toContain("/projects/");
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §6.2 — Cursor style on hover
    test("project rows have pointer cursor", async ({ page }) => {
        await goToProjects(page);

        const row = page.locator("tbody tr").first();
        await expect(row).toBeVisible();

        const cursor = await row.evaluate(el => getComputedStyle(el).cursor);
        expect(cursor).toBe("pointer");
    });
});
