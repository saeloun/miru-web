/**
 * Profile Settings — Page Load & Layout.
 * Covers: page load, user name, avatar, cards, labels.
 */
import { test, expect } from "@playwright/test";
import { goToProfile } from "./helpers";

test.describe("Profile Settings — Page Load & Layout", () => {
    test("page loads without errors", async ({ page }) => {
        await goToProfile(page);
        await expect(page.getByText(/personal information/i).first()).toBeVisible();
    });

    test("user name is displayed as heading", async ({ page }) => {
        await goToProfile(page);
        const heading = page.locator("h2").first();
        await expect(heading).toBeVisible();
        const text = await heading.innerText();
        expect(text.length).toBeGreaterThan(0);
    });

    test("user profile header section is displayed", async ({ page }) => {
        await goToProfile(page);
        // The profile header shows the user name and email/location below it
        const heading = page.locator("h2").first();
        await expect(heading).toBeVisible();
        // There should be muted text below the name (email or location)
        const subtitle = page.locator("h2 + p, h2 ~ p").first();
        await expect(subtitle).toBeVisible();
    });

    test("phone number label is visible", async ({ page }) => {
        await goToProfile(page);
        await expect(page.getByText(/phone number/i).first()).toBeVisible();
    });

    test("personal email label is visible", async ({ page }) => {
        await goToProfile(page);
        await expect(page.getByText(/personal email/i).first()).toBeVisible();
    });

    test("address section is visible", async ({ page }) => {
        await goToProfile(page);
        await expect(page.getByText(/address/i).first()).toBeVisible();
    });

    test("social profiles card is visible", async ({ page }) => {
        await goToProfile(page);
        await expect(page.getByText(/social profiles/i)).toBeVisible();
    });

    test("LinkedIn label is visible", async ({ page }) => {
        await goToProfile(page);
        await expect(page.getByText(/linkedin/i).first()).toBeVisible();
    });

    test("GitHub label is visible", async ({ page }) => {
        await goToProfile(page);
        await expect(page.getByText(/github/i).first()).toBeVisible();
    });

    test("security card is visible", async ({ page }) => {
        await goToProfile(page);
        await expect(page.getByText(/security/i).first()).toBeVisible();
    });

    test("Secure badge is visible", async ({ page }) => {
        await goToProfile(page);
        await expect(page.getByText("Secure")).toBeVisible();
    });

    test("Change Password button is visible", async ({ page }) => {
        await goToProfile(page);
        await expect(page.getByRole("button", { name: /change password/i })).toBeVisible();
    });
});
