import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: true,
    retries: 1,
    workers: undefined, // auto-detect: half your CPU cores
    reporter: [["html", { open: "never" }], ["list"]],
    use: {
        baseURL: "http://127.0.0.1:3000",
        headless: true,
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
        actionTimeout: 10_000,
    },
    projects: [
        {
            name: "setup",
            testMatch: /global-setup\.ts/,
        },
        {
            name: "invoices",
            testMatch: /invoices\/.+\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "projects",
            testDir: "./e2e/projects",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "time-tracking",
            testDir: "./e2e/time-tracking",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "clients",
            testDir: "./e2e/clients",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "dashboard",
            testDir: "./e2e/dashboard",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "public-forms",
            testDir: "./e2e/public-forms",
            testMatch: /\.spec\.ts/,
        },
        {
            name: "team",
            testDir: "./e2e/team",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "navigation",
            testDir: "./e2e/navigation",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            workers: 1,
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "payments",
            testDir: "./e2e/payments",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
                viewport: { width: 1280, height: 800 },
            },
        },
        {
            name: "notifications",
            testDir: "./e2e/notifications",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            workers: 1,
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "reports",
            testDir: "./e2e/reports",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "expenses",
            testDir: "./e2e/expenses",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-holidays",
            testDir: "./e2e/settings-holidays",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-organization",
            testDir: "./e2e/settings-organization",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-billing",
            testDir: "./e2e/settings-billing",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-bank-info",
            testDir: "./e2e/settings-bank-info",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-profile",
            testDir: "./e2e/settings-profile",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-preferences",
            testDir: "./e2e/settings-preferences",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-devices",
            testDir: "./e2e/settings-devices",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-leaves",
            testDir: "./e2e/settings-leaves",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "analytics",
            testDir: "./e2e/analytics",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-payment",
            testDir: "./e2e/settings-payment",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-tax",
            testDir: "./e2e/settings-tax",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-automation",
            testDir: "./e2e/settings-automation",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
        {
            name: "settings-employment",
            testDir: "./e2e/settings-employment",
            testMatch: /\.spec\.ts/,
            dependencies: ["setup"],
            use: {
                storageState: "e2e/.auth/admin.json",
            },
        },
    ],
});
