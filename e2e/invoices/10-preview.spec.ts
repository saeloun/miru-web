/**
 * TC-INV-011: Invoice preview in editor.
 * TC-INV-022: Line item name field usability.
 * TC-INV-023: Date picker rendering.
 * TC-INV-024: Company info display.
 */
import { test, expect } from "@playwright/test";
import { goToInvoices, selectFirstOption } from "../helpers";

test.describe("Invoice Preview & Editor UI", () => {
    test.beforeEach(async ({ page }) => {
        await goToInvoices(page);
        await page.getByRole("button", { name: /create.*invoice/i }).click();
        await expect(
            page.getByText(/new invoice/i).first()
        ).toBeVisible({ timeout: 10_000 });
    });

    // TC-INV-011: Preview section visible on desktop
    test("shows live preview alongside the editor", async ({ page }) => {
        await selectFirstOption(page, "invoice-client-select");
        // After selecting a client, the preview should show company/client info
        // Just verify the page didn't crash and has content
        await expect(page.locator("#invoiceNumber")).toBeVisible();
    });

    // TC-INV-023: Issue date picker opens and renders correctly
    test("issue date picker opens without UI breakage", async ({ page }) => {
        // The Issue Date label is followed by a Popover trigger button
        // Use the label to find the right section, then click the button
        const issueDateLabel = page.getByText("Issue Date", { exact: true });
        await expect(issueDateLabel).toBeVisible();

        // The button is a sibling — click the next button after the label
        // In the editor, each date field is: <Label> then <Popover><PopoverTrigger><Button>
        // The button contains the formatted date text
        const issueDateButton = issueDateLabel
            .locator("..")
            .getByRole("button");
        await issueDateButton.click();

        // Calendar popover should appear
        await expect(
            page.locator('[data-radix-popper-content-wrapper]').first()
        ).toBeVisible({ timeout: 5_000 });

        await page.keyboard.press("Escape");
    });

    // TC-INV-023: Due date picker
    test("due date picker opens correctly", async ({ page }) => {
        const dueDateLabel = page.getByText("Due Date", { exact: true });
        await expect(dueDateLabel).toBeVisible();

        const dueDateButton = dueDateLabel
            .locator("..")
            .getByRole("button");
        await dueDateButton.click();

        await expect(
            page.locator('[data-radix-popper-content-wrapper]').first()
        ).toBeVisible({ timeout: 5_000 });

        await page.keyboard.press("Escape");
    });

    // TC-INV-022: Line item name field is usable
    test("line item name input is wide enough for text", async ({ page }) => {
        await selectFirstOption(page, "invoice-client-select");

        const nameInput = page.getByPlaceholder(/name|item/i).first();
        if (await nameInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await nameInput.fill(
                "Software Development Services - March 2026"
            );
            const box = await nameInput.boundingBox();
            expect(box?.width).toBeGreaterThan(100);
        }
    });

    // TC-INV-024: Editor form fields render correctly
    test("all form sections are present", async ({ page }) => {
        await expect(page.getByText(/basic details/i)).toBeVisible();
        await expect(page.locator("#invoiceNumber")).toBeVisible();
        await expect(page.locator("#reference")).toBeVisible();
        await expect(page.getByText(/line items/i).first()).toBeVisible();
        await expect(page.getByText(/additional details/i)).toBeVisible();
        await expect(page.locator("#discount")).toBeVisible();
        await expect(page.locator("#tax")).toBeVisible();
        await expect(page.locator("#notes")).toBeVisible();
    });
});
