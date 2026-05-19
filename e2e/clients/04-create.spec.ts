/**
 * Create Client — admin creates clients via the UI dialog.
 * Covers manual test section 6 (Admin — Create Client).
 */
import { test, expect } from "@playwright/test";
import { goToClients, fetchClients, deleteClientApi } from "./helpers";

test.describe("Create Client", () => {
    // §6.1 — Add New Client button visible
    test("Add New Client button is visible for admin", async ({ page }) => {
        await goToClients(page);
        const btn = page.getByRole("button", { name: /add new client/i });
        await expect(btn).toBeVisible();
    });

    // §6.2 — Open create dialog
    test("clicking Add New Client opens the create dialog", async ({ page }) => {
        await goToClients(page);
        await page.getByRole("button", { name: /add new client/i }).click();

        await expect(
            page.getByRole("heading", { name: /add new client/i }),
        ).toBeVisible({ timeout: 10_000 });
    });

    // §6.4 — Submit disabled when required fields empty
    test("submit button is disabled when required fields are empty", async ({ page }) => {
        await goToClients(page);
        await page.getByRole("button", { name: /add new client/i }).click();
        await expect(
            page.getByRole("heading", { name: /add new client/i }),
        ).toBeVisible({ timeout: 10_000 });

        // The submit/save button inside the dialog should be disabled
        const dialog = page.getByRole("dialog");
        const submitBtn = dialog.getByRole("button", { name: /add|save|create|submit/i }).last();
        await expect(submitBtn).toBeDisabled();
    });

    // §6.8 — Cancel/close dialog without creating
    test("cancel closes the dialog without creating a client", async ({ page }) => {
        await goToClients(page);
        await page.getByRole("button", { name: /add new client/i }).click();
        await expect(
            page.getByRole("heading", { name: /add new client/i }),
        ).toBeVisible({ timeout: 10_000 });

        // Close the dialog
        const dialog = page.getByRole("dialog");
        const cancelBtn = dialog.getByRole("button", { name: /cancel/i });
        if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
        } else {
            // Fall back to close button (X)
            await dialog.locator("button[aria-label='Close'], button:has(svg)").first().click();
        }

        await expect(
            page.getByRole("heading", { name: /add new client/i }),
        ).not.toBeVisible();
    });
});
