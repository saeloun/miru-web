/**
 * Delete Client — admin deletes clients via the kebab menu.
 * Covers manual test section 8 (Admin — Delete Client).
 */
import { test, expect } from "@playwright/test";
import {
    goToClients,
    createClient,
    openKebabMenu,
    expectToast,
    deleteClientApi,
    uniqueClientName,
} from "./helpers";

test.describe("Delete Client", () => {
    // §8.1–8.3 — Delete confirmation and success
    test("deletes a client via kebab menu", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-Del") });

        try {
            await goToClients(page);
            await openKebabMenu(page, client.name);
            await page.getByRole("menuitem", { name: /delete client/i }).click();

            // Confirmation dialog appears
            const dialog = page.getByRole("dialog");
            await expect(dialog).toBeVisible();
            await expect(dialog.getByText(client.name)).toBeVisible();

            // Confirm delete
            await dialog.getByRole("button", { name: /delete/i }).click();

            // Toast success
            await expectToast(page, /deleted/i);

            // Client should no longer be in the table
            await expect(page.locator("tbody").getByText(client.name)).not.toBeVisible({ timeout: 10_000 });
        } catch (e) {
            // If the test fails before deletion, clean up via API
            await deleteClientApi(page, client.id);
            throw e;
        }
    });

    // §8.4 — Cancel delete
    test("cancel delete keeps the client in the table", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-Keep") });
        try {
            await goToClients(page);
            await openKebabMenu(page, client.name);
            await page.getByRole("menuitem", { name: /delete client/i }).click();

            const dialog = page.getByRole("dialog");
            await expect(dialog).toBeVisible();

            // Click Cancel
            await dialog.getByRole("button", { name: /cancel/i }).click();

            // Dialog should close
            await expect(dialog).not.toBeVisible();

            // Client should still be in the table
            await expect(page.locator("tbody").getByText(client.name)).toBeVisible();
        } finally {
            await deleteClientApi(page, client.id);
        }
    });
});
