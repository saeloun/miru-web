import { expect, test } from "@playwright/test";

test.describe("Analytics — Sub Pages", () => {
    test("revenue forecast page loads", async ({ page }) => {
        await page.goto("/analytics/revenue-forecast");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByRole("heading", { name: /revenue forecast/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("team analytics page loads", async ({ page }) => {
        await page.goto("/analytics/team");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByRole("heading", { name: /team/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("client insights page loads", async ({ page }) => {
        await page.goto("/analytics/clients");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByRole("heading", { name: /client/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("expense trends page loads", async ({ page }) => {
        await page.goto("/analytics/expenses");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByRole("heading", { name: /expense/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("navigating from analytics home to revenue forecast works", async ({ page }) => {
        await page.goto("/analytics");
        await expect(
            page.getByRole("heading", { name: /analytics/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await page.waitForLoadState("networkidle");

        // Click the Revenue Forecast "Open" link
        const revenueCard = page.locator("a[href*='revenue-forecast']").first();
        await expect(revenueCard).toBeVisible({ timeout: 10_000 });
        await revenueCard.click();

        await expect(page).toHaveURL(/\/analytics\/revenue-forecast/);
        await expect(
            page.getByRole("heading", { name: /revenue forecast/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("navigating from analytics home to team analytics works", async ({ page }) => {
        await page.goto("/analytics");
        await expect(
            page.getByRole("heading", { name: /analytics/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await page.waitForLoadState("networkidle");

        const teamLink = page.locator("a[href*='analytics/team']").first();
        await expect(teamLink).toBeVisible({ timeout: 10_000 });
        await teamLink.click();

        await expect(page).toHaveURL(/\/analytics\/team/);
        await expect(
            page.getByRole("heading", { name: /team/i }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });
});
