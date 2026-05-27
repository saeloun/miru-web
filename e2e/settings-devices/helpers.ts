/**
 * Settings / Devices — E2E test helpers.
 * Provides API helpers for device CRUD, page navigation, and contrast utilities.
 */
import { Page, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/** Fetch the current user via the _me endpoint. */
export async function fetchCurrentUser(page: Page) {
    const res = await page.request.get("/api/v1/users/_me");
    expect(res.ok(), `Failed to fetch current user: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.user || body;
}

/** Fetch all devices for a user. Bypasses HTTP caching. */
export async function fetchDevices(page: Page, userId: number | string) {
    const res = await page.request.get(`/api/v1/users/${userId}/devices`, {
        headers: { "Cache-Control": "no-cache", "If-None-Match": "" },
    });
    expect(res.ok(), `Failed to fetch devices: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.devices || [];
}

/** Create a device for a user via the API. Returns the created device. */
export async function createDevice(
    page: Page,
    userId: number | string,
    overrides: {
        device_type?: string;
        name?: string;
        serial_number?: string;
        specifications?: Record<string, string>;
    } = {},
) {
    const res = await page.request.post(`/api/v1/users/${userId}/devices`, {
        data: {
            device: {
                device_type: overrides.device_type || "laptop",
                name: overrides.name || `E2E Device ${Date.now()}`,
                serial_number: overrides.serial_number || `SN-${Date.now()}`,
                specifications: overrides.specifications || {
                    ram: "16GB DDR4",
                    processor: "Intel Core i7",
                    graphics: "Integrated",
                },
            },
        },
    });
    expect(res.ok(), `Failed to create device: ${res.status()}`).toBeTruthy();
    return res.json();
}

/** Delete a device via the API. */
export async function deleteDevice(page: Page, userId: number | string, deviceId: number | string) {
    const res = await page.request.delete(`/api/v1/users/${userId}/devices/${deviceId}`);
    // 204 = success, 404 = already gone
    expect([200, 204, 404]).toContain(res.status());
}

// ---------------------------------------------------------------------------
// Page navigation helpers
// ---------------------------------------------------------------------------

/** Navigate to the devices settings page and wait for it to settle. */
export async function goToDevices(page: Page) {
    await page.goto("/settings/devices");
    // Wait for either the Edit/Add button or the empty state to render
    await expect(
        page.getByText(/edit devices|add devices|no devices found/i).first(),
    ).toBeVisible({ timeout: 15_000 });
}

/**
 * Navigate to the devices page and wait for specific text to be visible.
 * Strips HTTP cache headers to ensure fresh data after API mutations.
 */
export async function goToDevicesAndWaitFor(page: Page, text: string) {
    // Strip conditional headers to bypass Rails HTTP caching
    await page.route("**/api/v1/users/*/devices", route => {
        if (route.request().method() === "GET") {
            const headers = { ...route.request().headers() };
            delete headers["if-none-match"];
            delete headers["if-modified-since"];
            return route.continue({ headers });
        }
        return route.continue();
    });
    await page.goto("/settings/devices");
    await expect(
        page.getByText(/edit devices|add devices|no devices found/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    // If text not visible, reload once
    const locator = page.getByText(text);
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) {
        await page.waitForTimeout(500);
        await page.reload();
        await expect(
            page.getByText(/edit devices|add devices|no devices found/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    }
    await expect(locator).toBeVisible({ timeout: 10_000 });
}

/** Navigate to the devices edit page and wait for it to settle. */
export async function goToDevicesEdit(page: Page) {
    // Navigate via the details page to ensure proper context loading
    await page.goto("/settings/devices");
    // Wait for the details page to load
    await expect(
        page.getByText(/edit devices|add devices|no devices found/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    // Click the Edit/Add button to navigate to edit
    await page.getByText(/edit devices|add devices/i).first().click();
    // Wait for the edit page to render
    await expect(
        page.getByText(/add another device/i),
    ).toBeVisible({ timeout: 15_000 });
}

/** Wait for a toast notification containing `text`. */
export async function expectToast(page: Page, text: string | RegExp) {
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
    await expect(toast).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Contrast helpers
// ---------------------------------------------------------------------------

function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (rgbaMatch) return { r: +rgbaMatch[1], g: +rgbaMatch[2], b: +rgbaMatch[3], a: +rgbaMatch[4] };
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3], a: 1 };
    const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
        return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: 1 };
    }
    return null;
}

function alphaBlend(fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number; a: number }) {
    let bgR = bg.r, bgG = bg.g, bgB = bg.b;
    if (bg.a < 1) { bgR = Math.round(bg.r * bg.a + 255 * (1 - bg.a)); bgG = Math.round(bg.g * bg.a + 255 * (1 - bg.a)); bgB = Math.round(bg.b * bg.a + 255 * (1 - bg.a)); }
    const a = fg.a;
    return { r: Math.round(fg.r * a + bgR * (1 - a)), g: Math.round(fg.g * a + bgG * (1 - a)), b: Math.round(fg.b * a + bgB * (1 - a)) };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
    const [rs, gs, bs] = [r, g, b].map(c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(fgStr: string, bgStr: string): number {
    const fgC = parseColor(fgStr); const bgC = parseColor(bgStr);
    if (!fgC || !bgC) return 1;
    const resolvedBg = alphaBlend(bgC, { r: 255, g: 255, b: 255, a: 1 });
    const resolvedFg = alphaBlend(fgC, { ...resolvedBg, a: 1 });
    const l1 = relativeLuminance(resolvedFg); const l2 = relativeLuminance(resolvedBg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3;

export async function getColors(locator: any) {
    return locator.evaluate((el: HTMLElement) => {
        const style = getComputedStyle(el);
        const fg = style.color;
        let bg = style.backgroundColor;
        let current = el.parentElement;
        while (current && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) { bg = getComputedStyle(current).backgroundColor; current = current.parentElement; }
        if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") bg = "rgb(255, 255, 255)";
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight, 10) || 400;
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        return { fg, bg, fontSize, fontWeight, isLargeText };
    });
}
