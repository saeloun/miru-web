import { APIRequestContext, expect, Locator, Page } from "@playwright/test";
import { TEST_PASSWORD } from "../helpers";

type DashboardStats = {
    total_revenue: number;
    revenue_trend: number;
    active_projects: number;
    projects_trend: number;
    team_size: number;
    billable_hours: number;
    hours_trend: number;
    open_invoices?: number;
    paid_invoices?: number;
    payments_received?: number;
    currency?: string;
};

type RevenuePoint = {
    month: string;
    revenue: number;
    monthly_revenue: number;
    invoices: number;
};

type RevenueByCustomer = {
    id: number;
    name: string;
    revenue: number;
    percentage: number;
};

export type DashboardResponse = {
    stats: DashboardStats;
    revenue_chart: RevenuePoint[];
    revenue_by_customer: RevenueByCustomer[];
    meta?: {
        currency?: string;
    };
};

export type DashboardActivity = {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    time_ago: string;
    icon: string;
    metadata?: {
        amount?: number;
        currency?: string;
        status?: string;
        [key: string]: unknown;
    };
};

export type DashboardActivitiesResponse = {
    activities: DashboardActivity[];
    has_more: boolean;
    total_count: number;
    error?: string;
};

let firstClientCache: { id: number; name: string; email: string } | null = null;
let invoiceCounter = 0;

async function getFirstClient(
    request: APIRequestContext,
): Promise<{ id: number; name: string; email: string }> {
    if (firstClientCache) return firstClientCache;

    const res = await request.get("/api/v1/clients");
    expect(res.ok(), `Failed to fetch clients: ${res.status()}`).toBeTruthy();

    const body = await res.json();
    const clients = body.client_details || body.clients || [];
    if (clients.length === 0) throw new Error("No clients found in seed data");

    const firstClient = clients[0];
    firstClientCache = {
        id: firstClient.id,
        name: firstClient.name,
        email: firstClient.email || "dashboard-e2e@example.com",
    };

    return firstClientCache;
}

export function uniqueDashboardInvoiceNumber(prefix = "E2E-DASH"): string {
    invoiceCounter += 1;
    return `${prefix}-${Date.now()}-${invoiceCounter}`;
}

export async function createSentDashboardInvoice(
    page: Page,
    overrides: {
        client_id?: number;
        invoice_number?: string;
        amount?: number;
        issue_date?: string;
        due_date?: string;
        line_item_name?: string;
        recipient_email?: string;
    } = {},
) {
    const client = await getFirstClient(page.request);
    const invoiceNumber =
        overrides.invoice_number || uniqueDashboardInvoiceNumber();
    const issueDate =
        overrides.issue_date || new Date().toISOString().split("T")[0];
    const dueDate =
        overrides.due_date ||
        new Date(Date.now() + 30 * 86_400_000).toISOString().split("T")[0];
    const amount = overrides.amount ?? 1500;

    const createRes = await page.request.post("/api/v1/invoices", {
        data: {
            invoice: {
                invoice_number: invoiceNumber,
                client_id: overrides.client_id || client.id,
                issue_date: issueDate,
                due_date: dueDate,
                status: "draft",
                tax: 0,
                discount: 0,
                invoice_line_items_attributes: [
                    {
                        name: overrides.line_item_name || `Dashboard activity ${Date.now()}`,
                        description: "Dashboard E2E invoice",
                        date: issueDate,
                        rate: amount,
                        quantity: 1,
                    },
                ],
            },
        },
    });
    expect(
        createRes.ok(),
        `Failed to create dashboard invoice: ${createRes.status()}`,
    ).toBeTruthy();

    const createBody = await createRes.json();
    const createdInvoice = createBody.invoice || createBody;

    const sendRes = await page.request.post(
        `/api/v1/invoices/${createdInvoice.id}/send_invoice`,
        {
            data: {
                invoice_email: {
                    subject: `Dashboard E2E ${invoiceNumber}`,
                    message: "Dashboard activity verification",
                    recipients: [overrides.recipient_email || client.email],
                },
            },
        },
    );
    expect(
        sendRes.ok(),
        `Failed to send dashboard invoice: ${sendRes.status()}`,
    ).toBeTruthy();

    const showRes = await page.request.get(`/api/v1/invoices/${createdInvoice.id}`);
    expect(
        showRes.ok(),
        `Failed to fetch created invoice: ${showRes.status()}`,
    ).toBeTruthy();

    const showBody = await showRes.json();
    const invoice = showBody.invoice || showBody;

    return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number || invoice.invoiceNumber || invoiceNumber,
        clientName: client.name,
    };
}

