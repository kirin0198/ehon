import { defineConfig, devices } from '@playwright/test';

// Playwright 設定: PC (Chromium) と iPad Safari (WebKit) を主要プロファイルとする。
// iPad Safari は 100vh ずれ (R-004) の検証に必須。
//
// PLAYWRIGHT_BASE_URL を指定すると外部サーバ (例: docker compose の dev サービス)
// に対して実行し、内蔵 webServer は起動しない。
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // RTL ブランチデバッグ用に retries=0 / trace=retain-on-failure に一時変更 (CI artifact 取得のため)
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  ...(externalBaseURL
    ? {}
    : {
        webServer: {
          command: 'npm run dev -- --port 5173',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
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
