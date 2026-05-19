import { Page, expect, APIRequestContext } from "@playwright/test";

/** Seed password — matches db/seeds.rb PASSWORD constant. */
export const TEST_PASSWORD = process.env.SEED_PASSWORD || "Miru@Dev2026!";

// ---------------------------------------------------------------------------
// API helpers — create invoices in specific statuses for test isolation
// ---------------------------------------------------------------------------

let clientIdCache: string | null = null;
let invoiceCounter = 0;

/** Get the first client ID (cached across calls within a worker). */
async function getClientId(request: APIRequestContext): Promise<string> {
    if (clientIdCache) return clientIdCache;

    const res = await request.get("/api/v1/clients");
    const body = await res.json();
    const clients = body.client_details || body.clients || [];
    if (clients.length === 0) throw new Error("No clients found in seed data");
    clientIdCache = String(clients[0].id);
    return clientIdCache;
}

/** Generate a unique invoice number per worker to avoid collisions. */
function uniqueInvoiceNumber(prefix: string): string {
    invoiceCounter++;
    const ts = Date.now().toString(36);
    return `${prefix}-${ts}-${invoiceCounter}`;
}

/** Create a draft invoice via the API. Returns the invoice object. */
export async function createDraftInvoice(page: Page) {
    const clientId = await getClientId(page.request);
    const invoiceNumber = uniqueInvoiceNumber("E2E-DRAFT");
    const today = new Date().toISOString().split("T")[0];
    const due = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    const res = await page.request.post("/api/v1/invoices", {
        data: {
            invoice: {
                invoice_number: invoiceNumber,
                client_id: clientId,
                issue_date: today,
                due_date: due,
                status: "draft",
                tax: 0,
                discount: 0,
                invoice_line_items_attributes: [
                    {
                        name: "E2E Test Service",
                        description: "Automated test line item",
                        date: today,
                        rate: 100,
                        quantity: 60,
                    },
                ],
            },
        },
    });
    expect(res.ok(), `Failed to create draft invoice: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.invoice || body;
}

/** Create a sent invoice (create draft, then send it). */
export async function createSentInvoice(page: Page) {
    const invoice = await createDraftInvoice(page);
    const clientId = await getClientId(page.request);

    // Fetch client email for the recipient
    const clientRes = await page.request.get("/api/v1/clients");
    const clientBody = await clientRes.json();
    const clients = clientBody.client_details || clientBody.clients || [];
    const client = clients.find((c: any) => String(c.id) === String(clientId));
    const email = client?.email || "e2e-test@example.com";

    const sendRes = await page.request.post(
        `/api/v1/invoices/${invoice.id}/send_invoice`,
        {
            data: {
                invoice_email: {
                    subject: "E2E Test Invoice",
                    message: "Automated test",
                    recipients: [email],
                },
            },
        }
    );
    expect(sendRes.ok(), `Failed to send invoice: ${sendRes.status()}`).toBeTruthy();

    // Re-fetch to get updated status
    const showRes = await page.request.get(`/api/v1/invoices/${invoice.id}`);
    const showBody = await showRes.json();
    return showBody.invoice || showBody;
}

/** Create an overdue invoice (sent + past due date). */
export async function createOverdueInvoice(page: Page) {
    const clientId = await getClientId(page.request);
    const invoiceNumber = uniqueInvoiceNumber("E2E-OVERDUE");
    const pastDate = new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0];
    const pastDue = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

    // Create with past dates
    const res = await page.request.post("/api/v1/invoices", {
        data: {
            invoice: {
                invoice_number: invoiceNumber,
                client_id: clientId,
                issue_date: pastDate,
                due_date: pastDue,
                status: "draft",
                tax: 0,
                discount: 0,
                invoice_line_items_attributes: [
                    {
                        name: "E2E Overdue Service",
                        description: "Automated test",
                        date: pastDate,
                        rate: 50,
                        quantity: 60,
                    },
                ],
            },
        },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const invoice = body.invoice || body;

    // Send it so it becomes "sent" with a past due date
    const clientRes = await page.request.get("/api/v1/clients");
    const clientBody = await clientRes.json();
    const clients = clientBody.client_details || clientBody.clients || [];
    const client = clients.find((c: any) => String(c.id) === String(clientId));

    await page.request.post(`/api/v1/invoices/${invoice.id}/send_invoice`, {
        data: {
            invoice_email: {
                subject: "E2E Overdue",
                message: "Test",
                recipients: [client?.email || "e2e@example.com"],
            },
        },
    });

    const showRes = await page.request.get(`/api/v1/invoices/${invoice.id}`);
    const showBody = await showRes.json();
    return showBody.invoice || showBody;
}

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

/** Navigate to the invoices list and wait for the table to settle. */
export async function goToInvoices(page: Page) {
    await page.goto("/invoices");
    await page.waitForLoadState("networkidle");
    await expect(
        page.locator("table, :text('No invoices')")
    ).toBeVisible({ timeout: 15_000 });
}

/** Return the first visible invoice row. */
export function firstInvoiceRow(page: Page) {
    return page.locator("tr[data-testid^='invoice-row-']").first();
}

/** Find an invoice row by invoice number text. */
export function invoiceRowByNumber(page: Page, invoiceNumber: string) {
    return page
        .locator("tr[data-testid^='invoice-row-']")
        .filter({ hasText: invoiceNumber });
}

/** Wait for a toast notification containing `text`. */
export async function expectToast(page: Page, text: string | RegExp) {
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
    await expect(toast).toBeVisible({ timeout: 10_000 });
}

/** Fill a Radix Select trigger identified by `testId` with the first option. */
export async function selectFirstOption(page: Page, testId: string) {
    await page.locator(`[data-testid="${testId}"]`).click();
    await page.locator('[role="option"]').first().click();
}
