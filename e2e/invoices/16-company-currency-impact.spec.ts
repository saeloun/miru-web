/**
 * Invoice Currency Impact.
 * Covers: changing the company base currency and verifying invoice creation uses it
 * when the selected client does not define its own currency.
 */
import { test, expect, type Page } from "@playwright/test";
import { goToInvoices } from "../helpers";
import { fetchCompanyDetails, updateCompany } from "../settings-organization/helpers";

async function createBlankCurrencyClient(page: Page) {
    const suffix = Date.now().toString().slice(-6);
    const clientName = `E2E Currency Client ${suffix}`;

    const res = await page.request.post("/api/v1/clients", {
        data: {
            client: {
                name: clientName,
                email: "",
                phone: "",
                currency: "",
                addresses_attributes: [
                    {
                        address_line_1: "100 Test Street",
                        address_line_2: "Suite 200",
                        city: "Brooklyn",
                        state: "NY",
                        country: "US",
                        pin: "11201",
                    },
                ],
            },
        },
    });

    expect(res.ok(), `Failed to create client: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.client || body;
}

test.describe("Invoice Currency Impact", () => {
    test("changing the company currency updates the invoice currency fallback", async ({ page }) => {
        const details = await fetchCompanyDetails(page);
        const originalCurrency = details.base_currency || details.baseCurrency || "USD";
        const targetCurrency = originalCurrency === "EUR" ? "GBP" : "EUR";
        const currencyPattern = targetCurrency === "EUR" ? /€|EUR/ : /£|GBP/;

        const client = await createBlankCurrencyClient(page);

        try {
            await updateCompany(page, details.id, { base_currency: targetCurrency });

            await goToInvoices(page);
            await page.getByRole("button", { name: /create.*invoice/i }).click();
            await expect(page.getByText(/new invoice|edit invoice/i).first()).toBeVisible();

            await page.locator('[data-testid="invoice-client-select"]').click();
            const clientOption = page.getByRole("option").filter({ hasText: client.name }).first();
            await expect(clientOption).toBeVisible({ timeout: 10_000 });
            await clientOption.click();

            await page.getByRole("button", { name: /^\+\s*LINE ITEMS$/i }).click();

            const nameInput = page.locator('[data-testid="invoice-manual-entry-name"]');
            await nameInput.fill("Currency Impact Service");

            const qtyInput = page.locator('[data-testid="invoice-manual-entry-quantity"]');
            await qtyInput.fill("1");

            const rateInput = page.locator('[data-testid="invoice-manual-entry-rate"]');
            await rateInput.fill("100");

            await expect(page.getByText(/Hourly rate:/i).first()).toContainText(
                currencyPattern,
                { timeout: 10_000 },
            );
        } finally {
            await updateCompany(page, details.id, { base_currency: originalCurrency });
            await page.request.delete(`/api/v1/clients/${client.id}`);
        }
    });
});
