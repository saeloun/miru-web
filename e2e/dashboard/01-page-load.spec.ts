import { expect, test } from "@playwright/test";
import {
    buildActivitiesResponse,
    buildDashboardResponse,
    goToDashboard,
    mockDashboardApis,
} from "./helpers";

test.describe("Dashboard — Page Load", () => {
    test("loads the live dashboard without runtime errors", async ({ page }) => {
        const pageErrors: string[] = [];
        page.on("pageerror", error => pageErrors.push(error.message));

        await goToDashboard(page);

        await expect(page).toHaveURL(/\/dashboard$/);
        await expect(
            page.getByRole("heading", { name: "Dashboard", exact: true }).first(),
        ).toBeVisible();
        await expect(
            page.getByRole("heading", { name: /welcome back/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("heading", { name: /workspace activity/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: /logout/i }),
        ).toBeVisible();

        expect(pageErrors).toEqual([]);
    });

    test("falls back to empty dashboard content when the stats request fails", async ({
        page,
    }) => {
        await mockDashboardApis(page, {
            dashboardStatus: 500,
            activitiesByOffset: {
                0: buildActivitiesResponse(),
            },
        });

        await goToDashboard(page);

        await expect(
            page.getByRole("heading", { name: /revenue momentum/i }),
        ).toBeVisible();
        await expect(page.getByText(/no revenue data available/i)).toBeVisible();
        await expect(page.getByText(/no recent activity yet/i)).toBeVisible();
    });

    test("shows chart loading spinners while dashboard data is in flight", async ({
        page,
    }) => {
        await mockDashboardApis(page, {
            dashboard: buildDashboardResponse(),
            delayedDashboardMs: 1200,
            activitiesByOffset: {
                0: buildActivitiesResponse(),
            },
        });

        await page.goto("/dashboard");
        await expect(
            page.getByRole("heading", { name: /welcome back/i }),
        ).toBeVisible({ timeout: 15_000 });

        const spinner = page.locator(".animate-spin").first();
        await expect(spinner).toBeVisible();
        await expect(spinner).toBeHidden({ timeout: 5_000 });
        await expect(
            page.getByRole("heading", { name: /revenue momentum/i }),
        ).toBeVisible();
    });
});
