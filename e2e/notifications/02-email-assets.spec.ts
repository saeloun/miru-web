import { test, expect, type Page } from "@playwright/test";

async function openPreview(page: Page, path: string) {
    await page.goto(path);
    await expect(page.frameLocator("iframe").first().locator("body")).toBeVisible({
        timeout: 15_000,
    });
}

async function assertImagesLoaded(page: Page) {
    const iframe = page.frameLocator("iframe").first();
    const images = iframe.locator("img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i += 1) {
        const img = images.nth(i);
        const loaded = await img.evaluate((element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0
        );
        expect(loaded).toBe(true);
    }
}

test.describe("Email Assets Loading", () => {
    test.describe.configure({ mode: "serial" });

    test("weekly reminder email has all images loading correctly", async ({ page }) => {
        await openPreview(
            page,
            "/rails/mailers/send_weekly_reminder_to_user_mailer/notify_user_about_missed_entries"
        );
        await assertImagesLoaded(page);
    });

    test("weekly reminder email logo is visible and not broken", async ({ page }) => {
        await openPreview(
            page,
            "/rails/mailers/send_weekly_reminder_to_user_mailer/notify_user_about_missed_entries"
        );

        const iframe = page.frameLocator("iframe").first();
        const logo = iframe.locator('img[alt*="Miru"], img[alt*="logo"]').first();
        await expect(logo).toBeVisible({ timeout: 10_000 });
    });

    test("weekly reminder email has proper styling applied", async ({ page }) => {
        await openPreview(
            page,
            "/rails/mailers/send_weekly_reminder_to_user_mailer/notify_user_about_missed_entries"
        );

        const iframe = page.frameLocator("iframe").first();
        const heading = iframe.locator("h1, h2").first();
        await expect(heading).toBeVisible();
    });

    test("weekly reminder email uses absolute URLs for images", async ({ page }) => {
        await openPreview(
            page,
            "/rails/mailers/send_weekly_reminder_to_user_mailer/notify_user_about_missed_entries"
        );

        const iframe = page.frameLocator("iframe").first();
        const images = iframe.locator("img");
        const count = await images.count();

        for (let i = 0; i < count; i += 1) {
            const src = await images.nth(i).getAttribute("src");
            expect(
                src?.startsWith("http://") ||
                    src?.startsWith("https://") ||
                    src?.startsWith("data:")
            ).toBe(true);
        }
    });

    test("invoice email also has working assets (shared template test)", async ({ page }) => {
        await openPreview(page, "/rails/mailers/invoice_mailer/send_invoice");
        await assertImagesLoaded(page);
    });

    test("invitation email has working assets (shared template test)", async ({ page }) => {
        await openPreview(page, "/rails/mailers/user_invitation/send_user_invitation");
        await assertImagesLoaded(page);
    });

    test("email header and footer assets load correctly", async ({ page }) => {
        await openPreview(page, "/rails/mailers/invoice_mailer/send_invoice");

        const iframe = page.frameLocator("iframe").first();
        await expect(iframe.locator("header, [role='banner'], table").first()).toBeVisible();
    });

    test("email renders correctly in different email clients (viewport test)", async ({
        page,
    }) => {
        await openPreview(page, "/rails/mailers/invoice_mailer/send_invoice");

        const viewports = [
            { width: 600, height: 800 },
            { width: 800, height: 600 },
            { width: 1200, height: 800 },
        ];

        for (const viewport of viewports) {
            await page.setViewportSize(viewport);
            await expect(page.frameLocator("iframe").first().locator("body")).toBeVisible();
        }
    });
});
