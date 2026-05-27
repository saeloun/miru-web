import { Locator, Page, test } from "@playwright/test";
import {
    SEED_ROLE_USERS,
    SeedRole,
    expectHiddenHref,
    expectVisibleHref,
    goToAndExpectResolvedRoute,
    signInAsSeedUser,
} from "./helpers";

type MainRoute = {
    href: string;
    ready: (page: Page) => Locator;
    urlPattern: RegExp;
    allowedRoles: SeedRole[];
};

const MAIN_ROUTES: MainRoute[] = [
    {
        href: "/dashboard",
        ready: page => page.getByRole("heading", { name: /welcome back/i }),
        urlPattern: /\/dashboard$/,
        allowedRoles: ["owner", "admin", "book_keeper"],
    },
    {
        href: "/clients",
        ready: page => page.getByRole("heading", { name: "Clients", exact: true }),
        urlPattern: /\/clients(?:$|[/?#])/,
        allowedRoles: ["owner", "admin"],
    },
    {
        href: "/projects",
        ready: page => page.getByRole("heading", { name: "Projects", exact: true }),
        urlPattern: /\/projects(?:$|[/?#])/,
        allowedRoles: ["owner", "admin", "employee"],
    },
    {
        href: "/team",
        ready: page => page.getByRole("heading", { name: "Team", exact: true }),
        urlPattern: /\/team(?:$|[/?#])/,
        allowedRoles: ["owner", "admin"],
    },
    {
        href: "/time-tracking",
        ready: page => page.locator("[role='tablist']").first(),
        urlPattern: /\/time-tracking$/,
        allowedRoles: ["owner", "admin", "employee"],
    },
    {
        href: "/invoices",
        ready: page => page.locator("table").first(),
        urlPattern: /\/invoices(?:$|[/?#])/,
        allowedRoles: ["owner", "admin", "book_keeper", "client"],
    },
    {
        href: "/payments",
        ready: page => page.getByRole("heading", { name: /payment history/i }),
        urlPattern: /\/payments$/,
        allowedRoles: ["owner", "admin", "book_keeper"],
    },
    {
        href: "/reports",
        ready: page => page.getByRole("tab", { name: /all reports/i }),
        urlPattern: /\/reports(?:$|[/?#])/,
        allowedRoles: ["owner", "admin", "book_keeper"],
    },
    {
        href: "/expenses",
        ready: page => page.getByRole("heading", { name: "Expenses", exact: true }),
        urlPattern: /\/expenses(?:$|[/?#])/,
        allowedRoles: ["owner", "admin", "book_keeper", "employee"],
    },
];

const ROLES: SeedRole[] = [
    "owner",
    "admin",
    "book_keeper",
    "employee",
    "client",
];

test.describe("Navigation — Main Tab Role Matrix", () => {
    test.use({ storageState: undefined });

    for (const role of ROLES) {
        const user = SEED_ROLE_USERS[role];
        const allowedRoutes = MAIN_ROUTES.filter(route =>
            route.allowedRoles.includes(role),
        );
        const deniedRoutes = MAIN_ROUTES.filter(
            route => !route.allowedRoles.includes(role),
        );

        test(`${user.label} sees the correct main tabs`, async ({ page }) => {
            await signInAsSeedUser(page, role);

            for (const route of allowedRoutes) {
                await expectVisibleHref(page, route.href);
            }

            for (const route of deniedRoutes) {
                await expectHiddenHref(page, route.href);
            }
        });

        test(`${user.label} can open allowed main routes and is redirected away from denied ones`, async ({
            page,
        }) => {
            await signInAsSeedUser(page, role);

            for (const route of allowedRoutes) {
                await test.step(`allowed route ${route.href}`, async () => {
                    await goToAndExpectResolvedRoute(
                        page,
                        route.href,
                        route.urlPattern,
                        route.ready(page),
                    );
                });
            }

            for (const route of deniedRoutes) {
                await test.step(`denied route ${route.href}`, async () => {
                    await page.goto(route.href);
                    await page.waitForURL(user.defaultUrlPattern, {
                        timeout: 15_000,
                    });
                });
            }
        });
    }
});
