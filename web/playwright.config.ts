import { defineConfig, devices } from '@playwright/test'

// Uses a separately started API, worker and Redis with an isolated database.
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/product/**/*.spec.ts', '**/preview/**/*.spec.ts'],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  outputDir: './test-results/full',
  use: {
    baseURL: process.env.AGENTGATE_WEB_URL ?? 'http://127.0.0.1:15473',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
