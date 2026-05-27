import { expect, test } from "@playwright/test";

const articleUrl = "https://miru.so/blog/miru-3-0/";

function escapeAttribute(value: string) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("Miru 3.0 blog article", () => {
    test("renders the article shell and key calls to action", async ({
        page,
    }) => {
        await page.goto(articleUrl);

        await expect(page).toHaveTitle(/Introducing Miru 3\.0 \| Miru/);
        await expect(
            page.getByRole("heading", { name: /introducing miru 3\.0/i }),
        ).toBeVisible();
        await expect(page.getByText(/on this page/i)).toBeVisible();
        await expect(
            page.locator('a[href="https://app.miru.so"]').first(),
        ).toBeVisible();
        await expect(page.locator('a[href="/docs"]').first()).toBeVisible();
        await expect(
            page.locator('a[href="https://github.com/saeloun/miru-web"]').first(),
        ).toBeVisible();
        await expect(page.locator('a[href*="twitter.com/intent/tweet"]').first()).toBeVisible();
        await expect(
            page.locator('a[href*="linkedin.com/sharing/share-offsite"]').first(),
        ).toBeVisible();
    });

    test("all visible links resolve to valid destinations and section anchors scroll", async ({
        page,
    }) => {
        await page.goto(articleUrl);

        const links = await page.locator("main a[href]").evaluateAll(anchors =>
            anchors
                .filter(anchor => anchor.getClientRects().length > 0)
                .map(anchor => ({
                    href: anchor.getAttribute("href") || "",
                    target: anchor.getAttribute("target") || "",
                    text: (anchor.textContent || "").replace(/\s+/g, " ").trim(),
                }))
                .filter(link => link.href.length > 0)
        );

        const uniqueLinks = Array.from(
            new Map(
                links
                    .filter(link => link.href !== "#main-content")
                    .map(link => [link.href, link]),
            ).values(),
        );

        expect(uniqueLinks.length).toBeGreaterThan(0);

        for (const { href, target, text } of uniqueLinks) {
            await page.goto(articleUrl);

            const link = page.locator(`a[href="${escapeAttribute(href)}"]:visible`).first();
            await expect(link, `Missing link for "${text}" -> ${href}`).toBeVisible();

            if (href.startsWith("#")) {
                await link.click({ force: true });
                await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}$`));

                const targetId = href.slice(1);
                await expect(
                    page.locator(`[id="${escapeAttribute(targetId)}"]`),
                ).toBeInViewport();
                continue;
            }

            if (target === "_blank") {
                await link.click({ force: true, noWaitAfter: true });
                continue;
            }

            await Promise.all([
                page.waitForNavigation({ waitUntil: "domcontentloaded" }),
                link.click(),
            ]);

            await expect(page).toHaveURL(
                new RegExp(escapeRegExp(new URL(href, articleUrl).href)),
            );
        }
    });
});
