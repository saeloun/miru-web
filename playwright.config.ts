import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,  // Reduce retries from 2 to 1 for faster CI
  workers: process.env.CI ? 4 : undefined,  // Increase workers from 1 to 4 for parallel execution
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  timeout: 30000,  // 30 seconds per test
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    trace: process.env.CI ? 'off' : 'on-first-retry',  // Disable traces in CI for speed
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'off' : 'retain-on-failure',  // Disable video in CI for speed
    actionTimeout: 10000,  // 10 seconds for actions
    navigationTimeout: 20000,  // 20 seconds for navigation
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

  webServer: process.env.CI ? {
    command: 'bundle exec rails server -p 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,  // Allow reusing if server is already running
    timeout: 120 * 1000,
  } : {
    command: 'foreman start -f Procfile.dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});