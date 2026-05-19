import { expect, test } from "@playwright/test";

test.describe("Payment Settings — UPI Configuration", () => {
    test("UPI ID input field is present", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");

        await expect(page.locator("#upi_id")).toBeVisible({ timeout: 15_000 });
    });

    test("UPI payee name input field is present", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");

        await expect(page.locator("#upi_payee_name")).toBeVisible({ timeout: 15_000 });
    });

    test("UPI enable toggle is present", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");

        await expect(page.locator("#upi_enabled")).toBeVisible({ timeout: 15_000 });
    });

    test("UPI save button is present", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByRole("button", { name: /save upi/i }),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("show on invoices toggle is present", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");

        await expect(page.locator("#upi_on_invoices")).toBeVisible({ timeout: 15_000 });
    });
});
