/**
 * Devices Settings — CRUD via API + UI verification.
 * Covers: create device via API and verify on page, delete via API and verify gone.
 * Each test creates its own data and cleans up.
 */
import { test, expect } from "@playwright/test";
import { goToDevices, goToDevicesAndWaitFor, fetchCurrentUser, createDevice, deleteDevice, fetchDevices } from "./helpers";

test.describe("Devices Settings — CRUD", () => {
    test("device created via API has correct data", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const ts = Date.now();
        const device = await createDevice(page, user.id, {
            name: `API Laptop ${ts}`,
            device_type: "laptop",
            serial_number: `SN-API-${ts}`,
            specifications: { ram: "64GB", processor: "M3 Ultra", graphics: "Integrated" },
        });

        try {
            // The createDevice helper already verified the POST succeeded (res.ok())
            // Verify the returned data matches what we sent
            expect(device.name).toBe(`API Laptop ${ts}`);
            expect(device.device_type).toBe("laptop");
            expect(device.serial_number).toBe(`SN-API-${ts}`);
            expect(device.id).toBeTruthy();
        } finally {
            await deleteDevice(page, user.id, device.id);
        }
    });

    test("device deleted via API disappears from the details page", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const device = await createDevice(page, user.id, {
            name: "To Be Deleted",
            serial_number: `SN-DEL-${Date.now()}`,
        });

        // Verify it exists first
        await goToDevices(page);
        await expect(page.getByText("To Be Deleted")).toBeVisible({ timeout: 10_000 });

        // Delete via API
        await deleteDevice(page, user.id, device.id);

        // Reload and verify it's gone
        await goToDevices(page);
        await expect(page.getByText("To Be Deleted")).toBeHidden({ timeout: 10_000 });
    });

    test("mobile device shows correct type badge", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const device = await createDevice(page, user.id, {
            name: "E2E Mobile Phone",
            device_type: "mobile",
            serial_number: `SN-MOB-${Date.now()}`,
        });

        try {
            await goToDevicesAndWaitFor(page, "E2E Mobile Phone");
            await expect(page.getByText("mobile").first()).toBeVisible();
        } finally {
            await deleteDevice(page, user.id, device.id);
        }
    });

    test("multiple devices display as separate cards", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const ts = Date.now();
        const device1 = await createDevice(page, user.id, {
            name: `Multi Dev A ${ts}`,
            serial_number: `SN-A-${ts}`,
        });
        const device2 = await createDevice(page, user.id, {
            name: `Multi Dev B ${ts}`,
            serial_number: `SN-B-${ts}`,
        });

        try {
            await goToDevicesAndWaitFor(page, `Multi Dev A ${ts}`);
            await expect(page.getByText(`Multi Dev B ${ts}`)).toBeVisible();
        } finally {
            await deleteDevice(page, user.id, device1.id);
            await deleteDevice(page, user.id, device2.id);
        }
    });
});
