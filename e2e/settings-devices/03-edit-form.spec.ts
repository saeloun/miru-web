/**
 * Devices Settings — Edit Form Fields.
 * Covers: add device, form field visibility, delete device, save button state, device summary.
 */
import { test, expect } from "@playwright/test";
import { goToDevicesEdit, fetchCurrentUser, createDevice, deleteDevice } from "./helpers";

test.describe("Devices Settings — Edit Form Fields", () => {
    test("clicking Add Another Device creates a new empty form", async ({ page }) => {
        await goToDevicesEdit(page);

        // Count existing device cards (by looking for "New Device" or device names)
        const saveBtn = page.getByRole("button", { name: /save changes/i });
        const initialDisabled = await saveBtn.isDisabled();

        // Click the Add Another Device card
        await page.getByText(/add another device/i).click();

        // A new "New Device" card should appear
        await expect(page.getByText(/new device/i).first()).toBeVisible({ timeout: 5_000 });

        // Save button should now be enabled (change was made)
        await expect(saveBtn).toBeEnabled();

        // Cancel without saving
        page.once("dialog", dialog => dialog.accept());
        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("new device form has all required fields", async ({ page }) => {
        await goToDevicesEdit(page);

        // Add a new device
        await page.getByText(/add another device/i).click();

        // Check all form fields are present (using the last device card's fields)
        await expect(page.getByText(/device type/i).last()).toBeVisible();
        await expect(page.getByText(/model\/name/i).last()).toBeVisible();
        await expect(page.getByText(/serial number/i).last()).toBeVisible();
        await expect(page.getByText(/memory/i).last()).toBeVisible();
        await expect(page.getByText(/processor/i).last()).toBeVisible();
        await expect(page.getByText(/graphics card/i).last()).toBeVisible();
        await expect(page.getByText(/storage/i).last()).toBeVisible();

        page.once("dialog", dialog => dialog.accept());
        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("device type select has Laptop and Mobile options", async ({ page }) => {
        await goToDevicesEdit(page);
        await page.getByText(/add another device/i).click();

        // Click the device type select trigger
        const selectTrigger = page.locator("[id^='device-type-']").last();
        await selectTrigger.click();

        // Laptop and Mobile options should be visible
        await expect(page.getByRole("option", { name: /laptop/i })).toBeVisible({ timeout: 5_000 });
        await expect(page.getByRole("option", { name: /mobile/i })).toBeVisible();

        // Close the dropdown by pressing Escape
        await page.keyboard.press("Escape");

        page.once("dialog", dialog => dialog.accept());
        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("delete button removes a device card", async ({ page }) => {
        await goToDevicesEdit(page);

        // Add two devices
        await page.getByText(/add another device/i).click();
        await page.getByText(/add another device/i).click();

        // Count "New Device" cards
        const newDeviceCards = page.getByText(/new device/i);
        const initialCount = await newDeviceCards.count();
        expect(initialCount).toBeGreaterThanOrEqual(2);

        // Click the delete button on the last device card (the trash icon)
        const deleteButtons = page.locator("button").filter({ has: page.locator("svg") }).filter({ hasText: "" });
        // Use the destructive-colored button
        const trashBtn = page.locator("button.text-destructive").last();
        await trashBtn.click();

        // One fewer card
        const afterCount = await newDeviceCards.count();
        expect(afterCount).toBe(initialCount - 1);

        page.once("dialog", dialog => dialog.accept());
        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("save button is disabled when no changes made", async ({ page }) => {
        await goToDevicesEdit(page);
        const saveBtn = page.getByRole("button", { name: /save changes/i });
        await expect(saveBtn).toBeDisabled();
    });

    test("save button enables after adding a device", async ({ page }) => {
        await goToDevicesEdit(page);
        await page.getByText(/add another device/i).click();
        const saveBtn = page.getByRole("button", { name: /save changes/i });
        await expect(saveBtn).toBeEnabled();

        page.once("dialog", dialog => dialog.accept());
        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("device summary shows total count", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const device = await createDevice(page, user.id, { name: "E2E Summary" });

        try {
            await goToDevicesEdit(page);
            await expect(page.getByText(/device summary/i)).toBeVisible({ timeout: 10_000 });
            await expect(page.getByText(/total devices/i)).toBeVisible();
        } finally {
            await deleteDevice(page, user.id, device.id);
        }
    });
});
