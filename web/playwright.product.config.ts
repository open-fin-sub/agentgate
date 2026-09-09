import { defineConfig, devices } from '@playwright/test'

// Uses a separately started API, Celery worker and Redis with an isolated database.
// No response mocks in the primary product journey test.
export default defineConfig({
  testDir: './tests/product',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  outputDir: process.env.AGENTGATE_TEST_OUTPUT ?? './test-results/product',
  use: {
    baseURL: process.env.AGENTGATE_WEB_URL ?? 'http://127.0.0.1:15273',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
