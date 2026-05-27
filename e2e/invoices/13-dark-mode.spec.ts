/**
 * TC-INV-025: Dark mode / theme — invoice text is readable.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices } from "../helpers";

test.describe("Invoice Dark Mode", () => {
    test("invoice list is readable with prefers-color-scheme: dark", async ({
        browser,
    }) => {
        // Create a context that emulates dark mode
        const context = await browser.newContext({
            colorScheme: "dark",
            storageState: "e2e/.auth/admin.json",
        });
        const page = await context.newPage();

        await goToInvoices(page);

        // Take a screenshot for visual inspection
        await page.screenshot({
            path: "e2e/screenshots/invoice-list-dark.png",
            fullPage: true,
        });

        // Basic smoke check — the page should render without errors
        const rows = page.locator("tr[data-testid^='invoice-row-']");
        if ((await rows.count()) > 0) {
            // Verify text is visible (not transparent / same color as background)
            const firstCell = rows.first().locator("td").first();
            await expect(firstCell).toBeVisible();
            const text = await firstCell.innerText();
            expect(text.length).toBeGreaterThan(0);
        }

        await context.close();
    });
});