export async function createDashboardPayment(
    page: Page,
    invoiceId: number | string,
    overrides: {
        amount?: number;
        transaction_date?: string;
        transaction_type?: string;
        note?: string;
    } = {},
) {
    const today = new Date().toISOString().split("T")[0];

    const res = await page.request.post("/api/v1/payments", {
        data: {
            payment: {
                invoice_id: invoiceId,
                transaction_date: overrides.transaction_date || today,
                transaction_type: overrides.transaction_type || "bank_transfer",
                amount: overrides.amount ?? 1250,
                note: overrides.note || `Dashboard payment ${Date.now()}`,
            },
        },
    });
    expect(res.ok(), `Failed to create payment: ${res.status()}`).toBeTruthy();

    const body = await res.json();
    return body.payment || body;
}

export async function deleteDashboardInvoice(
    page: Page,
    invoiceId: number | string,
) {
    const res = await page.request.delete(`/api/v1/invoices/${invoiceId}`);
    expect([200, 204, 404]).toContain(res.status());
}

export async function goToDashboard(page: Page) {
    await page.goto("/dashboard");
    await expect(
        page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible({ timeout: 15_000 });
}

export async function signInAs(
    page: Page,
    email: string,
    password = TEST_PASSWORD,
) {
    await page.goto("/user/sign_in");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|payments|time-tracking|invoices)/, {
        timeout: 15_000,
    });
}

export async function expectToast(page: Page, text: string | RegExp) {
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
    await expect(toast).toBeVisible({ timeout: 10_000 });
}

export function buildDashboardResponse(
    overrides: Partial<DashboardResponse> = {},
): DashboardResponse {
    return {
        stats: {
            total_revenue: 47_419.36,
            revenue_trend: 56.3,
            active_projects: 6,
            projects_trend: 100,
            team_size: 13,
            billable_hours: 3338,
            hours_trend: 3,
            currency: "USD",
            ...overrides.stats,
        },
        revenue_chart: overrides.revenue_chart || [
            { month: "Jan", revenue: 12_000, monthly_revenue: 12_000, invoices: 1 },
            { month: "Feb", revenue: 24_000, monthly_revenue: 12_000, invoices: 2 },
            { month: "Mar", revenue: 36_000, monthly_revenue: 12_000, invoices: 3 },
            { month: "Apr", revenue: 48_000, monthly_revenue: 12_000, invoices: 4 },
        ],
        revenue_by_customer: overrides.revenue_by_customer || [
            { id: 1, name: "Microsoft", revenue: 43_000, percentage: 90 },
            { id: 2, name: "Acme Labs", revenue: 5_000, percentage: 10 },
        ],
        meta: {
            currency: "USD",
            ...overrides.meta,
        },
    };
}

export function buildActivitiesResponse(
    overrides: Partial<DashboardActivitiesResponse> = {},
): DashboardActivitiesResponse {
    return {
        activities: [],
        has_more: false,
        total_count: 0,
        ...overrides,
    };
}

