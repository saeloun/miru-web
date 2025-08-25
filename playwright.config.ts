import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0,  // No retries for maximum speed
  workers: process.env.CI ? 8 : 4,  // Use 8 workers in CI, 4 locally
  reporter: process.env.CI ? [['line']] : 'html',  // Minimal reporter in CI
  timeout: 20000,  // 20 seconds per test (reduced from 30)
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    trace: 'off',  // Disable traces completely for speed
    screenshot: process.env.CI ? 'off' : 'only-on-failure',  // No screenshots in CI
    video: 'off',  // Disable video completely for speed
    actionTimeout: 5000,  // 5 seconds for actions (reduced from 10)
    navigationTimeout: 10000,  // 10 seconds for navigation (reduced from 20)
    headless: true,  // Always run headless for speed
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
    command: 'bundle exec rails server -p 3000 -e test',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 60 * 1000,  // Reduced to 60 seconds
    stdout: 'pipe',
    stderr: 'pipe',
  } : {
    command: 'foreman start -f Procfile.dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 60 * 1000,
  },
});