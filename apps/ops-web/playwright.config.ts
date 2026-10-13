// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/playwright/specs',
  timeout: 30_000,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }]
  ],
  use: {
    baseURL: process.env.API_BASE_URL || 'http://localhost:8082',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 10_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8082',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
