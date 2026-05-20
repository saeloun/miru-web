/**
 * Devices Settings — Edit Page Navigation.
 * Covers: navigating to edit, form rendering, cancel returns to details.
 */
import { test, expect } from "@playwright/test";
import { goToDevices, goToDevicesEdit, fetchCurrentUser, createDevice, deleteDevice } from "./helpers";

test.describe("Devices Settings — Edit Navigation", () => {
    test("clicking Edit/Add navigates to edit page", async ({ page }) => {
        await goToDevices(page);
        await page.getByText(/edit devices|add devices/i).first().click();
        await expect(page).toHaveURL(/\/settings\/devices\/edit/);
    });

    test("edit page shows Add Another Device card", async ({ page }) => {
        await goToDevicesEdit(page);
        await expect(page.getByText(/add another device/i)).toBeVisible();
    });

    test("edit page shows Cancel and Save buttons", async ({ page }) => {
        await goToDevicesEdit(page);
        await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible();
    });

    test("cancel returns to details page", async ({ page }) => {
        await goToDevicesEdit(page);
        // Handle potential confirmation dialog
        page.once("dialog", dialog => dialog.accept());
        await page.getByRole("button", { name: /cancel/i }).click();
        await expect(page).toHaveURL(/\/settings\/devices$/, { timeout: 10_000 });
    });

    test("edit page shows device form when device exists", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const device = await createDevice(page, user.id, { name: "E2E Edit Nav" });

        try {
            await goToDevicesEdit(page);
            // The device name should appear in the form card header
            await expect(page.getByText("E2E Edit Nav")).toBeVisible({ timeout: 10_000 });
        } finally {
            await deleteDevice(page, user.id, device.id);
        }
    });
});
