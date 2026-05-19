/**
 * Organization Settings — Logo and Company Name.
 * Covers: logo upload preview and long no-space company names.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import {
    fetchCompanyDetails,
    goToOrgEdit,
    goToOrgSettings,
    updateCompany,
} from "./helpers";

const TEST_IMAGE = readFileSync(
    path.join(process.cwd(), "spec/support/fixtures/test-image.png"),
);

const LONG_NO_SPACE_NAME = "Miru".padEnd(30, "X");

test.describe("Organization Settings — Logo and Company Name", () => {
    test("shows the uploaded logo preview in the edit form", async ({ page }) => {
        await goToOrgEdit(page);

        const uploadInput = page.locator("input[type='file']").first();
        await uploadInput.setInputFiles({
            name: "company-logo.png",
            mimeType: "image/png",
            buffer: TEST_IMAGE,
        });

        await expect(page.getByAltText("Company logo")).toBeVisible({
            timeout: 10_000,
        });

        await page.getByRole("button", { name: /cancel/i }).click();
    });

    test("persists a long company name without spaces", async ({ page }) => {
        const details = await fetchCompanyDetails(page);

        try {
            await goToOrgEdit(page);

            const nameInput = page.locator("input[aria-label='Company Name']");
            await nameInput.fill(LONG_NO_SPACE_NAME);

            const savePromise = page.waitForResponse(
                response =>
                    response.url().includes(`/api/v1/companies/${details.id}`) &&
                    response.request().method() === "PUT",
                { timeout: 15_000 },
            );

            await page.getByRole("button", { name: /save changes/i }).click();

            const response = await savePromise;
            expect(response.ok(), `Save failed: ${response.status()}`).toBeTruthy();

            await goToOrgSettings(page);
            await expect(page.locator("h2").first()).toContainText(LONG_NO_SPACE_NAME);
        } finally {
            await updateCompany(page, details.id, { name: details.name });
        }
    });
});
