import { expect, test } from "@playwright/test";

test.describe("Automation Settings — Page Load", () => {
    test("automation page loads with title", async ({ page }) => {
        await page.goto("/settings/automation");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText(/automation & cli|miru cli/i).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows the free-for-every-plan badge", async ({ page }) => {
        await page.goto("/settings/automation");
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText(/free for every plan/i),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows install command section", async ({ page }) => {
        await page.goto("/settings/automation");
        await page.waitForLoadState("networkidle");

        // The install command should be visible
        await expect(
            page.getByText(/curl.*install\.sh/i).or(
                page.locator("code").filter({ hasText: "curl" }).first()
            ),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows authenticate section with login command", async ({ page }) => {
        await page.goto("/settings/automation");
        await page.waitForLoadState("networkidle");

        await expect(
            page.locator("code").filter({ hasText: "miru login" }).first(),
        ).toBeVisible({ timeout: 15_000 });
    });

    test("shows daily commands section", async ({ page }) => {
        await page.goto("/settings/automation");
        await page.waitForLoadState("networkidle");

        await expect(
            page.locator("code").filter({ hasText: "miru whoami" }).first(),
        ).toBeVisible({ timeout: 15_000 });
        await expect(
            page.locator("code").filter({ hasText: "miru project list" }).first(),
        ).toBeVisible();
    });

    test("shows feature cards describing CLI capabilities", async ({ page }) => {
        await page.goto("/settings/automation");
        await page.waitForLoadState("networkidle");

        // Should show the three feature cards
        await expect(
            page.getByText(/same permissions/i),
        ).toBeVisible({ timeout: 15_000 });
        await expect(
            page.getByText(/humans and scripts/i),
        ).toBeVisible();
        await expect(
            page.getByText(/easy to install/i),
        ).toBeVisible();
    });
});
