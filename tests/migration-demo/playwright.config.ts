import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for insights-chrome
 * Migrated from IQE test_login.py
 *
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './playwright',

  /* Run tests in files in parallel locally, but serial in CI for stability */
  fullyParallel: !process.env.CI,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* No retries - tests should be deterministic */
  retries: 0,

  /* CRITICAL: Single worker in CI to avoid race conditions and flakiness */
  workers: process.env.CI ? 1 : undefined,

  /* Stop test run after 2 failures in CI to save resources */
  maxFailures: process.env.CI ? 2 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',

  /* Global setup for Red Hat SSO authentication */
  globalSetup: require.resolve('@redhat-cloud-services/playwright-test-auth/global-setup'),

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://stage.foo.redhat.com:1337',

    /* Ignore HTTPS errors in non-production environments */
    ignoreHTTPSErrors: true,

    /* Reuse authentication state from global setup */
    storageState: 'playwright/.auth/user.json',

    /* Collect trace on failure for debugging */
    trace: 'on-first-retry',

    /* Capture video on failure only (reduces CI artifacts) */
    video: 'retain-on-failure',

    /* Capture screenshot on failure only */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Timeout for each test */
  timeout: 120000,

  /* Timeout for each assertion */
  expect: {
    timeout: 10000,
  },
});
