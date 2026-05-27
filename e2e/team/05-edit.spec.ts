/**
 * Edit Member — admin edits team members via the kebab menu.
 * Covers manual test section 7.
 */
import { test, expect } from "@playwright/test";
import { goToTeam, openKebabMenu } from "./helpers";

test.describe("Team — Edit Member", () => {
    test("edit dialog opens pre-filled from kebab menu", async ({ page }) => {
        await goToTeam(page);

        // Use the first non-admin member row (skip the logged-in admin to avoid self-edit issues)
        const rows = page.locator("tbody tr");
        const rowCount = await rows.count();
        if (rowCount < 2) {
            test.skip(true, "Need at least 2 team members to test edit");
        }

        // Find a member name from the second row
        const secondRow = rows.nth(1);
        const memberName = await secondRow.locator("td").first().locator("p").first().innerText();

        await openKebabMenu(page, memberName);
        await page.getByRole("menuitem", { name: /edit member/i }).click();

        await expect(
            page.getByRole("heading", { name: /edit member/i }),
        ).toBeVisible({ timeout: 10_000 });

        // First name should be pre-filled
        const firstNameInput = page.locator("#edit-member-first-name");
        await expect(firstNameInput).toBeVisible();
        const value = await firstNameInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
    });

    test("cancel edit closes the dialog", async ({ page }) => {
        await goToTeam(page);

        const rows = page.locator("tbody tr");
        const rowCount = await rows.count();
        if (rowCount < 2) {
            test.skip(true, "Need at least 2 team members");
        }

        const secondRow = rows.nth(1);
        const memberName = await secondRow.locator("td").first().locator("p").first().innerText();

        await openKebabMenu(page, memberName);
        await page.getByRole("menuitem", { name: /edit member/i }).click();
        await expect(
            page.getByRole("heading", { name: /edit member/i }),
        ).toBeVisible({ timeout: 10_000 });

        await page.getByRole("dialog").getByRole("button", { name: /cancel/i }).click();

        await expect(
            page.getByRole("heading", { name: /edit member/i }),
        ).not.toBeVisible();
    });
});
