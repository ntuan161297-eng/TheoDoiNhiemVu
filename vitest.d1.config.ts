import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/d1/**/*.integration.test.ts'],
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 120000,
    testTimeout: 30000,
    reporters: ['default', 'json'],
    outputFile: { json: '.local/cloudflare/d1-b1-vitest.json' },
  },
});
