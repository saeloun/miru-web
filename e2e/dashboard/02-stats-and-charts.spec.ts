import { expect, test } from "@playwright/test";
import {
    buildActivitiesResponse,
    buildDashboardResponse,
    goToDashboard,
    mockDashboardApis,
} from "./helpers";

test.describe("Dashboard — Stats And Charts", () => {
    test("renders financial summary cards and customer rankings from the dashboard API", async ({
        page,
    }) => {
        await mockDashboardApis(page, {
            dashboard: buildDashboardResponse({
                stats: {
                    total_revenue: 123_456.78,
                    revenue_trend: 12.5,
                    active_projects: 9,
                    projects_trend: -4.2,
                    team_size: 17,
                    billable_hours: 987.4,
                    hours_trend: 2.1,
                },
                revenue_chart: [
                    { month: "Jan", revenue: 20_000, monthly_revenue: 20_000, invoices: 2 },
                    { month: "Feb", revenue: 48_000, monthly_revenue: 28_000, invoices: 5 },
                    { month: "Mar", revenue: 78_000, monthly_revenue: 30_000, invoices: 7 },
                    { month: "Apr", revenue: 123_456.78, monthly_revenue: 45_456.78, invoices: 10 },
                ],
                revenue_by_customer: [
                    { id: 1, name: "Globex", revenue: 74_000, percentage: 60 },
                    { id: 2, name: "Initech", revenue: 32_000, percentage: 26 },
                    { id: 3, name: "Umbrella", revenue: 17_456.78, percentage: 14 },
                ],
            }),
            activitiesByOffset: {
                0: buildActivitiesResponse(),
            },
        });

        await goToDashboard(page);

        const revenueCard = page
            .getByRole("heading", { name: "Revenue", exact: true })
            .locator("..")
            .locator("..");
        await expect(revenueCard).toContainText("$123,456.78");
        await expect(revenueCard).toContainText("12.5%");
        await expect(revenueCard).toContainText("Current Financial Year");

        const activeProjectsCard = page
            .getByRole("heading", { name: "Active Projects", exact: true })
            .locator("..")
            .locator("..");
        await expect(activeProjectsCard).toContainText("9");
        await expect(activeProjectsCard).toContainText(/currently active/i);

        const teamSizeCard = page
            .getByRole("heading", { name: "Team Size", exact: true })
            .locator("..")
            .locator("..");
        await expect(teamSizeCard).toContainText("17");
        await expect(teamSizeCard).toContainText(/teammates/i);

        const hoursTrackedCard = page
            .getByRole("heading", { name: "Hours Tracked", exact: true })
            .locator("..")
            .locator("..");
        await expect(hoursTrackedCard).toContainText("987");
        await expect(hoursTrackedCard).toContainText("2.1%");

        await expect(
            page.getByRole("heading", { name: /revenue momentum/i }),
        ).toBeVisible();
        await expect(
            page.getByText(/monthly revenue trend for the current financial year/i),
        ).toBeVisible();
        await expect(page.locator("[data-chart]").first()).toBeVisible();

        await expect(page.getByText("Globex", { exact: true })).toBeVisible();
        await expect(page.getByText("Initech", { exact: true })).toBeVisible();
        await expect(page.getByText(/60 of total/i)).toBeVisible();
    });

    test("shows the customer empty state when no revenue leaders are returned", async ({
        page,
    }) => {
        await mockDashboardApis(page, {
            dashboard: buildDashboardResponse({
                revenue_by_customer: [],
            }),
            activitiesByOffset: {
                0: buildActivitiesResponse(),
            },
        });

        await goToDashboard(page);

        await expect(
            page.getByRole("heading", { name: /revenue leaders/i }),
        ).toBeVisible();
        await expect(page.getByText(/no revenue data available/i)).toBeVisible();
    });
});
