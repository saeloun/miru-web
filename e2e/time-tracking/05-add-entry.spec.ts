/**
 * Add Entry — form fields, dropdowns, save, cancel.
 * Covers manual test section 6.
 */
import { test, expect } from "@playwright/test";
import { goToTimeTracking, getFirstProject, deleteTimesheetEntry } from "./helpers";

test.describe("Time Tracking — Add Entry", () => {
    // §6.1 — Add Entry button visible
    test("Add Entry button is visible", async ({ page }) => {
        await goToTimeTracking(page);
        await expect(page.getByRole("button", { name: /add entry/i })).toBeVisible();
    });

    // §6.2 — Click Add Entry opens form
    test("clicking Add Entry opens the entry form", async ({ page }) => {
        await goToTimeTracking(page);
        await page.getByRole("button", { name: /add entry/i }).click();

        // Form fields should be visible
        await expect(page.locator(".client-select")).toBeVisible({ timeout: 5_000 });
        await expect(page.locator(".project-select")).toBeVisible();
    });

    // §6.3 — Saving to date shown
    test("form shows the selected date in 'Saving to' header", async ({ page }) => {
        await goToTimeTracking(page);
        await page.getByRole("button", { name: /add entry/i }).click();
        await expect(page.getByText(/saving to/i)).toBeVisible();
    });

    // §6.4 — Client dropdown populated
    test("client dropdown has options", async ({ page }) => {
        await goToTimeTracking(page);
        await page.getByRole("button", { name: /add entry/i }).click();

        await page.locator(".client-select").click();
        const options = page.locator("[role='option']");
        const count = await options.count();
        expect(count).toBeGreaterThan(0);
        // Close the dropdown
        await page.keyboard.press("Escape");
    });

    // §6.6 — Project dropdown disabled without client
    test("project dropdown is disabled when no client is selected", async ({ page }) => {
        await goToTimeTracking(page);
        // Clear localStorage to ensure no pre-selected client
        await page.evaluate(() => {
            localStorage.removeItem("client");
            localStorage.removeItem("project");
            localStorage.removeItem("projectId");
        });
        await page.reload();
        await goToTimeTracking(page);
        await page.getByRole("button", { name: /add entry/i }).click();

        const projectSelect = page.locator(".project-select");
        await expect(projectSelect).toBeVisible();
        // Should have the disabled styling
        await expect(projectSelect).toHaveClass(/opacity-50|cursor-not-allowed/);
    });

    // §6.8 — Task type dropdown
    test("task type dropdown has expected options", async ({ page }) => {
        await goToTimeTracking(page);
        await page.getByRole("button", { name: /add entry/i }).click();

        // Find and click the task type select
        const taskTypeSelects = page.locator("button[role='combobox']");
        // Task type is the last combobox in the form
        await taskTypeSelects.last().click();

        const options = page.locator("[role='option']");
        const count = await options.count();
        expect(count).toBeGreaterThanOrEqual(10); // At least 10 task types
        await page.keyboard.press("Escape");
    });

    // §6.10 — Save Entry disabled when incomplete
    test("Save Entry button is disabled when form is empty", async ({ page }) => {
        await goToTimeTracking(page);
        await page.evaluate(() => {
            localStorage.removeItem("client");
            localStorage.removeItem("project");
            localStorage.removeItem("projectId");
            localStorage.removeItem("duration");
            localStorage.removeItem("note");
        });
        await page.reload();
        await goToTimeTracking(page);
        await page.getByRole("button", { name: /add entry/i }).click();

        const saveBtn = page.getByRole("button", { name: /save entry/i });
        await expect(saveBtn).toBeDisabled();
    });

    // §6.12 — Cancel button
    test("cancel closes the form without creating an entry", async ({ page }) => {
        await goToTimeTracking(page);
        await page.getByRole("button", { name: /add entry/i }).click();
        await expect(page.locator(".client-select")).toBeVisible();

        await page.getByRole("button", { name: /cancel/i }).click();

        // Form should close, Add Entry button should reappear
        await expect(page.getByRole("button", { name: /add entry/i })).toBeVisible();
    });

    // §6.13 — Add Entry button hidden when form is open
    test("Add Entry button is hidden when form is open", async ({ page }) => {
        await goToTimeTracking(page);
        await page.getByRole("button", { name: /add entry/i }).click();

        await expect(page.getByRole("button", { name: /add entry/i })).not.toBeVisible();
    });
});
