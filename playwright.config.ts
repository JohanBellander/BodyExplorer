import { defineConfig } from '@playwright/test';

const PORT = 4100;

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 60_000 },
  use: {
    baseURL: `http://localhost:${PORT}/`,
    // Uses the locally installed Chrome so no extra browser download is needed.
    // In CI, run `npx playwright install chromium` and set PW_CHANNEL=chromium.
    channel: process.env.PW_CHANNEL ?? 'chrome',
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ['--use-angle=default', '--enable-gpu'] },
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort --open false`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
