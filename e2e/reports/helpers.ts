/**
 * Reports-specific helpers for E2E tests.
 * Provides API-based test data creation and page navigation utilities.
 */
import { Page, expect, APIRequestContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// Caches (per-worker)
// ---------------------------------------------------------------------------
let firstClientCache: { id: number; name: string } | null = null;
let firstProjectCache: { id: number; name: string; clientName: string } | null = null;
let currentUserIdCache: number | null = null;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/** Get the current user's ID via the /api/v1/users/_me endpoint. */
export async function getCurrentUserId(request: APIRequestContext): Promise<number> {
    if (currentUserIdCache) return currentUserIdCache;

    const res = await request.get("/api/v1/users/_me");
    expect(res.ok(), `Failed to fetch current user: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    currentUserIdCache = body.user?.id || body.id;
    return currentUserIdCache!;
}

/** Get the first client (cached within a worker). */
export async function getFirstClient(request: APIRequestContext): Promise<{ id: number; name: string }> {
    if (firstClientCache) return firstClientCache;

    const res = await request.get("/api/v1/projects");
    expect(res.ok(), `Failed to fetch projects/clients: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    const clients = body.clients || [];
    if (clients.length === 0) throw new Error("No clients found in seed data");
    firstClientCache = { id: clients[0].id, name: clients[0].name };
    return firstClientCache;
}

/** Get the first project with its client name (cached within a worker). */
export async function getFirstProject(request: APIRequestContext) {
    if (firstProjectCache) return firstProjectCache;

    const res = await request.get("/api/v1/projects");
    expect(res.ok(), `Failed to fetch projects: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    const projects = body.projects || [];
    if (projects.length === 0) throw new Error("No projects found in seed data");
    firstProjectCache = {
        id: projects[0].id,
        name: projects[0].name,
        clientName: projects[0].client_name,
    };
    return firstProjectCache;
}

/** Create a timesheet entry via the API. Returns the entry snippet. */
export async function createTimesheetEntry(
    page: Page,
    overrides: {
        project_id?: number;
        duration?: number;
        note?: string;
        work_date?: string;
        bill_status?: string;
    } = {},
) {
    const project = await getFirstProject(page.request);
    const userId = await getCurrentUserId(page.request);
    const today = new Date().toISOString().split("T")[0];

    const res = await page.request.post(`/api/v1/timesheet_entry?user_id=${userId}`, {
        data: {
            project_id: overrides.project_id || project.id,
            timesheet_entry: {
                work_date: overrides.work_date || today,
                duration: overrides.duration || 60,
                note: overrides.note || `E2E entry ${Date.now()}`,
                bill_status: overrides.bill_status || "unbilled",
            },
        },
    });
    expect(res.ok(), `Failed to create timesheet entry: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return { ...body.entry || body, client: project.clientName, project: project.name };
}

/** Delete a timesheet entry via the API. */
export async function deleteTimesheetEntry(page: Page, entryId: number | string) {
    const res = await page.request.delete(`/api/v1/timesheet_entry/${entryId}`);
    // 200 = success, 404 = already gone — both are fine for cleanup
    expect([200, 404]).toContain(res.status());
}

/** Create a payment record via the API (if endpoint exists). */
export async function createPayment(
    page: Page,
    overrides: {
        client_id?: number;
        amount?: number;
        payment_method?: string;
        payment_date?: string;
        status?: string;
    } = {},
) {
    const client = await getFirstClient(page.request);
    const today = new Date().toISOString().split("T")[0];

    const res = await page.request.post("/api/v1/payments", {
        data: {
            payment: {
                client_id: overrides.client_id || client.id,
                amount: overrides.amount || 1000,
                payment_method: overrides.payment_method || "credit_card",
                payment_date: overrides.payment_date || today,
                status: overrides.status || "completed",
                transaction_id: `txn_${Date.now()}`,
                notes: `E2E payment ${Date.now()}`,
            },
        },
    });
    expect(res.ok(), `Failed to create payment: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.payment || body;
}

/** Delete a payment via the API. */
export async function deletePayment(page: Page, paymentId: number | string) {
    const res = await page.request.delete(`/api/v1/payments/${paymentId}`);
    expect([200, 404]).toContain(res.status());
}

// ---------------------------------------------------------------------------
// Page navigation helpers
// ---------------------------------------------------------------------------

/** Navigate to the main reports page and wait for it to settle. */
export async function goToReports(page: Page) {
    await page.goto("/reports");
    // Wait for either the stats cards or the access gate redirect
    await expect(
        page.locator("[data-testid='reports-stats'], .text-2xl:has-text('Available Reports'), h1:has-text('Reports')").first(),
    ).toBeVisible({ timeout: 15_000 });
}

/** Navigate to a specific report page and wait for it to settle. */
export async function goToReport(page: Page, reportPath: string) {
    await page.goto(`/reports/${reportPath}`);
    // Wait for the report header or main content to load
    await expect(
        page.locator("h1, .text-2xl, [data-testid='report-header']").first(),
    ).toBeVisible({ timeout: 15_000 });
}

/** Wait for a toast notification containing `text`. */
export async function expectToast(page: Page, text: string | RegExp) {
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
    await expect(toast).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Contrast helpers (copied from time-tracking/helpers.ts)
// ---------------------------------------------------------------------------

/**
 * Parse a CSS color string (rgb/rgba/hex) into {r, g, b, a} values.
 * Returns null if the format is not recognized.
 */
function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
    // rgba(r, g, b, a)
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (rgbaMatch) {
        return { r: +rgbaMatch[1], g: +rgbaMatch[2], b: +rgbaMatch[3], a: +rgbaMatch[4] };
    }
    // rgb(r, g, b)
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3], a: 1 };
    }
    // #rrggbb or #rgb
    const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
            a: 1,
        };
    }
    return null;
}

/**
 * Alpha-blend a foreground color onto a background color.
 * If the bg itself is semi-transparent, blend onto white.
 */
function alphaBlend(
    fg: { r: number; g: number; b: number; a: number },
    bg: { r: number; g: number; b: number; a: number },
): { r: number; g: number; b: number } {
    // First resolve the bg against white if it has alpha
    let bgR = bg.r, bgG = bg.g, bgB = bg.b;
    if (bg.a < 1) {
        bgR = Math.round(bg.r * bg.a + 255 * (1 - bg.a));
        bgG = Math.round(bg.g * bg.a + 255 * (1 - bg.a));
        bgB = Math.round(bg.b * bg.a + 255 * (1 - bg.a));
    }
    // Then blend fg onto resolved bg
    const a = fg.a;
    return {
        r: Math.round(fg.r * a + bgR * (1 - a)),
        g: Math.round(fg.g * a + bgG * (1 - a)),
        b: Math.round(fg.b * a + bgB * (1 - a)),
    };
}

/** Compute relative luminance per WCAG 2.1. */
function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
    const [rs, gs, bs] = [r, g, b].map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Compute WCAG contrast ratio between two CSS color strings. Handles alpha blending. */
export function contrastRatio(fgStr: string, bgStr: string): number {
    const fgC = parseColor(fgStr);
    const bgC = parseColor(bgStr);
    if (!fgC || !bgC) return 1;

    // Alpha-blend both colors (bg onto white, then fg onto resolved bg)
    const resolvedBg = alphaBlend(bgC, { r: 255, g: 255, b: 255, a: 1 });
    const resolvedFg = alphaBlend(fgC, { ...resolvedBg, a: 1 });

    const l1 = relativeLuminance(resolvedFg);
    const l2 = relativeLuminance(resolvedBg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA minimum for normal text. */
export const WCAG_AA_NORMAL = 4.5;
/** WCAG AA minimum for large text (>=18px bold or >=24px). */
export const WCAG_AA_LARGE = 3;

/**
 * Evaluate fg/bg colors of a locator.
 * Walks up the DOM for a non-transparent bg, collecting all layers for alpha compositing.
 */
export async function getElementContrast(page: Page, locator: any) {
    return locator.evaluate(el => {
        const style = getComputedStyle(el);
        const fg = style.color;

        // Walk up the tree to find the first opaque background
        let bg = style.backgroundColor;
        let current = el.parentElement;
        while (
            current &&
            (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")
        ) {
            bg = getComputedStyle(current).backgroundColor;
            current = current.parentElement;
        }
        if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") bg = "rgb(255, 255, 255)";

        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight, 10) || 400;
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);

        return { fg, bg, fontSize, fontWeight, isLargeText };
    });
}