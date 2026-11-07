// Offline config gate for Stage A. This does not verify Cloudflare Dashboard state.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { unstable_readConfig } from 'wrangler';

const configPath = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url));
const version = JSON.parse(await readFile(new URL('../node_modules/wrangler/package.json', import.meta.url), 'utf8')).version;
const parts = version.split('.').map(Number);
assert(parts[0] > 4 || (parts[0] === 4 && parts[1] >= 135), 'Worker Previews requires Wrangler >= 4.135.0.');
const config = unstable_readConfig({ config: configPath }, { hideWarnings: true });
assert.equal(config.name, 'theodoinhiemvu', 'Keep the existing parent Worker name.');
assert(config.main?.replaceAll('\\', '/').endsWith('/worker/index.ts'), 'Worker entry is required.');
assert.equal(config.assets?.binding, 'ASSETS');
assert.equal(config.assets?.not_found_handling, 'single-page-application');
assert.deepEqual(config.assets?.run_worker_first, ['/api', '/api/*']);
assert(config.previews, 'A previews block is required; env.preview is not Worker Previews.');
assert.deepEqual(config.previews.vars, { APP_ENV: 'preview' });
assert.deepEqual(config.previews.d1_databases, [], 'Stage A must not connect D1.');
assert.deepEqual(config.previews.r2_buckets, [], 'Stage A must not connect R2.');
for (const key of Object.keys(config.previews)) {
  assert(['vars', 'd1_databases', 'r2_buckets'].includes(key), `Stage A Preview setting requires review: ${key}`);
}
assert.equal(config.d1_databases.length, 0, 'Stage A has no production D1 binding.');
assert.equal(config.r2_buckets.length, 0, 'Stage A has no production R2 binding.');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(pkg.scripts['preview:worker'], 'npm run check:preview && node scripts/wrangler-local.mjs preview --ignore-base-config');
console.log(JSON.stringify({
  wrangler: version, worker: config.name, previewMode: 'Worker Previews',
  previewVars: config.previews.vars, databaseBindings: 0, storageBindings: 0,
  ignoreBaseConfigOnCreation: true, dashboardVerified: false,
  note: 'Offline checks only. Verify Builds, account, and any existing Preview secrets before pushing/deploying.',
}, null, 2));
