/**
 * Invite Member — admin invites new team members.
 * Covers manual test section 6.
 */
import { test, expect } from "@playwright/test";
import { goToTeam } from "./helpers";

test.describe("Team — Invite Member", () => {
    test("Invite Member button is visible for admin", async ({ page }) => {
        await goToTeam(page);
        const btn = page.getByRole("button", { name: /invite member/i });
        await expect(btn).toBeVisible();
    });

    test("clicking Invite Member opens the invite dialog", async ({ page }) => {
        await goToTeam(page);
        await page.getByRole("button", { name: /invite member/i }).click();

        await expect(
            page.getByRole("heading", { name: /invite member/i }),
        ).toBeVisible({ timeout: 10_000 });

        // Form fields present
        await expect(page.locator("#invite-member-first-name")).toBeVisible();
        await expect(page.locator("#invite-member-last-name")).toBeVisible();
        await expect(page.locator("#invite-member-email")).toBeVisible();
        await expect(page.locator("#invite-member-role")).toBeVisible();
    });

    test("invite button is disabled when form is empty", async ({ page }) => {
        await goToTeam(page);
        await page.getByRole("button", { name: /invite member/i }).click();
        await expect(
            page.getByRole("heading", { name: /invite member/i }),
        ).toBeVisible({ timeout: 10_000 });

        // The submit button inside the dialog should be disabled
        const dialog = page.getByRole("dialog");
        const submitBtn = dialog.getByRole("button", { name: /invite member/i });
        await expect(submitBtn).toBeDisabled();
    });

    test("cancel closes the invite dialog", async ({ page }) => {
        await goToTeam(page);
        await page.getByRole("button", { name: /invite member/i }).click();
        await expect(
            page.getByRole("heading", { name: /invite member/i }),
        ).toBeVisible({ timeout: 10_000 });

        await page.getByRole("dialog").getByRole("button", { name: /cancel/i }).click();

        await expect(
            page.getByRole("heading", { name: /invite member/i }),
        ).not.toBeVisible();
    });

    test("role dropdown has Admin, Employee, Book Keeper, Client options", async ({ page }) => {
        await goToTeam(page);
        await page.getByRole("button", { name: /invite member/i }).click();
        await expect(
            page.getByRole("heading", { name: /invite member/i }),
        ).toBeVisible({ timeout: 10_000 });

        const roleSelect = page.locator("#invite-member-role");
        await expect(roleSelect.locator('option[value="admin"]')).toBeAttached();
        await expect(roleSelect.locator('option[value="employee"]')).toBeAttached();
        await expect(roleSelect.locator('option[value="book_keeper"]')).toBeAttached();
        await expect(roleSelect.locator('option[value="client"]')).toBeAttached();
    });
});
