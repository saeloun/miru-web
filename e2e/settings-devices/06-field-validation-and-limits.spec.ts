/**
 * Devices Settings — Field Validation and Length Limits.
 * Covers: device type selection, model/name, serial number, processor persistence,
 * and long-value round trips through the edit form.
 */
import { test, expect, type Page } from "@playwright/test";
import {
    fetchCurrentUser,
    fetchDevices,
    goToDevicesEdit,
    deleteDevice,
} from "./helpers";

async function addDeviceFromEditPage(
    page,
    {
        deviceType,
        name,
        serialNumber,
        processor,
    }: {
        deviceType: "laptop" | "mobile";
        name: string;
        serialNumber: string;
        processor: string;
    }
) {
    await page.getByText(/add another device/i).click();

    const typeTrigger = page.locator("[id^='device-type-']").last();
    await typeTrigger.click();
    await page.getByRole("option", { name: new RegExp(deviceType, "i") }).click();

    await page.getByLabel(/model\/name/i).last().fill(name);
    await page.getByLabel(/serial number/i).last().fill(serialNumber);
    await page.getByLabel(/processor/i).last().fill(processor);

    const saveRequest = page.waitForRequest(
        response =>
            response.url().includes("/devices") &&
            response.method() === "POST"
    );
    await page.getByRole("button", { name: /save changes/i }).click();
    return await saveRequest;
}

test.describe("Devices Settings — Field Validation and Length Limits", () => {
    test("can save a laptop device with serial number and processor", async ({
        page,
    }) => {
        const deviceName = `E2E Laptop ${Date.now()}`;
        const serialNumber = `SN-LAP-${Date.now()}`;
        const processor = "Intel Core i7-13700H";

        await goToDevicesEdit(page);
        const saveRequest = await addDeviceFromEditPage(page, {
            deviceType: "laptop",
            name: deviceName,
            serialNumber,
            processor,
        });

        const payload = saveRequest.postDataJSON() as any;
        expect(payload.device.device_type).toBe("laptop");
        expect(payload.device.name).toBe(deviceName);
        expect(payload.device.serial_number).toBe(serialNumber);
        expect(payload.device.specifications.processor).toBe(processor);

        await expect(page).toHaveURL(/\/settings\/devices$/);
        await expect(page.locator("body")).toContainText(deviceName);
        await expect(page.locator("body")).toContainText(serialNumber);

        const user = await fetchCurrentUser(page);
        const device = (await fetchDevices(page, user.id)).find(
            item => item.name === deviceName
        );

        expect(device).toBeTruthy();
        if (device?.id) {
            await deleteDevice(page, user.id, device.id);
        }
    });

    test("can save a mobile device with serial number and processor", async ({
        page,
    }) => {
        const deviceName = `E2E Mobile ${Date.now()}`;
        const serialNumber = `SN-MOB-${Date.now()}`;
        const processor = "Apple A17 Pro";

        await goToDevicesEdit(page);
        const saveRequest = await addDeviceFromEditPage(page, {
            deviceType: "mobile",
            name: deviceName,
            serialNumber,
            processor,
        });

        const payload = saveRequest.postDataJSON() as any;
        expect(payload.device.device_type).toBe("mobile");
        expect(payload.device.name).toBe(deviceName);
        expect(payload.device.serial_number).toBe(serialNumber);
        expect(payload.device.specifications.processor).toBe(processor);

        await expect(page).toHaveURL(/\/settings\/devices$/);
        await expect(page.locator("body")).toContainText(deviceName);
        await expect(page.locator("body")).toContainText(serialNumber);

        const user = await fetchCurrentUser(page);
        const device = (await fetchDevices(page, user.id)).find(
            item => item.name === deviceName
        );

        expect(device).toBeTruthy();
        if (device?.id) {
            await deleteDevice(page, user.id, device.id);
        }
    });

    test("long model names and serial numbers round-trip through the form", async ({
        page,
    }) => {
        const longName = `E2E-${"Model".repeat(20)}`.slice(0, 100);
        const longSerial = `SN-${"SERIAL".repeat(25)}`;
        const longProcessor = `Processor-${"X".repeat(40)}`;

        await goToDevicesEdit(page);
        const saveRequest = await addDeviceFromEditPage(page, {
            deviceType: "laptop",
            name: longName,
            serialNumber: longSerial,
            processor: longProcessor,
        });

        const payload = saveRequest.postDataJSON() as any;
        expect(payload.device.device_type).toBe("laptop");
        expect(payload.device.name).toBe(longName);
        expect(payload.device.serial_number).toBe(longSerial);
        expect(payload.device.specifications.processor).toBe(longProcessor);

        await expect(page).toHaveURL(/\/settings\/devices$/);
        await expect(page.locator("body")).toContainText(longName);
        await expect(page.locator("body")).toContainText(longSerial);

        const user = await fetchCurrentUser(page);
        const device = (await fetchDevices(page, user.id)).find(
            item => item.name === longName
        );

        expect(device).toBeTruthy();
        if (device?.id) {
            await deleteDevice(page, user.id, device.id);
        }
    });

    test("does not persist a completely empty device card", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const beforeDevices = await fetchDevices(page, user.id);
        const beforeIds = new Set(beforeDevices.map(device => device.id));

        await goToDevicesEdit(page);
        await page.getByText(/add another device/i).click();
        await page.getByRole("button", { name: /save changes/i }).click();

        // Give the save flow a moment to settle before checking persisted state.
        await page.waitForTimeout(1000);

        const afterDevices = await fetchDevices(page, user.id);
        const newlyCreated = afterDevices.filter(
            device => !beforeIds.has(device.id)
        );

        // Cleanup in case the bug still reproduces, so this test stays isolated.
        for (const device of newlyCreated) {
            await deleteDevice(page, user.id, device.id);
        }

        expect(
            newlyCreated.length,
            "Empty device should not be persisted"
        ).toBe(0);
    });
});
