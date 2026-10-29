import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:3000', launchOptions: { executablePath: process.env.PLAYWRIGHT_BUNDLED ? undefined : (process.env.CHROMIUM_PATH || '/usr/bin/chromium'), args: ['--no-sandbox'] } },
  webServer: { command: 'npm run start', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, timeout: 60000 }
});
