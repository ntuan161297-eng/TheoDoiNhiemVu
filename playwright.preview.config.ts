import { defineConfig } from '@playwright/test';
import worker from './playwright.worker.config';

const input = process.env.WORKER_PREVIEW_URL;
if (!input) throw new Error('Set WORKER_PREVIEW_URL to the actual isolated Worker Preview URL first.');
const url = new URL(input);
if (url.protocol !== 'https:' || !url.hostname.endsWith('.workers.dev')
  || url.hostname === 'theodoinhiemvu.ntuan161297.workers.dev'
  || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
  throw new Error('Use an HTTPS workers.dev Preview origin; Production is not allowed.');
}
process.env.UI_QA_OUTPUT_DIR = '.local/cloudflare/preview-qa';
export default defineConfig({
  ...worker,
  use: { ...worker.use, baseURL: url.origin },
  webServer: undefined,
  outputDir: '.local/cloudflare/preview-test-results',
});
