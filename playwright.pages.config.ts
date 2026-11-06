import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Reuse the full existing UI suite without overwriting approved screenshots.
process.env.UI_QA_OUTPUT_DIR = '.local/cloudflare/qa';
export default defineConfig({
  ...base,
  testDir: './tests',
  testMatch: ['ui/**/*.spec.ts', 'pages/**/*.spec.ts'],
  outputDir: '.local/cloudflare/test-results',
  use: { ...base.use, baseURL: 'http://127.0.0.1:8788' },
  webServer: {
    command: 'npm run pages:serve',
    url: 'http://127.0.0.1:8788/api/health',
    reuseExistingServer: true,
    timeout: 45000,
  },
});
