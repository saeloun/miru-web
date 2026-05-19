/**
 * Projects Pagination — page navigation controls.
 * Covers manual test section 5 (Pagination).
 *
 * Creates 11 projects to guarantee pagination (default page size is 10).
 * Each test is self-contained with full setup/teardown.
 */
import { test, expect } from "@playwright/test";
import { goToProjects, createProject, deleteProjectApi, uniqueProjectName } from "./helpers";

/** Create N projects and return their IDs for cleanup. */
async function ensurePaginationProjects(page, count = 11) {
    const ids: number[] = [];
    for (let i = 0; i < count; i++) {
        const project = await createProject(page, { name: uniqueProjectName(`E2E-Pg${i}`) });
        ids.push(project.id);
    }
    return ids;
}

/** Delete all projects by ID (best-effort). */
async function cleanupProjects(page, ids: number[]) {
    for (const id of ids) {
        try { await deleteProjectApi(page, id); } catch { /* already deleted */ }
    }
}

test.describe("Projects Pagination", () => {
    // §5.1 — Pagination controls visible when enough rows
    test("pagination controls appear when projects exceed page size", async ({ page }) => {
        const ids = await ensurePaginationProjects(page);
        try {
            await goToProjects(page);

            await expect(page.getByText(/page \d+ of \d+/i)).toBeVisible({ timeout: 10_000 });
        } finally {
            await cleanupProjects(page, ids);
        }
    });

    // §5.3 — Next page
    test("next page button loads the next set of rows", async ({ page }) => {
        const ids = await ensurePaginationProjects(page);
        try {
            await goToProjects(page);

            await expect(page.getByText(/page 1 of/i)).toBeVisible({ timeout: 10_000 });

            // Click the "next page" button (CaretRight icon)
            const paginationNav = page.locator(".flex.items-center.space-x-2").last();
            const buttons = paginationNav.locator("button");
            // Button order: first-page, prev, next, last-page
            // Next is the 3rd button (index 2)
            await buttons.nth(2).click();
            await page.waitForTimeout(300);

            await expect(page.getByText(/page 2 of/i)).toBeVisible();
        } finally {
            await cleanupProjects(page, ids);
        }
    });

    // §5.7 — Previous disabled on first page
    test("previous button is disabled on the first page", async ({ page }) => {
        const ids = await ensurePaginationProjects(page);
        try {
            await goToProjects(page);

            await expect(page.getByText(/page 1 of/i)).toBeVisible({ timeout: 10_000 });

            // First-page and previous buttons should be disabled
            const paginationNav = page.locator(".flex.items-center.space-x-2").last();
            const buttons = paginationNav.locator("button");
            // Button order: first-page (0), prev (1), next (2), last-page (3)
            await expect(buttons.nth(0)).toBeDisabled();
            await expect(buttons.nth(1)).toBeDisabled();
        } finally {
            await cleanupProjects(page, ids);
        }
    });
});
