/**
 * Organization Settings — Edit Form Fields.
 * Covers: form field visibility, Radix Select dropdowns, work schedule inputs.
 */
import { test, expect } from "@playwright/test";
import { goToOrgEdit } from "./helpers";

test.describe("Organization Settings — Edit Form Fields", () => {
    test("company name input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const nameInput = page.locator("input[aria-label='Company Name']");
        await expect(nameInput).toBeVisible({ timeout: 10_000 });
        await expect(nameInput).toBeEditable();
    });

    test("address line 1 input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const addr1 = page.locator("input[aria-label='Address Line 1']");
        await expect(addr1).toBeVisible({ timeout: 10_000 });
        await expect(addr1).toBeEditable();
    });

    test("address line 2 input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const addr2 = page.locator("input[aria-label='Address Line 2']");
        await expect(addr2).toBeVisible({ timeout: 10_000 });
        await expect(addr2).toBeEditable();
    });

    test("country select is present", async ({ page }) => {
        await goToOrgEdit(page);

        const countryTrigger = page.locator("button[aria-label='Country']");
        await expect(countryTrigger).toBeVisible({ timeout: 10_000 });
    });

    test("state input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const stateInput = page.locator("input[aria-label='State/Province']");
        await expect(stateInput).toBeVisible({ timeout: 10_000 });
        await expect(stateInput).toBeEditable();
    });

    test("city input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const cityInput = page.locator("input[aria-label='City']");
        await expect(cityInput).toBeVisible({ timeout: 10_000 });
        await expect(cityInput).toBeEditable();
    });

    test("zipcode input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const zipInput = page.locator("input[aria-label='ZIP/Postal Code']");
        await expect(zipInput).toBeVisible({ timeout: 10_000 });
        await expect(zipInput).toBeEditable();
    });

    test("currency select is present", async ({ page }) => {
        await goToOrgEdit(page);

        const currencyTrigger = page.locator("button[aria-label='Base Currency']");
        await expect(currencyTrigger).toBeVisible({ timeout: 10_000 });
    });

    test("standard rate input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const rateInput = page.locator("input[aria-label='Standard Rate']");
        await expect(rateInput).toBeVisible({ timeout: 10_000 });
        await expect(rateInput).toBeEditable();
    });

    test("fiscal year end select is present", async ({ page }) => {
        await goToOrgEdit(page);

        const fiscalTrigger = page.locator("button[aria-label='Fiscal Year End']");
        await expect(fiscalTrigger).toBeVisible({ timeout: 10_000 });
    });

    test("timezone select is present", async ({ page }) => {
        await goToOrgEdit(page);

        const timezoneTrigger = page.locator("button[aria-label='Timezone']");
        await expect(timezoneTrigger).toBeVisible({ timeout: 10_000 });
    });

    test("date format select is present", async ({ page }) => {
        await goToOrgEdit(page);

        const dateFormatTrigger = page.locator("button[aria-label='Date Format']");
        await expect(dateFormatTrigger).toBeVisible({ timeout: 10_000 });
    });

    test("working days input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const daysInput = page.locator("input[aria-label='Working Days per Week']");
        await expect(daysInput).toBeVisible({ timeout: 10_000 });
        await expect(daysInput).toBeEditable();
    });

    test("working hours input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const hoursInput = page.locator("input[aria-label='Working Hours per Week']");
        await expect(hoursInput).toBeVisible({ timeout: 10_000 });
        await expect(hoursInput).toBeEditable();
    });

    test("bank name input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const bankInput = page.locator("input[aria-label='Bank Name']");
        await expect(bankInput).toBeVisible({ timeout: 10_000 });
        await expect(bankInput).toBeEditable();
    });

    test("tax ID input is editable", async ({ page }) => {
        await goToOrgEdit(page);

        const taxInput = page.locator("input[aria-label='Tax ID']");
        await expect(taxInput).toBeVisible({ timeout: 10_000 });
        await expect(taxInput).toBeEditable();
    });

    test("save button is disabled when no changes made", async ({ page }) => {
        await goToOrgEdit(page);

        const saveBtn = page.getByRole("button", { name: /save changes/i });
        await expect(saveBtn).toBeVisible({ timeout: 10_000 });
        // The button should be disabled (has cursor-not-allowed class) when no changes
        await expect(saveBtn).toBeDisabled();
    });

    test("save button enables after making a change", async ({ page }) => {
        await goToOrgEdit(page);

        const nameInput = page.locator("input[aria-label='Company Name']");
        await expect(nameInput).toBeVisible({ timeout: 10_000 });

        // Make a change
        const original = await nameInput.inputValue();
        await nameInput.fill(original + "x");

        // Save button should now be enabled
        const saveBtn = page.getByRole("button", { name: /save changes/i });
        await expect(saveBtn).toBeEnabled();

        // Restore and cancel
        await page.getByRole("button", { name: /cancel/i }).click();
    });
});
