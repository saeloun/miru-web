/**
 * Create Project — admin creates projects via the UI dialog.
 * Covers manual test section 7 (Admin — Create Project).
 */
import { test, expect } from "@playwright/test";
import {
    goToProjects,
    getFirstClient,
    uniqueProjectName,
    deleteProjectApi,
    fetchProjects,
    searchProjects,
    projectRow,
} from "./helpers";

test.describe("Create Project", () => {
    test.beforeEach(async ({ page }) => {
        await goToProjects(page);
    });

    // §7.1 — New Project button visible
    test("New Project button is visible for admin", async ({ page }) => {
        const btn = page.getByRole("button", { name: /new project/i });
        await expect(btn).toBeVisible();
    });

    // §7.2–7.3 — Open create dialog with correct fields
    test("clicking New Project opens the create dialog", async ({ page }) => {
        await page.getByRole("button", { name: /new project/i }).click();

        // Dialog title
        await expect(page.getByRole("heading", { name: /create project/i })).toBeVisible();

        // Fields present
        await expect(page.locator("#client")).toBeVisible(); // Client select trigger
        await expect(page.locator("#project-name")).toBeVisible(); // Project name input
        await expect(page.getByLabel(/billable/i).first()).toBeVisible(); // Radio
    });

    // §7.5 — Submit disabled when empty
    test("create button is disabled when form is empty", async ({ page }) => {
        await page.getByRole("button", { name: /new project/i }).click();
        await expect(page.getByRole("heading", { name: /create project/i })).toBeVisible();

        const createBtn = page.getByRole("button", { name: /create project/i }).last();
        await expect(createBtn).toBeDisabled();
    });

    // §7.6 — Create project successfully (billable)
    test("creates a billable project successfully", async ({ page }) => {
        const name = uniqueProjectName("E2E-Create");
        const client = await getFirstClient(page.request);

        await page.getByRole("button", { name: /new project/i }).click();
        await expect(page.getByRole("heading", { name: /create project/i })).toBeVisible();

        // Select client
        await page.locator("#client").click();
        await page.locator('[role="option"]').filter({ hasText: client.name }).click();

        // Enter project name
        await page.locator("#project-name").fill(name);

        // Billable is default — just submit
        const createBtn = page.getByRole("button", { name: /create project/i }).last();
        await expect(createBtn).toBeEnabled();
        await createBtn.click();

        // Dialog should close
        await expect(page.getByRole("heading", { name: /create project/i })).not.toBeVisible({ timeout: 10_000 });

        // Project should appear in the table
        await searchProjects(page, name);
        await expect(projectRow(page, name)).toBeVisible({ timeout: 10_000 });

        // Cleanup: delete via API
        const data = await fetchProjects(page);
        const created = data.projects.find(p => p.name === name);
        if (created) await deleteProjectApi(page, created.id);
    });

    // §7.7 — Create non-billable project
    test("creates a non-billable project", async ({ page }) => {
        const name = uniqueProjectName("E2E-NonBill");
        const client = await getFirstClient(page.request);

        await page.getByRole("button", { name: /new project/i }).click();
        await expect(page.getByRole("heading", { name: /create project/i })).toBeVisible();

        // Select client
        await page.locator("#client").click();
        await page.locator('[role="option"]').filter({ hasText: client.name }).click();

        // Enter project name
        await page.locator("#project-name").fill(name);

        // Select Non-Billable
        await page.getByLabel(/non-billable/i).click();

        const createBtn = page.getByRole("button", { name: /create project/i }).last();
        await createBtn.click();

        // Dialog should close
        await expect(page.getByRole("heading", { name: /create project/i })).not.toBeVisible({ timeout: 10_000 });

        // Verify in table
        await searchProjects(page, name);
        await expect(projectRow(page, name)).toBeVisible({ timeout: 10_000 });

        // Cleanup
        const data = await fetchProjects(page);
        const created = data.projects.find(p => p.name === name);
        if (created) await deleteProjectApi(page, created.id);
    });

    // §7.10 — Cancel create
    test("cancel closes the dialog without creating", async ({ page }) => {
        await page.getByRole("button", { name: /new project/i }).click();
        await expect(page.getByRole("heading", { name: /create project/i })).toBeVisible();

        await page.locator("#project-name").fill("ShouldNotExist");

        // Click Cancel
        await page.getByRole("button", { name: /cancel/i }).click();

        // Dialog should close
        await expect(page.getByRole("heading", { name: /create project/i })).not.toBeVisible();

        // Project should NOT appear
        await expect(page.locator("tbody").getByText("ShouldNotExist")).not.toBeVisible();
    });
});
