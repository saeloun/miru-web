/**
 * Clients-specific helpers for E2E tests.
 */
import { Page, expect, APIRequestContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// Caches (per-worker)
// ---------------------------------------------------------------------------
let clientCounter = 0;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/** Generate a unique client name per worker. */
export function uniqueClientName(prefix = "E2E-Client"): string {
    clientCounter++;
    const ts = Date.now().toString(36);
    return `${prefix}-${ts}-${clientCounter}`.slice(0, 30);
}

/** Create a client via the API using multipart form data. Returns the client object. */
export async function createClient(
    page: Page,
    overrides: { name?: string; email?: string } = {},
) {
    const name = overrides.name || uniqueClientName();
    const email = overrides.email || `${Date.now()}@e2e-test.com`;

    const res = await page.request.post("/api/v1/clients", {
        multipart: {
            "client[name]": name,
            "client[email]": email,
            "client[phone]": "+12025551234",
            "client[currency]": "USD",
            "client[addresses_attributes][0][address_line_1]": "123 E2E St",
            "client[addresses_attributes][0][address_line_2]": "",
            "client[addresses_attributes][0][city]": "TestCity",
            "client[addresses_attributes][0][state]": "TestState",
            "client[addresses_attributes][0][country]": "US",
            "client[addresses_attributes][0][pin]": "10001",
        },
    });
    expect(res.ok(), `Failed to create client: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    const client = body.client || body;
    return { ...client, name, email };
}

/** Delete a client via the API. */
export async function deleteClientApi(page: Page, clientId: string | number) {
    const res = await page.request.delete(`/api/v1/clients/${clientId}`);
    expect([200, 404]).toContain(res.status());
}

/** Fetch all clients via the API. */
export async function fetchClients(page: Page) {
    const res = await page.request.get("/api/v1/clients?time_frame=week");
    expect(res.ok()).toBeTruthy();
    return await res.json();
}

// ---------------------------------------------------------------------------
// Page navigation helpers
// ---------------------------------------------------------------------------

/** Navigate to the clients list and wait for the table or empty state. */
export async function goToClients(page: Page) {
    await page.goto("/clients");
    await expect(
        page.locator("table, :text('No clients yet'), :text('Failed to load')").first(),
    ).toBeVisible({ timeout: 15_000 });
}

/** Wait for a toast notification containing `text`. */
export async function expectToast(page: Page, text: string | RegExp) {
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
    await expect(toast).toBeVisible({ timeout: 10_000 });
}

/** Click the kebab (⋯) menu on a client row, identified by client name. */
export async function openKebabMenu(page: Page, clientName: string) {
    const row = page.locator("tr").filter({ hasText: clientName });
    await expect(row).toBeVisible();
    // The kebab trigger has a sr-only "Open menu" span
    const kebab = row.getByRole("button", { name: /open menu/i });
    await kebab.click();
}

// ---------------------------------------------------------------------------
// Contrast helpers (copied from time-tracking)
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
