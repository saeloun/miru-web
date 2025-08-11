// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Rails 8 Playwright Configuration
 * Modern system testing with Playwright for Miru Web application
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './spec/system',
  testMatch: '**/*_spec.rb',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'tmp/playwright-report' }],
    ['json', { outputFile: 'tmp/playwright-results.json' }],
    ['junit', { outputFile: 'tmp/playwright-junit.xml' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL for Rails application */
    baseURL: process.env.APP_HOST || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Browser viewport */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Wait for network idle */
    actionTimeout: 15000,
    navigationTimeout: 30000
  },

  /* Configure projects for major browsers */
  projects: [
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

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'bin/rails server -p 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      RAILS_ENV: 'test'
    }
  },
  
  /* Global setup and teardown */
  globalSetup: './spec/support/playwright_global_setup.js',
  globalTeardown: './spec/support/playwright_global_teardown.js',
  
  /* Output directories */
  outputDir: 'tmp/playwright-artifacts',
  
  /* Expect settings */
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 10000,
    /* Threshold for screenshot comparisons */
    threshold: 0.2,
  },
  
  /* Global timeout */
  timeout: 60000,
  
  /* Maximum number of test failures */
  maxFailures: process.env.CI ? 10 : undefined,
});