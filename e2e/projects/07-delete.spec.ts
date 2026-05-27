/**
 * Delete Project — admin deletes projects via the kebab menu.
 * Covers manual test section 9 (Admin — Delete Project).
 */
import { test, expect } from "@playwright/test";
import {
    goToProjects,
    createProject,
    openKebabMenu,
    expectToast,
    uniqueProjectName,
    searchProjects,
    projectRow,
} from "./helpers";

test.describe("Delete Project", () => {
    // §9.1–9.3 — Delete confirmation and success
    test("deletes a project via the kebab menu", async ({ page }) => {
        // Create a project to delete
        const project = await createProject(page, { name: uniqueProjectName("E2E-Del") });

        await goToProjects(page);
        await openKebabMenu(page, project.name);

        // Click Delete Project
        await page.getByRole("menuitem", { name: /delete project/i }).click();

        // §9.2 — Confirmation dialog appears
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(/delete project/i)).toBeVisible();
        await expect(dialog.getByText(project.name)).toBeVisible();

        // §9.3 — Confirm delete
        await dialog.getByRole("button", { name: /delete/i }).click();

        // Toast success
        await expectToast(page, /deleted/i);

        // Project should no longer be in the table
        await searchProjects(page, project.name);
        await expect(projectRow(page, project.name)).not.toBeVisible({ timeout: 10_000 });
    });

    // §9.4 — Cancel delete
    test("cancel delete keeps the project in the table", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-Keep") });

        await goToProjects(page);
        await openKebabMenu(page, project.name);
        await page.getByRole("menuitem", { name: /delete project/i }).click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        // Click Cancel
        await dialog.getByRole("button", { name: /cancel/i }).click();

        // Dialog should close
        await expect(dialog).not.toBeVisible();

        // Project should still be in the table
        await searchProjects(page, project.name);
        await expect(projectRow(page, project.name)).toBeVisible();
    });
});
