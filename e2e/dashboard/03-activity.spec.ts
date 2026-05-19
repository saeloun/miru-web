import { expect, test } from "@playwright/test";
import {
    buildActivitiesResponse,
    buildDashboardResponse,
    createSentDashboardInvoice,
    deleteDashboardInvoice,
    goToDashboard,
    mockDashboardApis,
} from "./helpers";

const invoiceActivity = (
    id: number,
    invoiceNumber: string,
    clientName: string,
): {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    time_ago: string;
    icon: string;
    metadata: { amount: number; currency: string; status: string };
} => ({
    id: `invoice_${id}`,
    type: "invoice",
    message: `Invoice #${invoiceNumber} sent to ${clientName}`,
    timestamp: "2026-04-23T06:00:00.000Z",
    time_ago: `${id} minute${id === 1 ? "" : "s"} ago`,
    icon: "FileText",
    metadata: {
        amount: 1250,
        currency: "USD",
        status: "sent",
    },
});

test.describe("Dashboard — Workspace Activity", () => {
    test("appends another page of activity when Load more is clicked", async ({
        page,
    }) => {
        const firstPage = buildActivitiesResponse({
            activities: Array.from({ length: 10 }, (_, index) =>
                invoiceActivity(index + 1, `MOCK-${index + 1}`, "Acme Labs"),
            ),
            has_more: true,
            total_count: 12,
        });
        const secondPage = buildActivitiesResponse({
            activities: [
                invoiceActivity(11, "MOCK-11", "Acme Labs"),
                invoiceActivity(12, "MOCK-12", "Northwind Studio"),
            ],
            has_more: false,
            total_count: 12,
        });

        await mockDashboardApis(page, {
            dashboard: buildDashboardResponse(),
            activitiesByOffset: {
                0: firstPage,
                10: secondPage,
            },
        });

        await goToDashboard(page);

        await expect(
            page.getByText(/invoice #MOCK-1 sent to Acme Labs/i),
        ).toBeVisible();

        const loadMore = page.getByRole("button", { name: /load more/i });
        await expect(loadMore).toBeVisible();
        await loadMore.click({ force: true });

        await expect(
            page.getByText(/invoice #MOCK-12 sent to Northwind Studio/i),
        ).toBeVisible();
        await expect(page.getByText(/all caught up/i)).toBeVisible();
    });

    test("renders payment metadata amounts and status badges", async ({
        page,
    }) => {
        await mockDashboardApis(page, {
            dashboard: buildDashboardResponse(),
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
                    total_count: 1,
                }),
            },
        });

        await goToDashboard(page);

        await expect(
            page.getByText(/payment of 2500 received from Acme Labs/i),
        ).toBeVisible();
        await expect(page.getByText("$2,500.00")).toBeVisible();
        await expect(page.getByText("completed")).toBeVisible();
        await expect(page.getByText("1 minute ago")).toBeVisible();
    });

    test("shows an empty state when no recent activity is available", async ({
        page,
    }) => {
        await mockDashboardApis(page, {
            dashboard: buildDashboardResponse(),
            activitiesByOffset: {
                0: buildActivitiesResponse(),
            },
        });

        await goToDashboard(page);

        await expect(page.getByText(/no recent activity yet/i)).toBeVisible();
        await expect(
            page.getByRole("button", { name: /load more/i }),
        ).toHaveCount(0);
    });

    test("shows a newly sent invoice after the dashboard is refreshed", async ({
        page,
    }) => {
        await goToDashboard(page);

        const invoice = await createSentDashboardInvoice(page);

        try {
            await page.reload();
            await expect(
                page.getByText(
                    new RegExp(
                        `Invoice #${invoice.invoiceNumber} sent to ${invoice.clientName}`,
                        "i",
                    ),
                ),
            ).toBeVisible({ timeout: 15_000 });
        } finally {
            await deleteDashboardInvoice(page, invoice.id);
        }
    });
});
