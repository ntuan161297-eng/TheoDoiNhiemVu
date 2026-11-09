import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { localWorkerdEnvironment } from './local-workerd-runtime.mjs';

const root = new URL('../', import.meta.url);
const runtime = await localWorkerdEnvironment();
if (runtime.MINIFLARE_WORKERD_PATH) process.env.MINIFLARE_WORKERD_PATH = runtime.MINIFLARE_WORKERD_PATH;
process.env.WRANGLER_SEND_METRICS = 'false';
const { getPlatformProxy, unstable_readConfig } = await import('wrangler');
const configPath = fileURLToPath(new URL('wrangler.d1-local.jsonc', root));
const config = unstable_readConfig({ config: configPath }, { hideWarnings: true });
assert.equal(config.d1_databases.length, 1);
assert.equal(config.d1_databases[0].database_id, '00000000-0000-4000-8000-000000000001');
assert.equal(config.d1_databases[0].remote, false);
const proxy = await getPlatformProxy({
  configPath, remoteBindings: false, envFiles: [],
  persist: { path: fileURLToPath(new URL('.local/cloudflare/d1-local/v3', root)) },
});
try {
  const db = proxy.env.DB;
  const counts = {};
  for (const table of ['tenants', 'organization_units', 'leaders', 'task_sources', 'profiles', 'tenant_memberships', 'platform_admins', 'tasks', 'attachments', 'import_jobs', 'd1_migrations']) {
    counts[table] = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first('n');
  }
  const result = {
    engine: 'Cloudflare D1 local / workerd', localOnly: true, counts,
    foreignKeyViolations: (await db.prepare('PRAGMA foreign_key_check').all()).results,
  };
  await mkdir(new URL('.local/cloudflare/', root), { recursive: true });
  await writeFile(new URL('.local/cloudflare/d1-b1-local-catalog-check.json', root), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await proxy.dispose(); }
