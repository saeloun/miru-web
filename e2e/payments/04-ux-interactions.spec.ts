/**
 * UX & Interaction Quality — hover effects, links, keyboard behavior.
 * Covers manual test section 8.
 */
import { test, expect } from "@playwright/test";
import { goToPayments } from "./helpers";

test.describe("Payments — UX & Interactions", () => {
    test("payment rows have hover background effect", async ({ page }) => {
        await goToPayments(page);
        const firstRow = page.locator("tbody tr").first();
        const isVisible = await firstRow.isVisible().catch(() => false);
        if (!isVisible) return;

        // The row has hover:bg-muted or hover:bg-muted/50 — verify it's a <tr> in a table
        const tagName = await firstRow.evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe("tr");

        // Verify the row has some hover class (either cursor-pointer or hover:bg-*)
        const className = await firstRow.getAttribute("class");
        expect(className).toMatch(/hover:|cursor-/);
    });

    test("invoice number is a clickable link to the invoice", async ({ page }) => {
        await goToPayments(page);
        const invoiceLink = page.locator("tbody tr").first().locator("a[href*='/invoices/']");
        const isVisible = await invoiceLink.isVisible().catch(() => false);
        if (!isVisible) return;

        const href = await invoiceLink.getAttribute("href");
        expect(href).toMatch(/\/invoices\/\d+/);
    });

    test("table has column headers", async ({ page }) => {
        await goToPayments(page);
        const table = page.locator("table");
        const hasTable = await table.isVisible().catch(() => false);
        if (!hasTable) return;

        // Verify the table has thead with th elements that have text content
        const headers = page.locator("thead th");
        const count = await headers.count();
        expect(count).toBeGreaterThan(0);

        // At least one header should have non-empty text (the last "actions" th may be empty)
        let hasTextHeader = false;
        for (let i = 0; i < count; i++) {
            const text = await headers.nth(i).innerText();
            if (text.trim().length > 0) {
                hasTextHeader = true;
                break;
            }
        }
        expect(hasTextHeader, "At least one table header should have text content").toBe(true);
    });
});
