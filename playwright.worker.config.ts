import { defineConfig } from '@playwright/test';
import base from './playwright.config';

process.env.UI_QA_OUTPUT_DIR = '.local/cloudflare/worker-qa';
export default defineConfig({
  ...base,
  testDir: './tests',
  testMatch: ['ui/**/*.spec.ts', 'worker/**/*.spec.ts'],
  outputDir: '.local/cloudflare/worker-test-results',
  use: { ...base.use, baseURL: 'http://127.0.0.1:8788' },
  webServer: {
    command: 'npm run worker:serve',
    url: 'http://127.0.0.1:8788/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
