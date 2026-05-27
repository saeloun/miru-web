/**
 * Project Details Page — header, chart, team table, actions.
 * Covers manual test sections 13 (Project Details) and 14 (Header Actions).
 *
 * Each test creates its own project for full parallel isolation.
 */
import { test, expect } from "@playwright/test";
import {
    createProject,
    deleteProjectApi,
    uniqueProjectName,
} from "./helpers";

test.describe("Project Details Page", () => {
    // §13.1 — Page loads
    test("project details page loads with project name", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DtLd") });
        try {
            await page.goto(`/projects/${project.id}`);
            await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §13.2 — Back button
    test("back button navigates away from details", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DtBk") });
        try {
            // Navigate to projects list first
            await page.goto("/projects");
            await page.waitForLoadState("networkidle");

            // Click into the project via the list (SPA navigation pushes history)
            const projectLink = page.getByText(project.name, { exact: true }).first();
            await expect(projectLink).toBeVisible({ timeout: 10_000 });
            await projectLink.click();
            await page.waitForURL(`**/projects/${project.id}`, { timeout: 10_000 });
            await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });

            // The back button is the icon-only button adjacent to the project heading
            const backButton = page.getByRole("heading", { level: 2 })
                .filter({ hasText: project.name })
                .locator("..")
                .getByRole("button")
                .first();
            await expect(backButton).toBeVisible({ timeout: 5_000 });
            await backButton.click();

            // SPA navigation — wait for URL to no longer contain the project ID
            await expect(async () => {
                expect(page.url()).not.toContain(`/projects/${project.id}`);
            }).toPass({ timeout: 10_000 });
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §13.5 — Client name shown
    test("client name is displayed on the details page", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DtCl") });
        try {
            await page.goto(`/projects/${project.id}`);
            await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });
            await expect(page.getByText(project.clientName)).toBeVisible();
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §13.6 — Total Hours Chart section
    test("total hours chart section is visible", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DtCh") });
        try {
            await page.goto(`/projects/${project.id}`);
            await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });
            await expect(page.locator("select").first()).toBeVisible();
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §13.7 — Timeframe selector
    test("timeframe selector has week, month, year options", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DtTf") });
        try {
            await page.goto(`/projects/${project.id}`);
            await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });

            const select = page.locator("select").first();
            await expect(select).toBeVisible();

            // Native <option> elements are not "visible" — check their values instead
            await expect(select.locator('option[value="week"]')).toBeAttached();
            await expect(select.locator('option[value="month"]')).toBeAttached();
            await expect(select.locator('option[value="year"]')).toBeAttached();
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §13.8 — Overdue & Outstanding amounts
    test("overdue and outstanding amounts are displayed", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DtOd") });
        try {
            await page.goto(`/projects/${project.id}`);
            await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });

            await expect(page.getByText(/overdue/i).first()).toBeVisible();
            await expect(page.getByText(/outstanding/i).first()).toBeVisible();
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §13.9 — Team Members table
    test("team members section is visible", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DtTm") });
        try {
            await page.goto(`/projects/${project.id}`);
            await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });
            await expect(page.getByText(/team members/i).first()).toBeVisible();
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §14.1–14.2 — New Invoice button
    test("New Invoice button is visible and navigates correctly", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DtInv") });
        try {
            await page.goto(`/projects/${project.id}`);
            await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });

            const invoiceBtn = page.getByRole("button", { name: /new invoice/i });
            await expect(invoiceBtn).toBeVisible();

            await invoiceBtn.click();
            await page.waitForURL(/\/invoices\/new/, { timeout: 10_000 });
            expect(page.url()).toContain("/invoices/new");
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §14.3–14.4 — Manage Team button
    test("Manage Team button opens the team members dialog", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DtMt") });
        try {
            await page.goto(`/projects/${project.id}`);
            await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });

            const manageBtn = page.getByRole("button", { name: /manage team/i });
            await expect(manageBtn).toBeVisible();
            await manageBtn.click();

            await expect(page.getByRole("heading", { name: /manage project members/i })).toBeVisible({ timeout: 10_000 });
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §14.5 — Kebab menu on details page
    test("kebab menu on details page shows edit and delete options", async ({ page }) => {
        const project = await createProject(page, { name: uniqueProjectName("E2E-DtKb") });
        try {
            await page.goto(`/projects/${project.id}`);
            await expect(page.getByText(project.name).first()).toBeVisible({ timeout: 15_000 });

            const kebab = page.locator("button#kebabMenu");
            await kebab.click();

            await expect(page.getByRole("menuitem", { name: /edit project/i })).toBeVisible();
            await expect(page.getByRole("menuitem", { name: /delete project/i })).toBeVisible();
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    // §13.10 — Invalid project ID redirects
    test("invalid project ID redirects to projects list", async ({ page }) => {
        await page.goto("/projects/999999999");
        await page.waitForURL("**/projects", { timeout: 15_000 });
        expect(page.url()).toMatch(/\/projects$/);
    });
});
