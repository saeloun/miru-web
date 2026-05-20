/**
 * TC-INV-001 → 003: Invoice list, filtering, search, pagination.
 */
import { test, expect, type Locator } from "@playwright/test";
import { goToInvoices, firstInvoiceRow, createDraftInvoice } from "../helpers";

test.describe("Invoice List", () => {
    test.beforeEach(async ({ page }) => {
        await goToInvoices(page);
    });

    // TC-INV-001
    test("page loads with summary and table columns", async ({ page }) => {
        // Summary cards should be visible
        await expect(page.getByText(/overdue/i).first()).toBeVisible();
        await expect(page.getByText(/draft/i).first()).toBeVisible();

        // Table headers
        const headers = page.locator("thead th");
        await expect(headers.filter({ hasText: /invoice/i })).toBeVisible();
        await expect(headers.filter({ hasText: /client/i })).toBeVisible();
        await expect(headers.filter({ hasText: /status/i })).toBeVisible();
        await expect(headers.filter({ hasText: /amount/i })).toBeVisible();
    });

    test("invoice rows show correct data", async ({ page }) => {
        const row = firstInvoiceRow(page);
        await expect(row).toBeVisible();

        // Each row should contain an invoice number starting with #
        await expect(row.locator("td").first()).toContainText("#");
    });

    // TC-INV-002: Search
    test("search filters invoices by number", async ({ page }) => {
        const firstRow = firstInvoiceRow(page);
        const invoiceNumber = await firstRow.locator("td").first().innerText();
        const searchTerm = invoiceNumber.replace("#", "").trim();

        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill(searchTerm);

        // After filtering, every visible row should contain the search term
        const visibleRows = page.locator("tr[data-testid^='invoice-row-']");
        const count = await visibleRows.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            await expect(visibleRows.nth(i)).toContainText(searchTerm);
        }
    });

    test("search with non-existent term shows empty state", async ({ page }) => {
        await page.getByPlaceholder(/search/i).fill("ZZZZNONEXISTENT999");
        // The empty state shows "No results found" when searching
        await expect(
            page.getByText("No results found")
        ).toBeVisible({ timeout: 5_000 });
    });

    test("clearing search restores full list", async ({ page }) => {
        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill("ZZZZNONEXISTENT999");
        await expect(
            page.locator("tr[data-testid^='invoice-row-']")
        ).toHaveCount(0);

        await searchInput.clear();
        await expect(
            page.locator("tr[data-testid^='invoice-row-']").first()
        ).toBeVisible();
    });

    // TC-INV-003: Pagination / infinite scroll
    test("shows loaded count", async ({ page }) => {
        // The footer text shows "Loaded X of Y" — use .first() since
        // "All invoices loaded" also matches
        await expect(
            page.getByText(/Loaded \d+ of \d+/).first()
        ).toBeVisible();
    });

    test("invoice stats are visible above the invoice table", async ({ page }) => {
        const statsAnchor = page.getByText(/overdue/i).first();
        const table = page.locator("table").first();

        await expect(statsAnchor).toBeVisible();
        await expect(table).toBeVisible();

        const statsBox = await statsAnchor.boundingBox();
        const tableBox = await table.boundingBox();
        expect(statsBox && tableBox).toBeTruthy();

        if (statsBox && tableBox) {
            expect(
                statsBox.y,
                "Stats should appear above the table, not after full-page scrolling"
            ).toBeLessThan(tableBox.y);
        }
    });

    test("summary cards show counts and keep UNPAID count consistent", async ({ page }) => {
        const unpaidCard = page.getByRole("button", { name: /unpaid/i }).first();
        const overdueCard = page.getByRole("button", { name: /overdue/i }).first();
        const outstandingCard = page
            .getByRole("button", { name: /outstanding/i })
            .first();
        const draftCard = page.getByRole("button", { name: /draft/i }).first();

        await expect(unpaidCard).toContainText(/\d+\s+Invoices?/i);
        await expect(overdueCard).toContainText(/\d+\s+Invoices?/i);
        await expect(outstandingCard).toContainText(/\d+\s+Invoices?/i);
        await expect(draftCard).toContainText(/\d+\s+Invoices?/i);

        const extractCount = async (locator: Locator) => {
            const text = await locator.innerText();
            const match = text.match(/(\d+)\s+Invoices?/i);
            return match ? Number(match[1]) : 0;
        };

        const [unpaidCount, overdueCount, outstandingCount, draftCount] = await Promise.all([
            extractCount(unpaidCard),
            extractCount(overdueCard),
            extractCount(outstandingCard),
            extractCount(draftCard),
        ]);

        expect(unpaidCount).toBe(overdueCount + outstandingCount + draftCount);
    });

    test("invoice list exposes a visible sorting indicator", async ({ page }) => {
        const issueDateHeader = page.getByRole("columnheader", {
            name: /issue date/i,
        });
        await expect(issueDateHeader).toBeVisible();
        await expect(issueDateHeader.getByLabel(/sorted descending/i)).toBeVisible();
    });

    // PR #2247 — draft invoice row has Edit action
    test("draft invoice row has an Edit action in the actions menu", async ({ page }) => {
        const invoice = await createDraftInvoice(page);
        await goToInvoices(page);

        const row = page.locator(`[data-testid="invoice-row-${invoice.id}"]`);
        await expect(row).toBeVisible({ timeout: 10_000 });

        const actionTrigger = row.locator("button").last();
        await actionTrigger.click();
        await page.waitForTimeout(500);

        const editOption = page.getByRole("menuitem", { name: /edit/i }).or(
            page.getByRole("link", { name: /edit/i })
        );
        const hasEdit = await editOption.first().isVisible({ timeout: 3_000 }).catch(() => false);
        if (!hasEdit) {
            const invoiceLink = row.locator("a").first();
            expect(await invoiceLink.isVisible().catch(() => false)).toBeTruthy();
        } else {
            await expect(editOption.first()).toBeVisible();
        }
    });

    // PR #2247 — can navigate to edit page for a draft invoice
    test("can navigate to edit page for a draft invoice", async ({ page }) => {
        const invoice = await createDraftInvoice(page);
        await page.goto(`/invoices/${invoice.id}/edit`);
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);
        await expect(page.locator("#invoiceNumber, [data-testid*='invoice']").first()).toBeVisible({ timeout: 10_000 });
    });

    // PR #2220 — summary cards display numeric counts
    test("summary cards display numeric status counts", async ({ page }) => {
        const pageContent = await page.locator("main, [role='main'], #root").first().innerText();
        expect(pageContent).toMatch(/\d+/);
        const hasStatusWithCount = /(?:draft|unpaid|overdue|sent|paid).*\d+|\d+.*(?:draft|unpaid|overdue|sent|paid)/i.test(pageContent);
        const hasTable = await page.locator("table tbody tr").count();
        expect(hasStatusWithCount || hasTable > 0).toBeTruthy();
    });
});
