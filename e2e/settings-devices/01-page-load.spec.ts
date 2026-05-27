/**
 * Devices Settings — Page Load & Layout.
 * Covers: page load, edit/add button, device cards, empty state.
 */
import { test, expect } from "@playwright/test";
import { goToDevices, goToDevicesAndWaitFor, fetchCurrentUser, createDevice, deleteDevice, fetchDevices } from "./helpers";

test.describe("Devices Settings — Page Load & Layout", () => {
    test("page loads with edit or add button", async ({ page }) => {
        await goToDevices(page);
        // Either "Edit Devices" or "Add Devices" button should be visible
        await expect(
            page.getByText(/edit devices|add devices/i).first(),
        ).toBeVisible();
    });

    test("device card shows name and type when device exists", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const device = await createDevice(page, user.id, {
            name: "E2E Test Laptop",
            device_type: "laptop",
            serial_number: `SN-PL-${Date.now()}`,
        });

        try {
            await goToDevices(page);
            await expect(page.getByText("E2E Test Laptop")).toBeVisible({ timeout: 10_000 });
            await expect(page.getByText("laptop").first()).toBeVisible();
        } finally {
            await deleteDevice(page, user.id, device.id);
        }
    });

    test("device card shows serial number label", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const device = await createDevice(page, user.id, {
            name: "E2E Serial Test",
            serial_number: "SN-SERIAL-TEST",
        });

        try {
            await goToDevices(page);
            await expect(page.getByText(/serial number/i).first()).toBeVisible({ timeout: 10_000 });
        } finally {
            await deleteDevice(page, user.id, device.id);
        }
    });

    test("device card shows memory and processor labels", async ({ page }) => {
        // Mock the devices API to return a device with known specs
        await page.route("**/api/v1/users/*/devices", route => {
            if (route.request().method() === "GET") {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        devices: [{
                            id: 999,
                            device_type: "laptop",
                            name: "Mock Laptop",
                            serial_number: "SN-MOCK-123",
                            specifications: { ram: "32GB DDR5", processor: "Apple M2 Max", graphics: "Integrated" },
                        }],
                    }),
                });
            }
            return route.continue();
        });

        await page.goto("/settings/devices");
        await expect(page.getByText("Mock Laptop")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/memory/i).first()).toBeVisible();
        await expect(page.getByText("32GB DDR5")).toBeVisible();
        await expect(page.getByText(/processor/i).first()).toBeVisible();
        await expect(page.getByText("Apple M2 Max")).toBeVisible();
    });

    test("empty state when no devices exist", async ({ page }) => {
        // Mock the devices API to return empty array
        await page.route("**/api/v1/users/*/devices", route => {
            if (route.request().method() === "GET") {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ devices: [] }),
                });
            }
            return route.continue();
        });

        await page.goto("/settings/devices");
        await expect(page.getByText(/no devices found/i)).toBeVisible({ timeout: 15_000 });
    });
});
