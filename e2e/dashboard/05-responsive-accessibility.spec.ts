import { expect, test } from "@playwright/test";
import {
    buildActivitiesResponse,
    buildDashboardResponse,
    goToDashboard,
    mockDashboardApis,
} from "./helpers";

const firstPage = buildActivitiesResponse({
    activities: [
        {
            id: "invoice_1",
            type: "invoice",
            message: "Invoice #LOAD-1 sent to Acme Labs",
            timestamp: "2026-04-23T06:00:00.000Z",
            time_ago: "1 minute ago",
            icon: "FileText",
            metadata: {
                amount: 1250,
                currency: "USD",
                status: "sent",
            },
        },
    ],
    has_more: true,
    total_count: 2,
});

const secondPage = buildActivitiesResponse({
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
    has_more: false,
    total_count: 2,
});

test.describe("Dashboard — Responsive And Accessibility", () => {
    test("renders the dashboard content on a mobile viewport", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await goToDashboard(page);

        await expect(
            page.getByRole("heading", { name: /welcome back/i }),
        ).toBeVisible();
        await expect(page.locator("aside")).toBeHidden();
        await expect(
            page.getByRole("combobox", { name: /language/i }),
        ).toBeVisible();
    });

    test("exposes accessible header controls and supports keyboard activation for Load more", async ({
        page,
    }) => {
        await mockDashboardApis(page, {
            dashboard: buildDashboardResponse(),
            activitiesByOffset: {
                0: firstPage,
                10: secondPage,
            },
        });

        await goToDashboard(page);

        await expect(
            page.getByRole("heading", { name: "Dashboard", exact: true }).first(),
        ).toBeVisible();
        await expect(
            page.getByRole("heading", { name: /workspace activity/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("combobox", { name: /language/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: /logout/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("link", { name: "Dashboard", exact: true }).first(),
        ).toBeVisible();

        const loadMore = page.getByRole("button", { name: /load more/i });
        await expect(loadMore).toBeVisible();
        await loadMore.focus();
        await expect(loadMore).toBeFocused();
        await page.keyboard.press("Enter");

        await expect(
            page.getByText(/invoice #LOAD-2 sent to Northwind Studio/i),
        ).toBeVisible();
    });
});
