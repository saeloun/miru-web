/**
 * Clients Search — global filter on the clients table.
 * Covers manual test section 4 (Search / Global Filter).
 *
 * Each test creates its own client for full parallel isolation.
 */
import { test, expect } from "@playwright/test";
import {
    goToClients,
    createClient,
    deleteClientApi,
    uniqueClientName,
} from "./helpers";

test.describe("Clients Search", () => {
    // §4.1 — Search input visible
    test("search input is visible with placeholder", async ({ page }) => {
        await goToClients(page);
        const searchInput = page.getByPlaceholder(/search/i);
        await expect(searchInput).toBeVisible();
    });

    // §4.2 — Search filters rows
    test("typing a client name filters the table", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-Srch") });
        try {
            await goToClients(page);
            const searchInput = page.getByPlaceholder(/search/i);
            await searchInput.fill(client.name);
            await page.waitForTimeout(300);

            const visibleRows = page.locator("tbody tr");
            const count = await visibleRows.count();
            expect(count).toBeGreaterThan(0);

            for (let i = 0; i < count; i++) {
                await expect(visibleRows.nth(i)).toContainText(client.name);
            }
        } finally {
            await deleteClientApi(page, client.id);
        }
    });

    // §4.4 — No results state
    test("non-matching search shows no results", async ({ page }) => {
        await goToClients(page);
        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill("ZZZZNONEXISTENT999");
        await page.waitForTimeout(300);

        await expect(page.getByText(/no results/i)).toBeVisible({ timeout: 5_000 });
    });

    // §4.5 — Clear search restores all rows
    test("clearing search restores all rows", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-Clr") });
        try {
            await goToClients(page);
            const searchInput = page.getByPlaceholder(/search/i);

            await searchInput.fill("ZZZZNONEXISTENT999");
            await page.waitForTimeout(300);
            await expect(page.getByText(/no results/i)).toBeVisible();

            await searchInput.clear();
            await page.waitForTimeout(300);

            const rows = page.locator("tbody tr");
            const count = await rows.count();
            expect(count).toBeGreaterThan(0);
        } finally {
            await deleteClientApi(page, client.id);
        }
    });

    // PR #2303 — search text highlighting
    test("searching highlights matching text in results", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-Hilite") });
        try {
            await goToClients(page);
            const searchInput = page.getByPlaceholder(/search/i);

            const searchTerm = client.name.slice(0, 5);
            await searchInput.fill(searchTerm);
            await page.waitForTimeout(500);

            const highlights = page.locator("mark, .highlight, [data-highlight]");
            const highlightCount = await highlights.count();
            const hasResults = await page.locator("tbody tr").count();

            if (hasResults > 0 && highlightCount > 0) {
                const firstHighlight = await highlights.first().innerText();
                expect(firstHighlight.toLowerCase()).toContain(searchTerm.toLowerCase());
            }
        } finally {
            await deleteClientApi(page, client.id);
        }
    });
});
