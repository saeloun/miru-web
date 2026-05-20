/**
 * Edit Client — admin edits clients via the kebab menu.
 * Covers manual test section 7 (Admin — Edit Client).
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

test.describe("Edit Client", () => {
    // §7.1–7.2 — Open edit from kebab menu, pre-filled values
    test("edit dialog opens pre-filled from kebab menu", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-EdPre") });
        try {
            await goToClients(page);
            await openKebabMenu(page, client.name);
            await page.getByRole("menuitem", { name: /edit client/i }).click();

            // Wait for the edit dialog heading
            await expect(
                page.getByRole("heading", { name: /edit client/i }),
            ).toBeVisible({ timeout: 10_000 });

            // Wait for the loading state to finish — the form appears after client details are fetched
            const dialog = page.getByRole("dialog");
            const nameInput = dialog.locator("#name");
            await expect(nameInput).toBeVisible({ timeout: 10_000 });
            await expect(nameInput).toHaveValue(client.name);
        } finally {
            await deleteClientApi(page, client.id);
        }
    });

    // §7.4 — Cancel edit does not save changes
    test("cancel edit does not save changes", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-EdCan") });
        try {
            await goToClients(page);
            await openKebabMenu(page, client.name);
            await page.getByRole("menuitem", { name: /edit client/i }).click();

            await expect(
                page.getByRole("heading", { name: /edit client/i }),
            ).toBeVisible({ timeout: 10_000 });

            const dialog = page.getByRole("dialog");
            const nameInput = dialog.locator("#name");
            await expect(nameInput).toBeVisible({ timeout: 10_000 });

            await nameInput.clear();
            await nameInput.fill("CancelledClientName");

            await page.keyboard.press("Escape");

            await expect(
                page.getByRole("heading", { name: /edit client/i }),
            ).not.toBeVisible();

            await expect(page.locator("tbody").getByText(client.name)).toBeVisible();
            await expect(page.locator("tbody").getByText("CancelledClientName")).not.toBeVisible();
        } finally {
            await deleteClientApi(page, client.id);
        }
    });

    // PR #2301 — saving a client shows only one success toast (no duplicates)
    test("saving a client shows at most one success toast", async ({ page }) => {
        const client = await createClient(page, { name: uniqueClientName("E2E-Toast") });
        try {
            await goToClients(page);
            await openKebabMenu(page, client.name);
            await page.getByRole("menuitem", { name: /edit client/i }).click();

            await expect(
                page.getByRole("heading", { name: /edit client/i }),
            ).toBeVisible({ timeout: 10_000 });

            const dialog = page.getByRole("dialog");
            const saveBtn = dialog.getByRole("button", { name: /save|update/i });
            await expect(saveBtn).toBeVisible({ timeout: 5_000 });
            await saveBtn.click();

            const toasts = page.locator("[data-sonner-toast]");
            await expect(toasts.first()).toBeVisible({ timeout: 10_000 });
            await page.waitForTimeout(1_500);

            const successToasts = page.locator("[data-sonner-toast]").filter({ hasText: /success|updated|saved/i });
            const toastCount = await successToasts.count();
            expect(toastCount).toBeLessThanOrEqual(1);
        } finally {
            await deleteClientApi(page, client.id);
        }
    });
});
