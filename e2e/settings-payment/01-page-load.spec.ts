import { expect, test } from "@playwright/test";

test.describe("Payment Settings — Page Load", () => {
    test("payment settings page loads with title", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByRole("heading", { name: /payment settings/i, level: 1 }),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("Stripe provider section is visible", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText("Stripe", { exact: true }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("UPI provider section is visible", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText(/UPI/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("Razorpay provider section is visible", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText("Razorpay", { exact: true }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("Stripe shows connect or connected state", async ({ page }) => {
        await page.goto("/settings/payment");
        await page.waitForLoadState("networkidle");

        // Should show either "Connect Stripe" button or "Connected" badge
        const connectBtn = page.getByRole("button", { name: /connect stripe/i });
        const connectedBadge = page.getByText(/connected/i).first();

        await expect(connectBtn.or(connectedBadge)).toBeVisible({ timeout: 15_000 });
    });
});
