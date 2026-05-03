import { defineConfig, devices } from '@playwright/test';

// Playwright 設定: PC (Chromium) と iPad Safari (WebKit) を主要プロファイルとする。
// iPad Safari は 100vh ずれ (R-004) の検証に必須。
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-pc',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'webkit-ipad',
      use: { ...devices['iPad (gen 7)'] },
    },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
