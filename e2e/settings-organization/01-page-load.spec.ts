/**
 * Organization Settings — Page Load & Layout.
 * Covers: page load, company profile card, financial card, schedule card, edit button.
 */
import { test, expect } from "@playwright/test";
import { goToOrgSettings } from "./helpers";

test.describe("Organization Settings — Page Load & Layout", () => {
    test("page loads without errors", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText(/company profile/i)).toBeVisible();
    });

    test("Edit Settings button is visible for admin", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByRole("button", { name: /edit settings/i })).toBeVisible();
    });

    test("company name is displayed", async ({ page }) => {
        await goToOrgSettings(page);
        // The company name appears as a heading in the profile card
        const heading = page.locator("h2").first();
        await expect(heading).toBeVisible();
        const text = await heading.innerText();
        expect(text.length).toBeGreaterThan(0);
    });

    test("Active badge is displayed", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText("Active")).toBeVisible();
    });

    test("company profile card shows business phone label", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText(/business phone/i)).toBeVisible();
    });

    test("company profile card shows currency label", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText(/currency/i).first()).toBeVisible();
    });

    test("company profile card shows business address label", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText(/business address/i)).toBeVisible();
    });

    test("financial card shows standard rate", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText(/standard rate/i)).toBeVisible();
        // Rate should have a dollar amount and "/hour"
        await expect(page.getByText(/\/ hour/i)).toBeVisible();
    });

    test("financial card shows fiscal year end", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText(/fiscal year end/i)).toBeVisible();
    });

    test("schedule card shows timezone", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText(/timezone/i).first()).toBeVisible();
    });

    test("schedule card shows date format", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText(/date format/i).first()).toBeVisible();
    });

    test("schedule card shows working days", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText(/working days/i).first()).toBeVisible();
    });

    test("working hours card is visible", async ({ page }) => {
        await goToOrgSettings(page);
        await expect(page.getByText(/working hours/i).first()).toBeVisible();
    });
});
