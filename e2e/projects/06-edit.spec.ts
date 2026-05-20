/**
 * Edit Project — admin edits projects via the kebab menu.
 * Covers manual test section 8 (Admin — Edit Project).
 *
 * Each test creates its own project for full parallel isolation.
 */
import { test, expect } from "@playwright/test";
import {
    goToProjects,
    createProject,
    openKebabMenu,
    deleteProjectApi,
    fetchProjects,
    uniqueProjectName,
    searchProjects,
    projectRow,
} from "./helpers";

test.describe("Edit Project", () => {
    // §8.1 — Open edit from kebab menu, §8.2 — Pre-filled values
    test("edit dialog opens pre-filled from kebab menu", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-EdPre") });
        try {
            await goToProjects(page);
            await openKebabMenu(page, project.name);
            await page.getByRole("menuitem", { name: /edit project/i }).click();

            await expect(page.getByRole("heading", { name: /edit project/i })).toBeVisible({ timeout: 10_000 });

            const nameInput = page.locator("#project-name");
            await expect(nameInput).toHaveValue(project.name);
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §8.3 — Change project name
    test("changing project name updates the table", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-EdRen") });
        const newName = uniqueProjectName("E2E-Renamed");
        try {
            await goToProjects(page);
            await openKebabMenu(page, project.name);
            await page.getByRole("menuitem", { name: /edit project/i }).click();
            await expect(page.getByRole("heading", { name: /edit project/i })).toBeVisible({ timeout: 10_000 });

            const nameInput = page.locator("#project-name");
            await nameInput.clear();
            await nameInput.fill(newName);

            await page.getByRole("button", { name: /save changes/i }).click();

            await expect(page.getByRole("heading", { name: /edit project/i })).not.toBeVisible({ timeout: 10_000 });
            await searchProjects(page, newName);
            await expect(projectRow(page, newName)).toBeVisible({ timeout: 10_000 });
        } finally {
            // Clean up the renamed project
            const data = await fetchProjects(page);
            const renamed = data.projects.find(p => p.name === newName);
            if (renamed) await deleteProjectApi(page, renamed.id);
            else await deleteProjectApi(page, project.id);
        }
    });

    // §8.6 — Cancel edit
    test("cancel edit does not save changes", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-EdCan") });
        try {
            await goToProjects(page);
            await openKebabMenu(page, project.name);
            await page.getByRole("menuitem", { name: /edit project/i }).click();
            await expect(page.getByRole("heading", { name: /edit project/i })).toBeVisible({ timeout: 10_000 });

            const nameInput = page.locator("#project-name");
            const originalName = await nameInput.inputValue();
            await nameInput.clear();
            await nameInput.fill("CancelledName");

            await page.getByRole("button", { name: /cancel/i }).click();

            await expect(page.getByRole("heading", { name: /edit project/i })).not.toBeVisible();
            await searchProjects(page, originalName);
            await expect(projectRow(page, originalName)).toBeVisible();
            await searchProjects(page, "CancelledName");
            await expect(projectRow(page, "CancelledName")).not.toBeVisible();
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });
});
