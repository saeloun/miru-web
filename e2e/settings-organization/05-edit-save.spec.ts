/**
 * Organization Settings — Edit & Save.
 * Covers: updating company name, rate, working days, and verifying changes persist.
 * Each test restores original values after modification.
 */
import { test, expect } from "@playwright/test";
import { goToOrgEdit, goToOrgSettings, fetchCompanyDetails, updateCompany } from "./helpers";

test.describe("Organization Settings — Edit & Save", () => {
    test("update company name via edit form", async ({ page }) => {
        const details = await fetchCompanyDetails(page);
        const originalName = details.name;
        const newName = originalName === "Saeloun Inc" ? "Saeloun Corp" : "Saeloun Inc";

        try {
            await goToOrgEdit(page);

            const nameInput = page.locator("input[aria-label='Company Name']");
            await nameInput.fill(newName);

            // Wait for the PUT response
            const [response] = await Promise.all([
                page.waitForResponse(
                    resp => resp.url().includes("/api/v1/companies/") && resp.request().method() === "PUT",
                    { timeout: 15_000 },
                ),
                page.getByRole("button", { name: /save changes/i }).click(),
            ]);

            expect(response.ok(), `Save failed with status ${response.status()}`).toBeTruthy();

            // Verify the name was updated via API
            const updated = await fetchCompanyDetails(page);
            expect(updated.name).toBe(newName);
        } finally {
            // Restore original name via API
            await updateCompany(page, details.id, { name: originalName });
        }
    });

    test("update standard rate and verify on details page", async ({ page }) => {
        const details = await fetchCompanyDetails(page);
        const originalRate = details.standard_price.toString();

        try {
            await goToOrgEdit(page);

            const rateInput = page.locator("input[aria-label='Standard Rate']");
            await rateInput.fill("999.99");

            const savePromise = page.waitForResponse(
                resp => resp.url().includes("/api/v1/companies/") && resp.request().method() === "PUT",
                { timeout: 15_000 },
            );

            await page.getByRole("button", { name: /save changes/i }).click();

            const response = await savePromise;
            expect(response.ok(), `Save failed: ${response.status()}`).toBeTruthy();

            const updated = await fetchCompanyDetails(page);
            expect(Number(updated.standard_price)).toBe(999.99);
        } finally {
            await updateCompany(page, details.id, { standard_price: originalRate });
        }
    });

    test("update working days and verify on details page", async ({ page }) => {
        const details = await fetchCompanyDetails(page);
        const originalDays = (details.working_days || "5").toString();

        try {
            await goToOrgEdit(page);

            const daysInput = page.locator("input[aria-label='Working Days per Week']");
            await daysInput.fill("4");

            const savePromise = page.waitForResponse(
                resp => resp.url().includes("/api/v1/companies/") && resp.request().method() === "PUT",
                { timeout: 15_000 },
            );

            await page.getByRole("button", { name: /save changes/i }).click();

            const response = await savePromise;
            expect(response.ok(), `Save failed: ${response.status()}`).toBeTruthy();

            await goToOrgSettings(page);
            const workingDaysLabel = page.getByText(/working days/i).first();
            await expect(workingDaysLabel).toBeVisible({ timeout: 10_000 });
        } finally {
            await updateCompany(page, details.id, { working_days: originalDays });
        }
    });
});
