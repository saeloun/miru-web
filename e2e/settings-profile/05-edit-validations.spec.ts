/**
 * Profile Settings — Edit Validation Coverage.
 * Covers: phone, email, address, social links, locale selection, and optional fields.
 */
import { expect, test, type Page } from "@playwright/test";
import {
    createAuthFixture,
    deleteAuthFixture,
    signInAs,
} from "../public-forms/helpers";
import { goToProfileEdit, seedCurrentAddress } from "./helpers";

async function withFreshAdminProfile(
    page: Page,
    callback: (fixture: Awaited<ReturnType<typeof createAuthFixture>>) => Promise<void>,
) {
    const fixture = await createAuthFixture({
        confirmed: true,
        role: "admin",
    });

    try {
        await signInAs(page, fixture.email, fixture.password);
        await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible({
            timeout: 15_000,
        });
        await seedCurrentAddress(page, fixture.userId);
        await goToProfileEdit(page);
        await callback(fixture);
    } finally {
        await deleteAuthFixture(fixture);
    }
}

test.describe("Profile Settings — Edit Validations", () => {
    test.use({ storageState: undefined });

    test("rejects invalid phone numbers", async ({ page }) => {
        await withFreshAdminProfile(page, async () => {
            await page.locator("#phone_number").fill("+1");
            await page.getByRole("button", { name: /^update$/i }).click();

            await expect(page).toHaveURL(/\/settings\/profile\/edit$/);
            await expect(
                page.getByText(/mobile number must contain at least 2 digits/i),
            ).toBeVisible();
        });
    });

    test("rejects invalid email addresses", async ({ page }) => {
        await withFreshAdminProfile(page, async () => {
            await page.locator("#email_id").fill("not-an-email");
            await page.getByRole("button", { name: /^update$/i }).click();

            await expect(page).toHaveURL(/\/settings\/profile\/edit$/);
            await expect(page.locator("#email_id")).toHaveClass(/border-destructive/);
        });
    });

    test("rejects empty required address fields", async ({ page }) => {
        await withFreshAdminProfile(page, async () => {
            await page.locator("#address_line_1").fill("");

            await page.getByRole("button", { name: /^update$/i }).click();

            await expect(page).toHaveURL(/\/settings\/profile\/edit$/);
            await expect(page.locator("#address_line_1")).toHaveClass(/border-destructive/);
        });
    });

    test("rejects overlong address values", async ({ page }) => {
        await withFreshAdminProfile(page, async () => {
            await page.locator("#address_line_1").fill("A".repeat(51));

            const addressResponsePromise = page.waitForResponse(
                response =>
                    response.request().method() === "PUT" &&
                    /\/api\/v1\/users\/\d+\/addresses\/\d+$/.test(response.url()),
            );

            await page.getByRole("button", { name: /^update$/i }).click();

            const addressResponse = await addressResponsePromise;
            expect(addressResponse.status()).toBe(422);
            const body = await addressResponse.json();
            expect(body.errors).toBeTruthy();
            await expect(page).toHaveURL(/\/settings\/profile\/edit$/);
        });
    });

    test("saves social links and allows optional address line 2 to stay blank", async ({
        page,
    }) => {
        await withFreshAdminProfile(page, async () => {
            await page.locator("#address_line_2").fill("");
            await page.locator("#address_line_1").fill("2146 Test Street");
            await page.locator("#city").fill("Pune");
            await page.locator("#state").fill("MH");
            await page.locator("#zipcode").fill("411001");
            await page.locator("#linkedin").fill("https://linkedin.com/in/codex-e2e");
            await page.locator("#github").fill("https://github.com/codex-e2e");

            await page.getByRole("button", { name: /^update$/i }).click();

            await expect(page).toHaveURL(/\/settings\/profile$/);
            await expect(
                page.getByText("https://linkedin.com/in/codex-e2e"),
            ).toBeVisible();
            await expect(
                page.getByText("https://github.com/codex-e2e"),
            ).toBeVisible();
        });
    });

    test("switches locale from the language selector and reloads in the new language", async ({
        page,
    }) => {
        await withFreshAdminProfile(page, async () => {
            await page
                .getByRole("button", { name: /language/i })
                .click();

            await page.getByRole("option", { name: /हिन्दी/i }).click();

            await expect(page).toHaveURL(/\/settings\/profile\/edit$/);
            await expect(page.getByText("व्यक्तिगत जानकारी").first()).toBeVisible({
                timeout: 15_000,
            });
        });
    });
});
