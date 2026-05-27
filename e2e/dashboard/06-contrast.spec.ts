import { expect, Locator, test } from "@playwright/test";
import {
    buildActivitiesResponse,
    buildDashboardResponse,
    contrastRatio,
    getElementContrast,
    goToDashboard,
    mockDashboardApis,
    WCAG_AA_LARGE,
    WCAG_AA_NORMAL,
} from "./helpers";

async function expectContrast(locator: Locator, label: string, threshold?: number) {
    const { fg, bg, isLargeText } = await getElementContrast(locator.page(), locator);
    const ratio = contrastRatio(fg, bg);
    const minimum = threshold ?? (isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL);

    expect(
        ratio,
        `${label} contrast ${ratio.toFixed(2)} is below ${minimum} (fg=${fg}, bg=${bg})`,
    ).toBeGreaterThanOrEqual(minimum);
}

async function prepareDashboard(page) {
    await mockDashboardApis(page, {
        dashboard: buildDashboardResponse({
            stats: {
                total_revenue: 123_456.78,
                revenue_trend: 12.5,
                active_projects: 9,
                projects_trend: 4.2,
                team_size: 17,
                billable_hours: 987.4,
                hours_trend: 2.1,
            },
            revenue_by_customer: [
                { id: 1, name: "Globex", revenue: 74_000, percentage: 60 },
                { id: 2, name: "Initech", revenue: 32_000, percentage: 26 },
            ],
        }),
        activitiesByOffset: {
            0: buildActivitiesResponse({
                activities: [
                    {
                        id: "payment_1",
                        type: "payment",
                        message: "Payment of 2500 received from Acme Labs",
                        timestamp: "2026-04-23T06:05:00.000Z",
                        time_ago: "1 minute ago",
                        icon: "CurrencyDollar",
                        metadata: {
                            amount: 2500,
                            currency: "USD",
                            status: "completed",
                        },
                    },
                ],
                has_more: true,
                total_count: 2,
            }),
            10: buildActivitiesResponse({
                activities: [
                    {
                        id: "invoice_2",
                        type: "invoice",
                        message: "Invoice #LOAD-2 sent to Northwind Studio",
                        timestamp: "2026-04-23T06:02:00.000Z",
                        time_ago: "moments ago",
                        icon: "FileText",
                        metadata: {
                            amount: 2250,
                            currency: "USD",
                            status: "paid",
                        },
                    },
                ],
                total_count: 2,
            }),
        },
    });

    await goToDashboard(page);
}

test.describe("Dashboard — Contrast", () => {
    test("hero eyebrow and welcome heading meet WCAG AA contrast", async ({
        page,
    }) => {
        await prepareDashboard(page);

        await expectContrast(page.getByText("COMPANY PULSE"), "Company pulse eyebrow");
        await expectContrast(
            page.getByRole("heading", { name: /welcome back/i }),
            "Welcome heading",
            WCAG_AA_LARGE,
        );
    });

    test("summary card labels and values meet WCAG AA contrast", async ({
        page,
    }) => {
        await prepareDashboard(page);

        await expectContrast(
            page.getByRole("heading", { name: "Revenue", exact: true }),
            "Revenue card label",
        );
        await expectContrast(
            page.getByText("$123,456.78", { exact: true }),
            "Revenue card value",
            WCAG_AA_LARGE,
        );
        await expectContrast(
            page.getByRole("heading", { name: "Hours Tracked", exact: true }),
            "Hours tracked label",
        );
    });

    test("selected and unselected sidebar links meet WCAG AA contrast", async ({
        page,
    }) => {
        await prepareDashboard(page);

        await expectContrast(
            page.getByRole("link", { name: "Dashboard", exact: true }).first(),
            "Selected dashboard nav link",
        );
        await expectContrast(
            page.getByRole("link", { name: "Time Tracking", exact: true }),
            "Unselected time tracking nav link",
        );
    });

    test("chart headings and customer labels meet WCAG AA contrast", async ({
        page,
    }) => {
        await prepareDashboard(page);

        await expectContrast(
            page.getByRole("heading", { name: /revenue momentum/i }),
            "Revenue momentum heading",
        );
        await expectContrast(
            page.getByText(/monthly revenue trend for the current financial year/i),
            "Revenue momentum description",
        );
        await expectContrast(
            page.getByText("Globex", { exact: true }),
            "Top customer label",
        );
        await expectContrast(
            page.getByText(/60 of total/i),
            "Top customer percentage",
        );
    });

    test("workspace activity text and hovered Load more button meet WCAG AA contrast", async ({
        page,
    }) => {
        await prepareDashboard(page);

        await expectContrast(
            page.getByRole("heading", { name: /workspace activity/i }),
            "Workspace activity heading",
        );
        await expectContrast(
            page.getByText(/payment of 2500 received from Acme Labs/i),
            "Workspace activity message",
        );

        const loadMore = page.getByRole("button", { name: /load more/i });
        await expect(loadMore).toBeVisible();
        await loadMore.hover();
        await expectContrast(loadMore, "Load more button");
    });
});
