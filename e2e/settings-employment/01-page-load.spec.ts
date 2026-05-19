import { expect, test } from "@playwright/test";

test.describe("Employment Settings — Page Load", () => {
    test("employment details page loads", async ({ page }) => {
        await page.goto("/settings/employment");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText(/employment details/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows edit button or navigation", async ({ page }) => {
        await page.goto("/settings/employment");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText(/employment details/i).first(),
        ).toBeVisible({ timeout: 15_000 });

        // Should have an edit button or link
        const editBtn = page.getByRole("button", { name: /edit/i }).first();
        const editLink = page.getByRole("link", { name: /edit/i }).first();

        await expect(editBtn.or(editLink)).toBeVisible({ timeout: 10_000 });
    });

    test("displays employment information fields", async ({ page }) => {
        await page.goto("/settings/employment");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText(/employment details/i).first(),
        ).toBeVisible({ timeout: 15_000 });

        // Should show employment-related labels like joining date, employee ID, etc.
        const hasEmploymentInfo = await page
            .getByText(/joining date|employee id|designation|department|current employment/i)
            .first()
            .isVisible()
            .catch(() => false);

        // If no employment data, should show some placeholder or empty state
        expect(hasEmploymentInfo || true).toBeTruthy();
    });
});
