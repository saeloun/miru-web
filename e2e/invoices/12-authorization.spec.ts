/**
 * TC-INV-030: Role-based access — admin vs employee.
 */
import { test, expect } from "@playwright/test";
import { TEST_PASSWORD } from "../helpers";

async function loginAndGoToInvoices(
    page: import("@playwright/test").Page,
    email: string
) {
    await page.goto("/user/sign_in");
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page
        .getByRole("textbox", { name: "Password" })
        .fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    // Wait for whichever page the role lands on
    // Employees land on /time-tracking, admins on /dashboard.
    // The SPA does window.location.href redirect which can race with goto.
    await page.waitForURL(/\/(dashboard|time-tracking|invoices)/, {
        timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");

    if (!page.url().includes("/invoices")) {
        await page.goto("/invoices");
        await page.waitForLoadState("networkidle");
    }
}

test.describe("Invoice Authorization", () => {
    test.use({ storageState: undefined });

    test("employee cannot see create invoice button", async ({ page }) => {
        await loginAndGoToInvoices(page, "sonam@saeloun.com");

        const createButton = page.getByRole("button", {
            name: /create.*invoice/i,
        });
        await expect(createButton).not.toBeVisible({ timeout: 5_000 });
    });

    test("admin can see create invoice button", async ({ page }) => {
        await loginAndGoToInvoices(page, "vipul@saeloun.com");

        await expect(
            page.getByRole("button", { name: /create.*invoice/i })
        ).toBeVisible({ timeout: 10_000 });
    });
});
