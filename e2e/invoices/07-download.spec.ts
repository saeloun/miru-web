/**
 * TC-INV-015: Download invoice as PDF.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices } from "../helpers";

test.describe("Download Invoice PDF", () => {
    test("downloads a PDF from the actions menu", async ({ page }) => {
        await goToInvoices(page);

        // Use any invoice row
        const row = page.locator("tr[data-testid^='invoice-row-']").first();
        if ((await row.count()) === 0) {
            test.skip(true, "No invoices available");
            return;
        }

        // Open actions
        const trigger = row.locator('[data-testid^="invoice-actions-trigger-"]');
        await trigger.click();

        // Set up download listener before clicking
        const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });

        const downloadItem = page.locator(
            '[data-testid^="invoice-action-download-"]'
        );
        await downloadItem.click();

        const download = await downloadPromise;

        // Verify filename ends with .pdf
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

        // Verify the file is a real PDF (starts with %PDF)
        const path = await download.path();
        if (path) {
            const fs = await import("fs");
            const header = fs.readFileSync(path, { encoding: "utf-8" }).slice(0, 5);
            expect(header).toBe("%PDF-");
        }
    });
});
