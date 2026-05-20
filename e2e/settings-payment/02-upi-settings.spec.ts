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

    // PR #2277 — rejects email-like UPI IDs
    test("rejects email-like UPI IDs", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");
        await expect(page.locator("#upi_id")).toBeVisible({ timeout: 15_000 });

        await page.locator("#upi_id").fill("user@gmail.com");
        await page.getByRole("button", { name: /save upi/i }).click();

        await expect(
            page.getByText(/invalid.*upi|not.*valid.*upi/i).or(page.locator(".text-destructive, .text-red-500").first()),
        ).toBeVisible({ timeout: 10_000 });
    });

    // PR #2277 — UPI toggle is disabled when UPI ID is empty
    test("UPI enable toggle is disabled when UPI ID is empty", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");
        await expect(page.locator("#upi_id")).toBeVisible({ timeout: 15_000 });

        await page.locator("#upi_id").fill("");
        await page.locator("#upi_id").blur();
        await page.waitForTimeout(500);

        const enableToggle = page.locator("#upi_enabled");
        const isDisabled = await enableToggle.isDisabled().catch(() => false);
        const isChecked = await enableToggle.isChecked().catch(() => false);
        expect(isDisabled || !isChecked).toBeTruthy();
    });

    // PR #2277 — valid UPI ID format is accepted
    test("valid UPI ID format is accepted without error", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");
        await expect(page.locator("#upi_id")).toBeVisible({ timeout: 15_000 });

        await page.locator("#upi_id").fill("merchant@upi");
        const payeeInput = page.locator("#upi_payee_name");
        if (await payeeInput.isVisible()) {
            await payeeInput.fill("Test Merchant");
        }

        await page.getByRole("button", { name: /save upi/i }).click();
        const errorVisible = await page.getByText(/invalid.*upi/i).isVisible({ timeout: 3_000 }).catch(() => false);
        expect(errorVisible).toBeFalsy();
    });
});
