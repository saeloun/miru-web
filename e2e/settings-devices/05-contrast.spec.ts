/**
 * Devices Settings — WCAG AA Contrast Checks.
 * Covers: device card headers, labels, button text.
 */
import { test, expect } from "@playwright/test";
import { goToDevices, goToDevicesEdit, goToDevicesAndWaitFor, fetchCurrentUser, createDevice, deleteDevice, contrastRatio, getColors, WCAG_AA_NORMAL, WCAG_AA_LARGE } from "./helpers";

test.describe("Devices Settings — Contrast Checks", () => {
    test("Edit/Add button text meets WCAG AA contrast", async ({ page }) => {
        await goToDevices(page);
        const btn = page.getByText(/edit devices|add devices/i).first();
        await expect(btn).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(btn);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Button contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("device card name meets WCAG AA contrast", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const device = await createDevice(page, user.id, { name: "Contrast Device" });

        try {
            await goToDevicesAndWaitFor(page, "Contrast Device");
            const name = page.getByText("Contrast Device");
            const { fg, bg, isLargeText } = await getColors(name);
            const ratio = contrastRatio(fg, bg);
            expect(ratio, `Device name contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
        } finally {
            await deleteDevice(page, user.id, device.id);
        }
    });

    test("device card label text meets WCAG AA contrast", async ({ page }) => {
        const user = await fetchCurrentUser(page);
        const device = await createDevice(page, user.id, { name: "Label Contrast" });

        try {
            await goToDevicesAndWaitFor(page, "Label Contrast");
            const label = page.getByText(/serial number/i).first();
            const { fg, bg, isLargeText } = await getColors(label);
            const ratio = contrastRatio(fg, bg);
            expect(ratio, `Label contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
        } finally {
            await deleteDevice(page, user.id, device.id);
        }
    });

    test("edit page Cancel button meets WCAG AA contrast", async ({ page }) => {
        await goToDevicesEdit(page);
        const btn = page.getByRole("button", { name: /cancel/i });
        await expect(btn).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(btn);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Cancel button contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });

    test("Add Another Device text meets WCAG AA contrast", async ({ page }) => {
        await goToDevicesEdit(page);
        const text = page.getByText(/add another device/i).first();
        await expect(text).toBeVisible();
        const { fg, bg, isLargeText } = await getColors(text);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `Add device text contrast ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);
    });
});
