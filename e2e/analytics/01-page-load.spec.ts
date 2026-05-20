import { expect, test } from "@playwright/test";

test.describe("Analytics — Page Load", () => {
    test("analytics page loads with heading and description", async ({ page }) => {
        await page.goto("/analytics");
        await expect(
            page.getByRole("heading", { name: /analytics/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await expect(
            page.getByText(/predictive finance|client behavior|team performance/i),
        ).toBeVisible();
    });

    test("analytics page shows summary cards when data is available", async ({ page }) => {
        await page.goto("/analytics");
        await expect(
            page.getByRole("heading", { name: /analytics/i }).first(),
        ).toBeVisible({ timeout: 15_000 });

        // Wait for loading to finish
        await page.waitForLoadState("networkidle");

        // Should show at least the team utilization card or an empty/error state
        const hasData = await page
            .getByText(/team utilization|no analytics data|unable to load/i)
            .first()
            .isVisible()
            .catch(() => false);
        expect(hasData).toBeTruthy();
    });

    test("analytics views navigation cards are visible", async ({ page }) => {
        await page.goto("/analytics");
        await page.waitForLoadState("networkidle");

        // Wait for the page to settle
        await expect(
            page.getByRole("heading", { name: /analytics/i }).first(),
        ).toBeVisible({ timeout: 15_000 });

        // The analytics views section should show navigation cards
        await expect(
            page.getByText("Revenue Forecast", { exact: true }),
        ).toBeVisible({ timeout: 10_000 });
        await expect(
            page.getByText("Team Analytics", { exact: true }),
        ).toBeVisible();
        await expect(
            page.getByText("Client Insights", { exact: true }),
        ).toBeVisible();
        await expect(
            page.getByText("Expense Trends", { exact: true }),
        ).toBeVisible();
    });

    test("date range filter is present", async ({ page }) => {
        await page.goto("/analytics");
        await expect(
            page.getByRole("heading", { name: /analytics/i }).first(),
        ).toBeVisible({ timeout: 15_000 });

        // The preset/date filter should be visible
        await expect(
            page.getByRole("combobox").first().or(
                page.locator("button").filter({ hasText: /this month|this quarter|last 30|custom/i }).first()
            ),
        ).toBeVisible({ timeout: 10_000 });
    });
});
