import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/preview',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  outputDir: './test-results/preview',
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
