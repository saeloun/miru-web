/**
 * Settings / Bank Info — Edit & Save.
 * Covers: updating bank and tax fields and verifying values persist after reload.
 */
import { test, expect } from "@playwright/test";
import { fetchCompanyDetails, goToBankInfo, updateCompany } from "./helpers";

test.describe("Settings / Bank Info — Edit & Save", () => {
  test("updates bank and tax values (including US tax fields) for company id 1 and restores original data", async ({ page }) => {
    const details = await fetchCompanyDetails(page);
    expect(
      Number(details.id),
      "This verification is intended for Company ID 1."
    ).toBe(1);
    const suffix = Date.now().toString().slice(-6);
    const originalFields = {
      bank_name: details.bank_name || "",
      bank_account_number: details.bank_account_number || "",
      bank_routing_number: details.bank_routing_number || "",
      bank_swift_code: details.bank_swift_code || "",
      tax_id: details.tax_id || "",
      vat_number: details.vat_number || "",
      gst_number: details.gst_number || "",
      ein: details.ein || "",
      us_taxpayer_id: details.us_taxpayer_id || "",
    };
    const updatedFields = {
      bank_name: `Codex Bank ${suffix}`,
      bank_account_number: `12345${suffix}`,
      bank_routing_number: `98765${suffix}`,
      bank_swift_code: `CODEIN${suffix.slice(-4)}`,
      tax_id: `TAX-${suffix}`,
      vat_number: `VAT-${suffix}`,
      gst_number: `GST-${suffix}`,
      ein: `EIN-${suffix}`,
      us_taxpayer_id: `USTAX-${suffix}`,
    };

    try {
      await goToBankInfo(page);

      await page.locator("input[aria-label='Bank Name']").fill(updatedFields.bank_name);
      await page.locator("input[aria-label='Account Number']").fill(updatedFields.bank_account_number);
      await page.locator("input[aria-label='Routing Number']").fill(updatedFields.bank_routing_number);
      await page.locator("input[aria-label='SWIFT Code']").fill(updatedFields.bank_swift_code);
      await page.locator("input[aria-label='Tax ID']").fill(updatedFields.tax_id);
      await page.locator("input[aria-label='VAT Number']").fill(updatedFields.vat_number);
      await page.locator("input[aria-label='GST Number']").fill(updatedFields.gst_number);
      await page.locator("input[aria-label='EIN']").fill(updatedFields.ein);
      await page.locator("input[aria-label='U.S. Taxpayer ID']").fill(updatedFields.us_taxpayer_id);

      const savePromise = page.waitForResponse(
        response =>
          response.url().includes(`/api/v1/companies/${details.id}`) &&
          response.request().method() === "PUT",
        { timeout: 15_000 }
      );

      await page.getByRole("button", { name: /save changes/i }).click();
      const response = await savePromise;
      expect(response.ok(), `Save failed: ${response.status()}`).toBeTruthy();
      const requestBody = response.request().postData() || "";
      expect(requestBody).toContain(`name="company[ein]"`);
      expect(requestBody).toContain(updatedFields.ein);
      expect(requestBody).toContain(`name="company[us_taxpayer_id]"`);
      expect(requestBody).toContain(updatedFields.us_taxpayer_id);

      const responseBody = await response.json();
      expect(responseBody.company?.ein || "").toBe(updatedFields.ein);
      expect(responseBody.company?.us_taxpayer_id || "").toBe(
        updatedFields.us_taxpayer_id
      );
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("input[aria-label='Bank Name']")).toHaveValue(updatedFields.bank_name);
      await expect(page.locator("input[aria-label='Account Number']")).toHaveValue(updatedFields.bank_account_number);
      await expect(page.locator("input[aria-label='Routing Number']")).toHaveValue(updatedFields.bank_routing_number);
      await expect(page.locator("input[aria-label='SWIFT Code']")).toHaveValue(updatedFields.bank_swift_code);
      await expect(page.locator("input[aria-label='Tax ID']")).toHaveValue(updatedFields.tax_id);
      await expect(page.locator("input[aria-label='VAT Number']")).toHaveValue(updatedFields.vat_number);
      await expect(page.locator("input[aria-label='GST Number']")).toHaveValue(updatedFields.gst_number);
      await expect.soft(page.locator("input[aria-label='EIN']")).toHaveValue(updatedFields.ein);
      await expect.soft(page.locator("input[aria-label='U.S. Taxpayer ID']")).toHaveValue(updatedFields.us_taxpayer_id);
    } finally {
      await updateCompany(page, details.id, originalFields);
    }
  });
});
