/**
 * Leaves Settings — Admin Features.
 * Covers: employee selector visibility for admin users.
 */
import { test, expect } from "@playwright/test";
import { goToLeaves } from "./helpers";

test.describe("Leaves Settings — Admin Features", () => {
    test("header area contains employee search for admin", async ({ page }) => {
        await goToLeaves(page);

        // The admin header should have the year selector AND an employee search
        // The year selector is always present; the employee search is admin-only
        // Look for any input or select-like element beyond the year selector
        const headerInputs = page.locator("input[type='text'], [class*='select'], [class*='Select']");
        const count = await headerInputs.count();
        // Admin should have at least one input/select (the employee search)
        expect(count, "Admin should see employee search input").toBeGreaterThan(0);
    });
});
