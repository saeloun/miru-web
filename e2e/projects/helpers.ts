/**
 * Project-specific helpers for E2E tests.
 * Provides API-based test data creation and page navigation utilities.
 */
import { Page, expect, APIRequestContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// Caches (per-worker)
// ---------------------------------------------------------------------------
let clientIdCache: string | null = null;
let clientNameCache: string | null = null;
let projectCounter = 0;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/** Get the first client (cached within a worker). */
export async function getFirstClient(request: APIRequestContext): Promise<{ id: string; name: string }> {
    if (clientIdCache && clientNameCache) {
        return { id: clientIdCache, name: clientNameCache };
    }

    const res = await request.get("/api/v1/projects");
    expect(res.ok(), `Failed to fetch projects/clients: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    const clients = body.clients || [];
    if (clients.length === 0) throw new Error("No clients found in seed data");
    clientIdCache = String(clients[0].id);
    clientNameCache = String(clients[0].name);
    return { id: clientIdCache, name: clientNameCache };
}

/** Generate a unique project name per worker to avoid collisions. */
export function uniqueProjectName(prefix = "E2E-Proj"): string {
    projectCounter++;
    const ts = Date.now().toString(36);
    return `${prefix}-${ts}-${projectCounter}`.slice(0, 30);
}

/** Create a project via the API. Returns the project object. */
export async function createProject(
    page: Page,
    overrides: { name?: string; billable?: boolean; client_id?: string } = {},
) {
    const client = await getFirstClient(page.request);
    const name = overrides.name || uniqueProjectName();
    const billable = overrides.billable ?? true;
    const clientId = overrides.client_id || client.id;

    const res = await page.request.post("/api/v1/projects", {
        data: {
            project: {
                client_id: clientId,
                name,
                billable,
            },
        },
    });
    expect(res.ok(), `Failed to create project: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return { ...body, name, clientName: client.name };
}

/** Delete a project via the API. */
export async function deleteProjectApi(page: Page, projectId: string | number) {
    const res = await page.request.delete(`/api/v1/projects/${projectId}`);
    expect(res.ok(), `Failed to delete project: ${res.status()}`).toBeTruthy();
}

/** Fetch all projects via the API. */
export async function fetchProjects(page: Page) {
    const res = await page.request.get("/api/v1/projects");
    expect(res.ok()).toBeTruthy();
    return (await res.json()) as {
        projects: Array<{
            id: number;
            name: string;
            client_name: string;
            billable: boolean;
            status: string;
            totalHours: number;
            teamMembers: Array<{ id: number; name: string }>;
        }>;
        clients: Array<{ id: number; name: string }>;
    };
}

// ---------------------------------------------------------------------------
// Page navigation helpers
// ---------------------------------------------------------------------------

/** Navigate to the projects list and wait for the table or empty state. */
export async function goToProjects(page: Page) {
    await page.goto("/projects");
    // Wait for either the table or the empty state to appear
    await expect(
        page.locator("table, :text('No projects yet')").first(),
    ).toBeVisible({ timeout: 15_000 });
}

/** Search projects using the list search box. */
export async function searchProjects(page: Page, term: string) {
    const search = page.getByPlaceholder("Search projects...");
    await expect(search).toBeVisible({ timeout: 10_000 });
    await search.fill(term);
    await page.waitForTimeout(400);
}

/** Return the table row matching a project name. */
export function projectRow(page: Page, projectName: string) {
    return page.locator("tbody tr").filter({ hasText: projectName }).first();
}

/** Wait for a toast notification containing `text`. */
export async function expectToast(page: Page, text: string | RegExp) {
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
    await expect(toast).toBeVisible({ timeout: 10_000 });
}

/** Click the kebab (⋯) menu on a project row, identified by project name. */
export async function openKebabMenu(page: Page, projectName: string) {
    await searchProjects(page, projectName);
    const row = projectRow(page, projectName);
    await expect(row).toBeVisible({ timeout: 10_000 });
    const kebab = row.locator("button#kebabMenu");
    await kebab.click();
}

/** Select an option from a Radix Select by clicking the trigger then the option text. */
export async function selectOption(page: Page, triggerSelector: string, optionText: string) {
    await page.locator(triggerSelector).click();
    await page.locator('[role="option"]').filter({ hasText: optionText }).click();
}

/** Select the first option from a Radix Select. */
export async function selectFirstOption(page: Page, triggerSelector: string) {
    await page.locator(triggerSelector).click();
    await page.locator('[role="option"]').first().click();
}