export async function mockDashboardApis(
    page: Page,
    options: {
        dashboard?: DashboardResponse;
        dashboardStatus?: number;
        delayedDashboardMs?: number;
        activitiesByOffset?: Record<number, DashboardActivitiesResponse>;
        delayedActivitiesMs?: number;
    } = {},
) {
    const dashboard = options.dashboard || buildDashboardResponse();
    const dashboardStatus = options.dashboardStatus ?? 200;
    const delayedDashboardMs = options.delayedDashboardMs ?? 0;
    const delayedActivitiesMs = options.delayedActivitiesMs ?? 0;
    const activitiesByOffset = options.activitiesByOffset || {
        0: buildActivitiesResponse(),
    };

    await page.route("**/api/v1/dashboard/activities?*", async route => {
        if (delayedActivitiesMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayedActivitiesMs));
        }

        const url = new URL(route.request().url());
        const offset = Number(url.searchParams.get("offset") || 0);
        const response =
            activitiesByOffset[offset] || buildActivitiesResponse();

        await route.fulfill({
            status: response.error ? 500 : 200,
            contentType: "application/json",
            body: JSON.stringify(response),
        });
    });

    await page.route("**/api/v1/dashboard?*", async route => {
        if (delayedDashboardMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayedDashboardMs));
        }

        await route.fulfill({
            status: dashboardStatus,
            contentType: "application/json",
            body: JSON.stringify(
                dashboardStatus >= 400 ? { error: "Dashboard failed" } : dashboard,
            ),
        });
    });
}

export function parseColor(
    color: string,
): { r: number; g: number; b: number; a: number } | null {
    const rgbaMatch = color.match(
        /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/,
    );
    if (rgbaMatch) {
        return {
            r: +rgbaMatch[1],
            g: +rgbaMatch[2],
            b: +rgbaMatch[3],
            a: +rgbaMatch[4],
        };
    }

    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        return {
            r: +rgbMatch[1],
            g: +rgbMatch[2],
            b: +rgbMatch[3],
            a: 1,
        };
    }

    const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) hex = hex.split("").map(char => char + char).join("");

        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
            a: 1,
        };
    }

    return null;
}

function alphaBlend(
    fg: { r: number; g: number; b: number; a: number },
    bg: { r: number; g: number; b: number; a: number },
): { r: number; g: number; b: number } {
    let bgR = bg.r;
    let bgG = bg.g;
    let bgB = bg.b;

    if (bg.a < 1) {
        bgR = Math.round(bg.r * bg.a + 255 * (1 - bg.a));
        bgG = Math.round(bg.g * bg.a + 255 * (1 - bg.a));
        bgB = Math.round(bg.b * bg.a + 255 * (1 - bg.a));
    }

    return {
        r: Math.round(fg.r * fg.a + bgR * (1 - fg.a)),
        g: Math.round(fg.g * fg.a + bgG * (1 - fg.a)),
        b: Math.round(fg.b * fg.a + bgB * (1 - fg.a)),
    };
}

export function relativeLuminance({
    r,
    g,
    b,
}: {
    r: number;
    g: number;
    b: number;
}) {
    const [rs, gs, bs] = [r, g, b].map(value => {
        const channel = value / 255;
        return channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(fgStr: string, bgStr: string): number {
    const fg = parseColor(fgStr);
    const bg = parseColor(bgStr);
    if (!fg || !bg) return 1;

    const resolvedBg = alphaBlend(bg, { r: 255, g: 255, b: 255, a: 1 });
    const resolvedFg = alphaBlend(fg, { ...resolvedBg, a: 1 });

    const l1 = relativeLuminance(resolvedFg);
    const l2 = relativeLuminance(resolvedBg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3;

export async function getElementContrast(page: Page, locator: Locator) {
    return locator.evaluate(element => {
        const style = getComputedStyle(element);
        const fg = style.color;

        let bg = style.backgroundColor;
        let current = element.parentElement;
        while (
            current &&
            (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")
        ) {
            bg = getComputedStyle(current).backgroundColor;
            current = current.parentElement;
        }

        if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") {
            bg = "rgb(255, 255, 255)";
        }

        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight, 10) || 400;
        const isLargeText =
            fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);

        return { fg, bg, fontSize, fontWeight, isLargeText };
    });
}
