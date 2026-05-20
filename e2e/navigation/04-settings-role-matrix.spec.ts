import { Locator, Page, test } from "@playwright/test";
import {
    SEED_ROLE_USERS,
    SeedRole,
    expectHiddenHref,
    expectVisibleHref,
    goToAndExpectResolvedRoute,
    signInAsSeedUser,
} from "./helpers";

type SettingsNavItem = {
    href: string;
    visibleRoles: SeedRole[];
};

type SettingsRoute = {
    href: string;
    ready: (page: Page) => Locator;
    urlPattern: RegExp;
    allowedRoles: SeedRole[];
};

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
    {
        href: "/settings/profile",
        visibleRoles: ["owner", "admin", "book_keeper", "employee", "client"],
    },
    {
        href: "/settings/preferences",
        visibleRoles: ["owner", "admin", "book_keeper", "employee"],
    },
    {
        href: "/settings/devices",
        visibleRoles: ["owner", "admin"],
    },
    {
        href: "/settings/leaves",
        visibleRoles: ["owner", "admin", "employee"],
    },
    {
        href: "/settings/bank-info",
        visibleRoles: ["owner", "admin"],
    },
    {
        href: "/settings/holidays",
        visibleRoles: ["owner", "admin", "employee"],
    },
    {
        href: "/settings/organization",
        visibleRoles: ["owner", "admin"],
    },
    {
        href: "/settings/payment",
        visibleRoles: ["owner", "admin"],
    },
    {
        href: "/settings/billing",
        visibleRoles: ["owner", "admin"],
    },
];

const SETTINGS_ROUTES: SettingsRoute[] = [
    {
        href: "/settings/profile",
        ready: page => page.getByText(/personal information/i).first(),
        urlPattern: /\/settings\/profile$/,
        allowedRoles: ["owner", "admin", "book_keeper", "employee", "client"],
    },
    {
        href: "/settings/employment",
        ready: page => page.getByRole("heading", { name: /employment details/i }),
        urlPattern: /\/settings\/employment$/,
        allowedRoles: ["owner", "admin", "book_keeper", "employee"],
    },
    {
        href: "/settings/devices",
        ready: page => page.getByText(/edit devices|add devices/i).first(),
        urlPattern: /\/settings\/devices$/,
        allowedRoles: ["owner", "admin", "book_keeper", "employee"],
    },
    {
        href: "/settings/notifications",
        ready: page => page.getByText(/email notifications/i).first(),
        urlPattern: /\/settings\/notifications$/,
        allowedRoles: ["owner", "admin", "book_keeper", "employee"],
    },
    {
        href: "/settings/preferences",
        ready: page => page.getByRole("heading", { name: /preferences/i }).first(),
        urlPattern: /\/settings\/preferences$/,
        allowedRoles: ["owner", "admin", "book_keeper", "employee"],
    },
    {
        href: "/settings/automation",
        ready: page => page.getByText(/free for every plan/i).first(),
        urlPattern: /\/settings\/automation$/,
        allowedRoles: ["owner", "admin", "book_keeper", "employee", "client"],
    },
    {
        href: "/settings/organization",
        ready: page => page.getByText(/company profile/i).first(),
        urlPattern: /\/settings\/organization$/,
        allowedRoles: ["owner", "admin"],
    },
    {
        href: "/settings/bank-info",
        ready: page => page.locator("input[aria-label='Bank Name']"),
        urlPattern: /\/settings\/organization\/edit#bank-info$/,
        allowedRoles: ["owner", "admin"],
    },
    {
        href: "/settings/leaves",
        ready: page => page.getByText(/leave calendar/i).first(),
        urlPattern: /\/settings\/leaves$/,
        allowedRoles: ["owner", "admin", "employee"],
    },
    {
        href: "/settings/holidays",
        ready: page => page.getByText(/public holidays/i).first(),
        urlPattern: /\/settings\/holidays$/,
        allowedRoles: ["owner", "admin", "employee"],
    },
    {
        href: "/settings/payment",
        ready: page => page.getByRole("heading", { name: /payment settings/i }),
        urlPattern: /\/settings\/payment$/,
        allowedRoles: ["owner", "admin"],
    },
    {
        href: "/settings/billing",
        ready: page => page.getByText(/membership/i).first(),
        urlPattern: /\/settings\/billing$/,
        allowedRoles: ["owner", "admin"],
    },
];

const ROLES: SeedRole[] = [
    "owner",
    "admin",
    "book_keeper",
    "employee",
    "client",
];

test.describe("Navigation — Settings Role Matrix", () => {
    test.use({ storageState: undefined });

    for (const role of ROLES) {
        const user = SEED_ROLE_USERS[role];
        const visibleTabs = SETTINGS_NAV_ITEMS.filter(item =>
            item.visibleRoles.includes(role),
        );
        const hiddenTabs = SETTINGS_NAV_ITEMS.filter(item =>
            !item.visibleRoles.includes(role),
        );

        test(`${user.label} sees the correct settings tabs`, async ({ page }) => {
            await signInAsSeedUser(page, role);
            await goToAndExpectResolvedRoute(
                page,
                "/settings/profile",
                /\/settings\/profile$/,
                SETTINGS_ROUTES[0].ready(page),
            );

            for (const item of visibleTabs) {
                await expectVisibleHref(page, item.href);
            }

            for (const item of hiddenTabs) {
                await expectHiddenHref(page, item.href);
            }
        });

        test(`${user.label} can open allowed settings routes and is blocked from denied ones`, async ({
            page,
        }) => {
            await signInAsSeedUser(page, role);

            for (const route of SETTINGS_ROUTES) {
                if (route.allowedRoles.includes(role)) {
                    await test.step(`allowed route ${route.href}`, async () => {
                        await goToAndExpectResolvedRoute(
                            page,
                            route.href,
                            route.urlPattern,
                            route.ready(page),
                        );
                    });
                    continue;
                }

                await test.step(`denied route ${route.href}`, async () => {
                    await page.goto(route.href, {
                        waitUntil: "domcontentloaded",
                    }).catch(() => {});
                    await page.waitForURL(/\/error$/, { timeout: 15_000 });
                });
            }
        });
    }
});
