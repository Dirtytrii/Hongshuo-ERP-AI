import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // 使用 build+preview 替代 dev server，避免 HMR overlay / esbuild service 崩溃导致 E2E 不稳定
    command: 'npm run build && npm run preview -- --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 180000,
  },
});
