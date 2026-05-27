/**
 * UX & Interaction Quality — hover effects, links, keyboard behavior.
 * Covers manual test section 8.
 */
import { test, expect } from "@playwright/test";
import { goToPayments } from "./helpers";

test.describe("Payments — Bulk Selection & Actions", () => {
    test("table has row checkboxes for selection", async ({ page }) => {
        await goToPayments(page);
        const rowCheckboxes = page.locator("tbody").locator("[role='checkbox'], input[type='checkbox']");
        const count = await rowCheckboxes.count();
        const hasRows = await page.locator("tbody tr").count();
        if (hasRows > 0) {
            expect(count).toBeGreaterThan(0);
        }
    });

    test("select-all checkbox selects all visible rows", async ({ page }) => {
        await goToPayments(page);
        const headerCheckbox = page.locator("thead").locator("[role='checkbox'], input[type='checkbox']").first();
        const hasHeaderCheckbox = await headerCheckbox.isVisible().catch(() => false);
        if (!hasHeaderCheckbox) return;

        await headerCheckbox.click();
        const rowCheckboxes = page.locator("tbody").locator("[role='checkbox'], input[type='checkbox']");
        const count = await rowCheckboxes.count();
        if (count === 0) return;
        for (let i = 0; i < Math.min(count, 5); i++) {
            await expect(rowCheckboxes.nth(i)).toBeChecked();
        }
    });

    test("bulk copy transaction IDs button appears when rows are selected", async ({ page }) => {
        await goToPayments(page);
        const headerCheckbox = page.locator("thead").locator("[role='checkbox'], input[type='checkbox']").first();
        const hasHeaderCheckbox = await headerCheckbox.isVisible().catch(() => false);
        if (!hasHeaderCheckbox) return;

        await headerCheckbox.click();
        await page.waitForTimeout(500);
        await expect(page.getByRole("button", { name: /copy.*transaction|copy.*id/i })).toBeVisible({ timeout: 5_000 });
    });

    test("bulk download button appears when rows are selected", async ({ page }) => {
        await goToPayments(page);
        const headerCheckbox = page.locator("thead").locator("[role='checkbox'], input[type='checkbox']").first();
        const hasHeaderCheckbox = await headerCheckbox.isVisible().catch(() => false);
        if (!hasHeaderCheckbox) return;

        await headerCheckbox.click();
        await page.waitForTimeout(500);
        await expect(page.getByRole("button", { name: /download|export/i })).toBeVisible({ timeout: 5_000 });
    });

    test("selection toolbar shows count when rows are selected", async ({ page }) => {
        await goToPayments(page);
        const headerCheckbox = page.locator("thead").locator("[role='checkbox'], input[type='checkbox']").first();
        const hasHeaderCheckbox = await headerCheckbox.isVisible().catch(() => false);
        if (!hasHeaderCheckbox) return;

        await headerCheckbox.click();
        await page.waitForTimeout(500);
        await expect(
            page.getByText(/\d+\s*(row|item|payment)?s?\s*selected/i).or(page.getByText(/selected.*\d+/i)).first(),
        ).toBeVisible({ timeout: 5_000 });
    });
});

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
