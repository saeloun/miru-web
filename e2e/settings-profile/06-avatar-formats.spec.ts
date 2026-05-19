/**
 * Profile Settings — Avatar Upload Formats.
 * Covers: supported image formats, invalid file rejection, and crop dialog launch.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
    createAuthFixture,
    deleteAuthFixture,
    signInAs,
} from "../public-forms/helpers";
import { expectToast, goToProfileEdit, seedCurrentAddress } from "./helpers";

const TEST_IMAGE = readFileSync(
    path.join(process.cwd(), "spec/support/fixtures/test-image.png"),
);
const INVALID_FILE = path.join(
    process.cwd(),
    "spec/support/fixtures/invalid-avatar.txt",
);

async function withFreshAdminProfile(
    page: Page,
    callback: () => Promise<void>,
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
        await callback();
    } finally {
        await deleteAuthFixture(fixture);
    }
}

test.describe("Profile Settings — Avatar Upload Formats", () => {
    test.use({ storageState: undefined });

    test("accepts png, jpg, and webp uploads and opens the crop dialog", async ({
        page,
    }) => {
        await withFreshAdminProfile(page, async () => {
            const input = page.locator('[data-testid="profile-image-input"]');
            const dialog = page.getByRole("dialog");

            for (const file of [
                { name: "avatar.png", mimeType: "image/png" },
                { name: "avatar.jpg", mimeType: "image/jpeg" },
                { name: "avatar.webp", mimeType: "image/webp" },
            ]) {
                await input.setInputFiles({
                    buffer: TEST_IMAGE,
                    ...file,
                });

                await expect(dialog.getByRole("heading", { name: /adjust profile photo/i })).toBeVisible({
                    timeout: 15_000,
                });
                await expect(dialog.getByRole("button", { name: /apply photo/i })).toBeVisible();
                await dialog.getByRole("button", { name: /^cancel$/i }).click();
                await expect(dialog).not.toBeVisible();
            }
        });
    });

    test("rejects invalid avatar file types", async ({ page }) => {
        await withFreshAdminProfile(page, async () => {
            await page
                .locator('[data-testid="profile-image-input"]')
                .setInputFiles(INVALID_FILE);

            await expectToast(
                page,
                /incorrect file format\. please upload a png, jpg, jpeg, or webp image\./i,
            );
        });
    });
});
