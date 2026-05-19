/**
 * Expense-specific helpers for E2E tests.
 * Provides API-based test data creation, page navigation, and contrast utilities.
 */
import { Page, expect, APIRequestContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TEST_PASSWORD = process.env.SEED_PASSWORD || "Miru@Dev2026!";

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

let expenseCounter = 0;

/** Generate a unique description per worker to avoid collisions. */
export function uniqueDescription(prefix = "E2E-Expense"): string {
    expenseCounter++;
    const ts = Date.now().toString(36);
    return `${prefix}-${ts}-${expenseCounter}`;
}

/** Create an expense via the API. Returns the expense object from the response. */
export async function createExpense(
    page: Page,
    overrides: {
        amount?: number;
        date?: string;
        description?: string;
        expense_type?: "business" | "personal";
        category_name?: string;
        vendor_name?: string;
    } = {},
) {
    const today = new Date().toISOString().split("T")[0];
    const description = overrides.description || uniqueDescription();

    const payload = new FormData();
    payload.append("expense[amount]", String(overrides.amount ?? 100));
    payload.append("expense[date]", overrides.date || today);
    payload.append("expense[description]", description);
    payload.append("expense[expense_type]", overrides.expense_type || "business");
    payload.append("expense[category_name]", overrides.category_name || "Food");
    if (overrides.vendor_name) {
        payload.append("expense[vendor_name]", overrides.vendor_name);
    }

    const res = await page.request.post("/api/v1/expenses", {
        multipart: {
            "expense[amount]": String(overrides.amount ?? 100),
            "expense[date]": overrides.date || today,
            "expense[description]": description,
            "expense[expense_type]": overrides.expense_type || "business",
            "expense[category_name]": overrides.category_name || "Food",
            ...(overrides.vendor_name
                ? { "expense[vendor_name]": overrides.vendor_name }
                : {}),
        },
    });
    expect(res.ok(), `Failed to create expense: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.expense || body;
}

/** Delete an expense via the API. */
export async function deleteExpense(page: Page, expenseId: string | number) {
    const res = await page.request.delete(`/api/v1/expenses/${expenseId}`);
    // 200 = success, 404 = already gone — both are fine for cleanup
    expect([200, 404]).toContain(res.status());
}

/** Approve an expense via the API. */
export async function approveExpense(page: Page, expenseId: string | number) {
    const res = await page.request.patch(`/api/v1/expenses/${expenseId}/approve`);
    expect(res.ok(), `Failed to approve expense: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.expense || body;
}

/** Reject an expense via the API. */
export async function rejectExpense(page: Page, expenseId: string | number) {
    const res = await page.request.patch(`/api/v1/expenses/${expenseId}/reject`);
    expect(res.ok(), `Failed to reject expense: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.expense || body;
}

/** Mark an expense as paid via the API. Expense must be approved first. */
export async function markExpensePaid(page: Page, expenseId: string | number) {
    const res = await page.request.patch(`/api/v1/expenses/${expenseId}/mark_paid`);
    expect(res.ok(), `Failed to mark expense paid: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.expense || body;
}

// ---------------------------------------------------------------------------
// Page navigation helpers
// ---------------------------------------------------------------------------

/** Navigate to the expenses list and wait for the table or empty state. */
export async function goToExpenses(page: Page) {
    await page.goto("/expenses");
    // Wait for either the data table, the empty state, or the error state
    await expect(
        page.locator("table, :text('No expenses recorded'), :text('Submit your first expense'), :text('Failed to load')").first(),
    ).toBeVisible({ timeout: 15_000 });
}

/** Wait for a toast notification containing `text`. Uses .first() to handle Sonner stacking duplicates. */
export async function expectToast(page: Page, text: string | RegExp) {
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: text }).first();
    await expect(toast).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** Login as a specific user. Waits for the post-login redirect to settle. */
export async function loginAs(page: Page, email: string, password?: string) {
    const pw = password || TEST_PASSWORD;
    await page.goto("/user/sign_in");
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill(pw);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    // Wait for the SPA to land on any authenticated route
    await page.waitForURL(/\/(dashboard|time-tracking|expenses|projects)/, { timeout: 15_000 });
    // Let the SPA router fully settle
    await page.waitForLoadState("networkidle");
}

// ---------------------------------------------------------------------------
// Contrast helpers
// ---------------------------------------------------------------------------

/**
 * Parse a CSS color string (rgb/rgba/hex) into {r, g, b, a} values.
 */
function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (rgbaMatch) {
        return { r: +rgbaMatch[1], g: +rgbaMatch[2], b: +rgbaMatch[3], a: +rgbaMatch[4] };
    }
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3], a: 1 };
    }
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
 */
function alphaBlend(
    fg: { r: number; g: number; b: number; a: number },
    bg: { r: number; g: number; b: number; a: number },
): { r: number; g: number; b: number } {
    let bgR = bg.r, bgG = bg.g, bgB = bg.b;
    if (bg.a < 1) {
        bgR = Math.round(bg.r * bg.a + 255 * (1 - bg.a));
        bgG = Math.round(bg.g * bg.a + 255 * (1 - bg.a));
        bgB = Math.round(bg.b * bg.a + 255 * (1 - bg.a));
    }
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
 * Walks up the DOM for a non-transparent bg.
 */
export async function getColors(page: Page, locator: any) {
    return locator.evaluate((el: Element) => {
        const style = getComputedStyle(el);
        const fg = style.color;

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
