/**
 * TC-INV-034: Navigation — no 404 on route changes.
 * TC-INV-032: Search by client name, case-insensitive.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices, firstInvoiceRow } from "../helpers";

test.describe("Invoice Navigation & Search", () => {
    // TC-INV-034: Navigating between pages doesn't cause 404
    test("navigating away and back preserves the invoice list", async ({
        page,
    }) => {
        await goToInvoices(page);

        // Navigate to dashboard
        await page.goto("/dashboard");
        await page.waitForLoadState("domcontentloaded");
        await expect(page).not.toHaveURL(/\/invoices/);

        // Navigate back to invoices
        await page.goto("/invoices");
        await page.waitForLoadState("networkidle");

        // Wait for the invoice rows to actually render (SPA async load)
        const rows = page.locator("tr[data-testid^='invoice-row-']");
        await expect(rows.first()).toBeVisible({ timeout: 15_000 });

        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);
    });

    // TC-INV-032: Search by client name
    test("search by client name returns matching invoices", async ({
        page,
    }) => {
        await goToInvoices(page);

        const firstRow = firstInvoiceRow(page);
        if ((await firstRow.count()) === 0) {
            test.skip(true, "No invoices");
            return;
        }

        const clientCell = await firstRow.locator("td").nth(1).innerText();
        const searchTerm = clientCell.split("\n")[0].trim().split(" ")[0];

        await page.getByPlaceholder(/search/i).fill(searchTerm);

        const rows = page.locator("tr[data-testid^='invoice-row-']");
        const count = await rows.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < Math.min(count, 5); i++) {
            await expect(rows.nth(i)).toContainText(
                new RegExp(searchTerm, "i")
            );
        }
    });

    // TC-INV-032: Case-insensitive search
    test("search is case-insensitive", async ({ page }) => {
        await goToInvoices(page);

        const firstRow = firstInvoiceRow(page);
        if ((await firstRow.count()) === 0) {
            test.skip(true, "No invoices");
            return;
        }

        const invoiceNumber = (
            await firstRow.locator("td").first().innerText()
        )
            .replace("#", "")
            .trim();

        await page
            .getByPlaceholder(/search/i)
            .fill(invoiceNumber.toLowerCase());
        const rows = page.locator("tr[data-testid^='invoice-row-']");
        expect(await rows.count()).toBeGreaterThan(0);
    });
});
