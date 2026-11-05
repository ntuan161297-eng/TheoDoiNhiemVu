import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/ui', fullyParallel: false, workers: 1, timeout: 60000,
  reporter: [['list']], outputDir: 'test-results',
  use: { baseURL: 'http://127.0.0.1:5173', headless: true, actionTimeout: 12000, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh',
    launchOptions: { executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' },
    screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 30000 },
});
