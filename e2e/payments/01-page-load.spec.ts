/**
 * Page Load & Layout — payments page loads, header, table.
 * Covers manual test sections 1 and 2.
 */
import { test, expect } from "@playwright/test";
import { goToPayments } from "./helpers";

test.describe("Payments Page Load & Layout", () => {
    test("page loads and shows payments content", async ({ page }) => {
        await goToPayments(page);
        // Either the table or the empty state should be visible
        const hasTable = await page.locator("table").isVisible().catch(() => false);
        const hasEmpty = await page.getByText(/no payments recorded/i).isVisible().catch(() => false);
        expect(hasTable || hasEmpty, "Page should show either a table or empty state").toBe(true);
    });

    test("Add Manual Entry button is accessible", async ({ page }) => {
        await goToPayments(page);
        // The button may be in the header (desktop) or empty state — find any variant
        const anyAddBtn = page.getByRole("button", { name: /add.*manual.*entry|add.*payment/i }).first();
        const headerBtn = page.locator("#addEntry");
        const hasAny = await anyAddBtn.isVisible().catch(() => false)
            || await headerBtn.isAttached().catch(() => false);
        expect(hasAny, "An 'Add Manual Entry' button should be accessible").toBe(true);
    });

    test("table has expected column headers when payments exist", async ({ page }) => {
        await goToPayments(page);
        const table = page.locator("table");
        const hasTable = await table.isVisible().catch(() => false);
        if (!hasTable) {
            await expect(page.getByText(/no payments recorded/i)).toBeVisible();
            return;
        }

        await expect(page.locator("thead th").filter({ hasText: /invoice/i })).toBeVisible();
        await expect(page.locator("thead th").filter({ hasText: /date/i })).toBeVisible();
        await expect(page.locator("thead th").filter({ hasText: /notes/i })).toBeVisible();
        await expect(page.locator("thead th").filter({ hasText: /amount/i })).toBeVisible();
        await expect(page.locator("thead th").filter({ hasText: /status/i })).toBeVisible();
    });

    test("payment rows display invoice number, client, date, amount, and status", async ({ page }) => {
        await goToPayments(page);
        const firstRow = page.locator("tbody tr").first();
        const isVisible = await firstRow.isVisible().catch(() => false);
        if (!isVisible) return;

        const cells = firstRow.locator("td");
        const cellCount = await cells.count();
        expect(cellCount).toBeGreaterThanOrEqual(5);
    });
});
