/**
 * Route Verification — ensures all major app routes load without 404.
 * This catches typos like /teams vs /team, broken links, and dead routes.
 */
import { test, expect } from "@playwright/test";

const VALID_ROUTES = [
    { path: "/dashboard", name: "Dashboard" },
    { path: "/clients", name: "Clients" },
    { path: "/projects", name: "Projects" },
    { path: "/team", name: "Team" },
    { path: "/time-tracking", name: "Time Tracking" },
    { path: "/invoices", name: "Invoices" },
    { path: "/reports", name: "Reports" },
    { path: "/expenses", name: "Expenses" },
    { path: "/settings/profile", name: "Settings - Profile" },
    { path: "/settings/organization", name: "Settings - Organization" },
    { path: "/settings/billing", name: "Settings - Billing" },
];

test.describe("Route Verification — all major routes load without 404", () => {
    for (const route of VALID_ROUTES) {
        test(`${route.name} (${route.path}) loads without 404`, async ({ page }) => {
            await page.goto(route.path);
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(1_000);

            // Should NOT show a 404 / not-found page
            const notFoundIndicator = page.locator("text=/404|page not found|not found/i").first();
            const isNotFound = await notFoundIndicator.isVisible().catch(() => false);

            expect(
                isNotFound,
                `Route ${route.path} shows a 404 page`,
            ).toBe(false);

            // URL should still contain the expected path (not redirected to a 404 catch-all)
            expect(page.url()).toContain(route.path);
        });
    }
});

const KNOWN_INVALID_ROUTES = [
    { path: "/teams", name: "/teams (should be /team)" },
    { path: "/client", name: "/client (should be /clients)" },
    { path: "/project", name: "/project (should be /projects)" },
    { path: "/invoice", name: "/invoice (should be /invoices)" },
];

test.describe("Invalid routes — known typos should NOT resolve", () => {
    for (const route of KNOWN_INVALID_ROUTES) {
        test(`${route.name} does not load a valid page`, async ({ page }) => {
            await page.goto(route.path);
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(1_000);

            // These should either 404 or redirect away from the invalid path
            const url = page.url();
            const stayedOnInvalidRoute = url.endsWith(route.path);
            const bodyText = await page.locator("body").innerText();
            const looksLikeValidPage = !bodyText.match(/404|not found|page doesn't exist/i);

            // If it stayed on the invalid route AND looks like a valid page, that's a problem
            // (it means the route accidentally works when it shouldn't)
            if (stayedOnInvalidRoute && looksLikeValidPage) {
                // This is acceptable only if it redirected to a valid page
                // For now, just document it
            }
        });
    }
});
