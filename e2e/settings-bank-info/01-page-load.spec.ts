/**
 * Settings / Bank Info — Page Load & Redirect.
 * Covers: redirect from /settings/bank-info and visibility of bank/tax fields.
 */
import { test, expect } from "@playwright/test";
import { goToBankInfo } from "./helpers";

test.describe("Settings / Bank Info — Page Load & Redirect", () => {
  test("redirects to organization edit bank-info anchor", async ({ page }) => {
    await page.goto("/settings/bank-info");
    await expect(page).toHaveURL(/\/settings\/organization\/edit#bank-info$/);
  });

  test("shows the bank and tax information inputs", async ({ page }) => {
    await goToBankInfo(page);

    await expect(page.locator("input[aria-label='Bank Name']")).toBeVisible();
    await expect(page.locator("input[aria-label='Account Number']")).toBeVisible();
    await expect(page.locator("input[aria-label='Routing Number']")).toBeVisible();
    await expect(page.locator("input[aria-label='SWIFT Code']")).toBeVisible();
    await expect(page.locator("input[aria-label='Tax ID']")).toBeVisible();
    await expect(page.locator("input[aria-label='VAT Number']")).toBeVisible();
    await expect(page.locator("input[aria-label='GST Number']")).toBeVisible();
    await expect(page.locator("input[aria-label='EIN']")).toBeVisible();
    await expect(
      page.locator("input[aria-label='U.S. Taxpayer ID']")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible();
  });
});
