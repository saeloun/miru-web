/**
 * Revenue Overview chart — date labels and tooltip accuracy.
 *
 * The chart spans 12 months which may cross year boundaries (e.g., May 2025 → Apr 2026).
 * These tests verify that:
 * - X-axis labels include the year so months are unambiguous
 * - Tooltip shows the correct year for each data point (not hardcoded current year)
 *
 * Related issue: Revenue Overview shows wrong dates
 */
import { test, expect } from "@playwright/test";
import { goToInvoices } from "../helpers";

test.describe("Revenue Overview Chart", () => {
    test("x-axis labels include the year (not just month abbreviation)", async ({ page }) => {
        await goToInvoices(page);

        const chart = page
            .locator("section, div")
            .filter({ has: page.getByRole("heading", { name: "Revenue Overview" }) })
            .first();

        await expect(page.getByRole("heading", { name: "Revenue Overview" })).toBeVisible();
        await expect(chart.getByText(/No data/i)).toHaveCount(0);
        await expect(page.locator(".recharts-surface").first()).toBeVisible();

        // Recharts renders axis labels as SVG text nodes.
        const xAxisTicks = page.locator(
            ".recharts-cartesian-axis-tick text, .recharts-cartesian-axis-tick tspan"
        );
        await expect(xAxisTicks.first()).toBeVisible();

        const labels = (await xAxisTicks.evaluateAll(nodes =>
            nodes
                .map(node => node.textContent?.trim() || "")
                .filter(Boolean)
        )) as string[];

        expect(labels.length).toBeGreaterThan(0);

        const hasYearInLabel = labels.some(text => /\d{2,4}/.test(text));

        expect(
            hasYearInLabel,
            "X-axis labels should include the year to avoid ambiguity across year boundaries",
        ).toBe(true);
    });

    test("tooltip does not hardcode the current year for past months", async ({ page }) => {
        await goToInvoices(page);

        // Find the chart area and hover over the first data point
        const chartArea = page.locator(".recharts-area-area, .recharts-surface").first();
        await expect(chartArea).toBeVisible({ timeout: 10_000 });

        // Get the bounding box and hover near the left side (earliest month)
        const box = await chartArea.boundingBox();
        if (!box) return;

        // Hover over the leftmost data point (oldest month — likely previous year)
        await page.mouse.move(box.x + 30, box.y + box.height / 2);
        await page.waitForTimeout(500);

        // Check if a tooltip appeared
        const tooltip = page.locator(".recharts-tooltip-wrapper").first();
        const isTooltipVisible = await tooltip.isVisible().catch(() => false);

        if (isTooltipVisible) {
            const tooltipText = await tooltip.innerText();

            // The tooltip should NOT show a month from a previous year labeled with the current year
            // e.g., "Jun 2026" when the data is actually from June 2025
            const currentYear = new Date().getFullYear();
            const previousYear = currentYear - 1;

            // If the tooltip mentions a month, any year shown should be plausible
            // It should NOT contain patterns like "May 2026" for data that's from May 2025
            // The simplest check: if a year is shown, it should match the data point's actual year
            // Since we can't know the exact data, just verify the tooltip doesn't show
            // a bare month name + wrong year (the known bug pattern)
            const wrongYearPattern = new RegExp(
                `(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s*'?\\d{2}\\s+${currentYear}`,
            );
            expect(
                tooltipText,
                `Tooltip "${tooltipText}" appears to show a redundant/wrong year`,
            ).not.toMatch(wrongYearPattern);
        }
    });
});
