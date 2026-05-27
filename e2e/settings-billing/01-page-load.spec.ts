/**
 * Billing Settings — Page Load & Layout.
 * Covers: page load, membership card, plan badge, seat usage, billing cadence,
 * hero section, plan cards, feature table, footer badges.
 */
import { test, expect } from "@playwright/test";
import { goToBilling } from "./helpers";

test.describe("Billing Settings — Page Load & Layout", () => {
    test("page loads without errors", async ({ page }) => {
        await goToBilling(page);
        await expect(page.getByText(/membership/i).first()).toBeVisible();
    });

    test("membership card shows current plan label", async ({ page }) => {
        await goToBilling(page);
        await expect(page.getByText(/current plan/i)).toBeVisible();
    });

    test("membership card shows seat usage", async ({ page }) => {
        await goToBilling(page);
        await expect(page.getByText(/seat usage/i)).toBeVisible();
        // Should show "X/Y seats used" or "X seats used"
        await expect(page.getByText(/seats used/i)).toBeVisible();
    });

    test("membership card shows billing cadence label", async ({ page }) => {
        await goToBilling(page);
        // The billing cadence section is inside the membership card
        // Check for "Not subscribed yet" or "Monthly" or "Yearly" which are the cadence values
        const cadenceValue = page.getByText(/not subscribed yet|monthly|yearly/i).first();
        await expect(cadenceValue).toBeVisible({ timeout: 10_000 });
    });

    test("hero title is visible", async ({ page }) => {
        await goToBilling(page);
        const hero = page.getByText(/pick the package that fits now/i);
        await hero.scrollIntoViewIfNeeded();
        await expect(hero).toBeVisible();
    });

    test("pro highlights section shows three cards", async ({ page }) => {
        await goToBilling(page);
        const highlight = page.getByText(/more seats without admin pain/i);
        await highlight.scrollIntoViewIfNeeded();
        await expect(highlight).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(/sso and stronger controls/i)).toBeVisible();
        await expect(page.getByText(/finance visibility/i).first()).toBeVisible();
    });

    test("seat estimator section is visible", async ({ page }) => {
        await goToBilling(page);
        await expect(page.getByText(/how many seats/i)).toBeVisible();
        await expect(page.getByText(/estimated seats/i)).toBeVisible();
    });

    test("four plan cards are visible", async ({ page }) => {
        await goToBilling(page);
        // Free plan
        await expect(page.getByRole("heading", { name: "Free" }).first()).toBeVisible();
        // Pro plan
        await expect(page.getByRole("heading", { name: "Pro" }).first()).toBeVisible();
        // Enterprise plan
        await expect(page.getByRole("heading", { name: "Enterprise" }).first()).toBeVisible();
        // Hosted Enterprise plan
        await expect(page.getByRole("heading", { name: "Hosted Enterprise" }).first()).toBeVisible();
    });

    test("feature comparison table is visible", async ({ page }) => {
        await goToBilling(page);
        // Scroll to the bottom of the page to find the table
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        // Look for a table element with feature comparison content
        const table = page.locator("table").first();
        await expect(table).toBeAttached({ timeout: 10_000 });
    });

    test("plan cards section contains Free plan at zero cost", async ({ page }) => {
        await goToBilling(page);
        // The Free plan card shows "$0" price
        await expect(page.getByText("$0").first()).toBeVisible({ timeout: 10_000 });
    });

    test("Change plans anytime badge is visible", async ({ page }) => {
        await goToBilling(page);
        const badge = page.getByText(/change plans anytime/i);
        await badge.scrollIntoViewIfNeeded();
        await expect(badge).toBeVisible({ timeout: 10_000 });
    });
});
