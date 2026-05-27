/**
 * Kebab Menu Actions — copy email, view profile, navigation.
 * Covers manual test section 9.
 */
import { test, expect } from "@playwright/test";
import { goToTeam, openKebabMenu } from "./helpers";

test.describe("Team — Kebab Menu", () => {
    test("kebab menu shows all expected actions", async ({ page }) => {
        await goToTeam(page);

        const rows = page.locator("tbody tr");
        const firstRow = rows.first();
        const memberName = await firstRow.locator("td").first().locator("p").first().innerText();

        await openKebabMenu(page, memberName);

        await expect(page.getByRole("menuitem", { name: /copy email/i })).toBeVisible();
        await expect(page.getByRole("menuitem", { name: /view profile/i })).toBeVisible();
        await expect(page.getByRole("menuitem", { name: /edit member/i })).toBeVisible();
        await expect(page.getByRole("menuitem", { name: /delete user/i })).toBeVisible();
    });

    test("View Profile navigates to /team/{id}", async ({ page }) => {
        await goToTeam(page);

        const rows = page.locator("tbody tr");
        const firstRow = rows.first();
        const memberName = await firstRow.locator("td").first().locator("p").first().innerText();

        await openKebabMenu(page, memberName);
        await page.getByRole("menuitem", { name: /view profile/i }).click();

        await page.waitForURL(/\/team\/\d+/, { timeout: 10_000 });
        expect(page.url()).toContain("/team/");
    });

    test("delete confirmation surfaces impact warning details", async ({
        page,
    }) => {
        await page.route("**/api/v1/team/*/removal_impact", route =>
            route.fulfill({
                contentType: "application/json",
                status: 200,
                body: JSON.stringify({
                    removalImpact: {
                        projectAssignmentsCount: 1,
                        projectNames: ["E2E-Project"],
                        unbilledEntriesCount: 2,
                        unbilledMinutes: 300,
                        uninvoicedAmount: 100,
                        invoicedEntriesCount: 0,
                        hasRisk: true,
                    },
                }),
            }),
        );

        await goToTeam(page);

        const rows = page.locator("tbody tr");
        const firstRow = rows.first();
        const memberName = await firstRow
            .locator("td")
            .first()
            .locator("p")
            .first()
            .innerText();

        await openKebabMenu(page, memberName);
        await page.getByRole("menuitem", { name: /delete user/i }).click();

        await expect(
            page.getByText(/warning: this member has active work in this workspace/i),
        ).toBeVisible();
        await expect(page.getByText(/assigned to 1 project/i)).toBeVisible();
        await expect(page.getByText(/unbilled hours across 2 entries/i)).toBeVisible();
    });

    // PR #2293 — delete dialog shows stable content without loading placeholders
    test("delete dialog renders without loading placeholders", async ({ page }) => {
        await goToTeam(page);

        const rows = page.locator("tbody tr");
        const rowCount = await rows.count();
        if (rowCount < 2) return;

        const memberName = await rows.nth(1).locator("td").first().locator("p").first().innerText();
        await openKebabMenu(page, memberName);

        const deleteOption = page.getByRole("menuitem", { name: /delete user/i });
        const hasDelete = await deleteOption.isVisible().catch(() => false);
        if (!hasDelete) return;

        await deleteOption.click();

        const dialog = page.locator("[role='dialog'], [role='alertdialog']").first();
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        await expect(dialog.getByText(/loading/i)).not.toBeVisible({ timeout: 3_000 });

        await page.keyboard.press("Escape");
    });
});
