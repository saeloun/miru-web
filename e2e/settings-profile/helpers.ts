/**
 * Settings / Profile — E2E test helpers.
 * Provides API helpers, page navigation, and contrast utilities.
 */
import { Page, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/** Fetch the current user's details via the _me endpoint. */
export async function fetchCurrentUser(page: Page) {
    const res = await page.request.get("/api/v1/users/_me");
    expect(res.ok(), `Failed to fetch current user: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.user || body;
}

/** Fetch team member details by ID. */
export async function fetchTeamMember(page: Page, userId: number | string) {
    const res = await page.request.get(`/api/v1/team/${userId}/details`);
    expect(res.ok(), `Failed to fetch team member: ${res.status()}`).toBeTruthy();
    return res.json();
}

/** Seed a current address for a fresh auth fixture so edit-save flows have a valid baseline. */
export async function seedCurrentAddress(page: Page, userId: number | string) {
    const response = await page.evaluate(async currentUserId => {
        const csrfToken =
            document
                .querySelector('[name="csrf-token"]')
                ?.getAttribute("content") || "";

        const res = await fetch(`/api/v1/users/${currentUserId}/addresses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": csrfToken,
            },
            credentials: "same-origin",
            body: JSON.stringify({
                address: {
                    address_type: "current",
                    address_line_1: "100 Test Street",
                    address_line_2: "Suite 200",
                    city: "Brooklyn",
                    state: "NY",
                    country: "US",
                    pin: "11201",
                },
            }),
        });

        return {
            ok: res.ok,
            status: res.status,
        };
    }, userId);

    expect(response.ok, `Failed to seed address: ${response.status}`).toBeTruthy();
}

// ---------------------------------------------------------------------------
// Page navigation helpers
// ---------------------------------------------------------------------------

/** Navigate to the profile settings details page and wait for it to settle. */
export async function goToProfile(page: Page) {
    await page.goto("/settings/profile", { waitUntil: "domcontentloaded" });
    // Wait for the Personal Information card to render after API fetch
    await expect(
        page.getByText(/personal information/i).first(),
    ).toBeVisible({ timeout: 15_000 });
}

/** Navigate to the profile edit page and wait for it to settle. */
export async function goToProfileEdit(page: Page) {
    await page.goto("/settings/profile/edit", { waitUntil: "domcontentloaded" });
    // Wait for the first name input to appear (confirms form loaded)
    await expect(
        page.locator("#first_name"),
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
