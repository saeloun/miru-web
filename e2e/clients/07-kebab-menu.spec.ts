/**
 * Kebab Menu Actions — copy ID, view details, navigation.
 * Covers manual test section 9 (Kebab Menu Actions).
 *
 * Each test creates its own client for full parallel isolation.
 */
import { test, expect } from "@playwright/test";
import {
    goToClients,
    createClient,
    openKebabMenu,
    deleteClientApi,
    uniqueClientName,
} from "./helpers";

test.describe("Kebab Menu & Navigation", () => {
    // §9.1–9.2 — Kebab menu opens with expected items
    test("kebab menu shows all expected actions", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-KbAll") });
        try {
            await goToClients(page);
            await openKebabMenu(page, client.name);

            await expect(page.getByRole("menuitem", { name: /copy client id/i })).toBeVisible();
            await expect(page.getByRole("menuitem", { name: /view details/i })).toBeVisible();
            await expect(page.getByRole("menuitem", { name: /edit client/i })).toBeVisible();
            await expect(page.getByRole("menuitem", { name: /delete client/i })).toBeVisible();
        } finally {
            await deleteClientApi(page, client.id);
        }
    });

    // §9.4 — View Details navigates to client page
    test("View Details navigates to /clients/{id}", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-KbVw") });
        try {
            await goToClients(page);
            await openKebabMenu(page, client.name);

            await page.getByRole("menuitem", { name: /view details/i }).click();

            await page.waitForURL(/\/clients\/\d+/, { timeout: 10_000 });
            expect(page.url()).toContain("/clients/");
        } finally {
            await deleteClientApi(page, client.id);
        }
    });
});
