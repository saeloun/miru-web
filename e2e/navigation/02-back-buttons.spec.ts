/**
 * Back Button Navigation — verifies all "back" buttons navigate to correct parent routes.
 * Catches bugs like /teams instead of /team, /client instead of /clients, etc.
 */
import { test, expect } from "@playwright/test";
import { createProject, deleteProjectApi, searchProjects, projectRow } from "../projects/helpers";

test.describe("Back Button Navigation", () => {
    /**
     * Regression test for: Team profile back arrow navigates to /teams (404) instead of /team
     * Related issue: team-profile-back-button-wrong-route
     */
    test("team member profile back button navigates to /team", async ({ page }) => {
        await page.goto("/team");
        await expect(page.locator("table")).toBeVisible({ timeout: 15_000 });

        // Use kebab menu → View Profile (row click doesn't navigate in TeamTable)
        const firstRow = page.locator("tbody tr").first();
        const memberName = await firstRow.locator("td").first().locator("p").first().innerText();
        const kebab = firstRow.getByRole("button", { name: /open menu/i });
        await kebab.click();
        await page.getByRole("menuitem", { name: /view profile/i }).click();

        await page.waitForURL(/\/team\/\d+/, { timeout: 10_000 });

        // The back button is a Button with variant="outline" size="icon" class="mr-4"
        const backButton = page.locator("button[class*='mr-4']").filter({ has: page.locator("svg") }).first();
        await expect(backButton).toBeVisible({ timeout: 5_000 });
        await backButton.click();

        await page.waitForTimeout(1_500);

        // Should be on /team (singular), NOT /teams (plural)
        expect(
            page.url(),
            `Back button navigated to ${page.url()} — expected /team`,
        ).toMatch(/\/team$/);
        expect(page.url()).not.toContain("/teams");
        await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
        await expect(page.getByText(/team overview/i)).toBeVisible();
    });

    test("project details back button navigates without 404", async ({ page }) => {
        const project = await createProject(page, { name: `E2E-BackBtn-${Date.now()}` });
        try {
            await page.goto("/projects");
            await expect(page.locator("table")).toBeVisible({ timeout: 15_000 });

            await searchProjects(page, project.name);
            await projectRow(page, project.name).click();
            await page.waitForURL(/\/projects\/\d+/, { timeout: 10_000 });

            const backButton = page.getByRole("heading", { level: 2 })
                .filter({ hasText: project.name })
                .locator("..")
                .getByRole("button")
                .first();
            await expect(backButton).toBeVisible({ timeout: 5_000 });
            await backButton.click();

            await expect(async () => {
                expect(page.url()).toMatch(/\/projects$/);
            }).toPass({ timeout: 10_000 });
            await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
        } finally {
            await deleteProjectApi(page, project.id);
        }
    });

    test("client details back button navigates to /clients", async ({ page }) => {
        await page.goto("/clients");
        await expect(
            page.locator("table, :text('No clients')").first(),
        ).toBeVisible({ timeout: 15_000 });

        const rows = page.locator("tbody tr");
        const count = await rows.count();
        if (count === 0) {
            test.skip(true, "No clients in seed data to test back navigation");
        }

        // Navigate to client details via kebab → View Details
        const firstRow = rows.first();
        const kebab = firstRow.getByRole("button", { name: /open menu/i });
        await kebab.click();
        await page.getByRole("menuitem", { name: /view details/i }).click();
        await page.waitForURL(/\/clients\/\d+/, { timeout: 10_000 });

        // The client details back button uses class "button-icon__back"
        const backButton = page.locator(".button-icon__back, button:has(svg[class*='ArrowLeft'])").first();
        await expect(backButton).toBeVisible({ timeout: 5_000 });
        await backButton.click();

        await page.waitForTimeout(1_500);

        expect(page.url()).toMatch(/\/clients$/);
        await expect(page.getByRole("heading", { name: "Clients", exact: true })).toBeVisible();
    });
});
