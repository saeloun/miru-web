/**
 * Manage Team Members — add, remove, update members on a project.
 * Covers manual test section 15 (Manage Team Members).
 *
 * Each test creates its own project for full parallel isolation.
 */
import { test, expect } from "@playwright/test";
import {
    createProject,
    deleteProjectApi,
    uniqueProjectName,
} from "./helpers";

/** Navigate to a project's details and wait for it to load. */
async function goToProjectDetails(page, project) {
    await page.goto(`/projects/${project.id}`);
    await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });
}

/** Open the Manage Team dialog from the project details page. */
async function openManageTeamDialog(page) {
    await page.getByRole("button", { name: /manage team/i }).click();
    await expect(
        page.getByRole("heading", { name: /manage project members/i }),
    ).toBeVisible({ timeout: 10_000 });
}

test.describe("Manage Team Members", () => {
    // §15.1 — Dialog opens
    test("manage team dialog opens from the details page", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-Tm01") });
        try {
            await goToProjectDetails(page, project);
            await openManageTeamDialog(page);
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §15.3 — Add a new member row
    test("add team member button adds a new row", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-Tm03") });
        try {
            await goToProjectDetails(page, project);
            await openManageTeamDialog(page);

            const memberRows = page.locator("[class*='rounded-xl'][class*='border']");
            const initialRows = await memberRows.count();

            await page.getByRole("button", { name: /add.*team member/i }).click();

            const newRows = await memberRows.count();
            expect(newRows).toBe(initialRows + 1);
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §15.4 — Member dropdown shows available users
    test("new member row has a dropdown with workspace users", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-Tm04") });
        try {
            await goToProjectDetails(page, project);
            await openManageTeamDialog(page);

            await page.getByRole("button", { name: /add.*team member/i }).click();

            const selectTriggers = page.locator("button[role='combobox']");
            await selectTriggers.last().click();

            const options = page.locator('[role="option"]');
            const optionCount = await options.count();
            expect(optionCount).toBeGreaterThan(0);
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §15.7 — Remove a member
    test("trash button removes a member row", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-Tm07") });
        try {
            await goToProjectDetails(page, project);
            await openManageTeamDialog(page);

            await page.getByRole("button", { name: /add.*team member/i }).click();
            const memberRows = page.locator("[class*='rounded-xl'][class*='border']");
            const rowsBefore = await memberRows.count();

            const removeButtons = page.locator("button#removeMember");
            await removeButtons.last().click();

            const rowsAfter = await memberRows.count();
            expect(rowsAfter).toBe(rowsBefore - 1);
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §15.9 — Submit disabled when invalid
    test("save button is disabled when a member row is incomplete", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-Tm09") });
        try {
            await goToProjectDetails(page, project);
            await openManageTeamDialog(page);

            await page.getByRole("button", { name: /add.*team member/i }).click();

            // The button text is "Save Members" (i18n key: projects.saveTeamMembers)
            const saveBtn = page.getByRole("button", { name: /save members/i });
            await expect(saveBtn).toBeDisabled();
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §15.13 — Currency symbol shown
    test("hourly rate input shows currency symbol", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-Tm13") });
        try {
            await goToProjectDetails(page, project);
            await openManageTeamDialog(page);

            await page.getByRole("button", { name: /add.*team member/i }).click();

            const currencySpan = page.locator("span.pointer-events-none").first();
            await expect(currencySpan).toBeVisible();
            const symbol = await currencySpan.innerText();
            expect(symbol.length).toBeGreaterThan(0);
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });
});
