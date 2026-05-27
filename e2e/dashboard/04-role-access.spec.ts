import { expect, test } from "@playwright/test";
import { signInAsSeedUser } from "../navigation/helpers";

test.describe("Dashboard — Role Access", () => {
    test.use({ storageState: undefined });

    test("book keepers can access the dashboard and see finance-focused navigation", async ({
        page,
    }) => {
        await signInAsSeedUser(page, "book_keeper");
        await page.goto("/dashboard");

        await expect(page).toHaveURL(/\/dashboard$/);
        await expect(
            page.getByRole("heading", { name: /welcome back/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("heading", { name: "Revenue", exact: true }),
        ).toBeVisible();
        await expect(
            page.getByRole("link", { name: "Clients", exact: true }),
        ).toHaveCount(0);
        await expect(
            page.getByRole("link", { name: "Time Tracking", exact: true }),
        ).toHaveCount(0);
    });

    test("employees are redirected from /dashboard to /time-tracking", async ({
        page,
    }) => {
        await signInAsSeedUser(page, "employee");
        await page.goto("/dashboard");

        await page.waitForURL(/\/time-tracking$/, { timeout: 15_000 });
        await expect(page).toHaveURL(/\/time-tracking$/);
    });

    test("clients are redirected from /dashboard to /invoices", async ({
        page,
    }) => {
        await signInAsSeedUser(page, "client");
        await page.goto("/dashboard");

        await page.waitForURL(/\/invoices/, { timeout: 15_000 });
        await expect(page).toHaveURL(/\/invoices/);
    });
});
