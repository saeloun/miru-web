import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,  // No retries for speed
  workers: process.env.CI ? 16 : 4,  // Maximum parallelization in CI
  reporter: process.env.CI ? [['dot']] : 'html',  // Minimal dot reporter for speed
  timeout: 15000,  // 15 seconds per test
  use: {
    baseURL: process.env.CI ? 'http://localhost:3000' : 'http://127.0.0.1:3000',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    actionTimeout: 10000,  // Increase to 10s for CI stability
    navigationTimeout: 15000,  // Increase to 15s for CI stability
    headless: true,
    ignoreHTTPSErrors: true,  // Skip SSL errors
    viewport: { width: 1280, height: 720 },  // Fixed viewport
  },

  projects: process.env.CI ? [
    // Only run Chromium in CI for speed
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-dev-shm-usage', '--no-sandbox'],  // Optimize for CI
        },
      },
    },
  ] : [
    // Run all browsers locally
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: process.env.CI ? undefined : {  // Don't start server in CI, it's already running
    command: 'foreman start -f Procfile.dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 60 * 1000,
  },
});