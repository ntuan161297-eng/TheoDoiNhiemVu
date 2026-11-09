import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { d1TestTarget, validateTestTooling, validateRemoteIdentity } from './d1-test-target.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = fileURLToPath(new URL('../wrangler.d1-test.jsonc', import.meta.url));
const runner = fileURLToPath(new URL('./wrangler-local.mjs', import.meta.url));
const evidence = new URL('../.local/cloudflare/b1-2-remote/', import.meta.url);
const exec = promisify(execFile);
const action = process.argv[2] ?? 'verify-empty';
assert(['verify-empty', 'apply-approved-b1', 'inspect'].includes(action) && process.argv.length <= 3, 'Unknown action/arguments.');
await mkdir(evidence, { recursive: true });
const review = JSON.parse(await readFile(new URL('../docs/qa/D1_B1_RESULTS.json', import.meta.url), 'utf8'));
const configData = JSON.parse(await readFile(config, 'utf8'));
validateTestTooling(configData);
assert.equal(review.migrations.length, 5);
assert.equal(review.tables.length, 20);
assert.equal((await readdir(new URL('../cloudflare/d1/migrations/', import.meta.url))).filter(x => x.endsWith('.sql')).length, 5);
const migrations = [];
for (const item of review.migrations) {
  const data = await readFile(new URL('../' + item.file, import.meta.url));
  const hash = createHash('sha256').update(data).digest('hex');
  assert.equal(hash, item.sha256, `Migration changed after B1 tests: ${item.file}`);
  migrations.push({ name: item.file.split('/').at(-1), sha256: hash });
}
let counter = 0;
async function cli(args, tag, json = true) {
  // Every invocation carries the dedicated config. No default config or env selection.
  validateTestTooling(JSON.parse(await readFile(config, 'utf8')));
  let result;
  for (let attempt = 0; ; attempt++) {
    try {
      result = await exec(process.execPath, [runner, ...args, '--config', config, ...(json ? ['--json'] : [])], {
        cwd: root, env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: 'true' },
        windowsHide: true, maxBuffer: 8 * 1024 * 1024, timeout: 180000,
      });
      break;
    } catch (error) {
      const detail = String(error.stdout ?? '') + String(error.stderr ?? '') + '\n' + error.message;
      await writeFile(new URL(`${++counter}-${action}-${tag}-error.log`, evidence), detail);
      // Only read-only info/verification calls may retry a transient transport
      // failure. Never retry migrations: a failed write needs operator review.
      if (!json || attempt >= 2 || !/fetch failed|connect.?timeout|ECONNRESET|ETIMEDOUT/i.test(detail)) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  await writeFile(new URL(`${++counter}-${action}-${tag}.log`, evidence), result.stdout + result.stderr);
  return json ? JSON.parse(result.stdout) : result.stdout;
}
async function identity() {
  const info = await cli(['d1', 'info', d1TestTarget.database_id], 'database-info');
  validateRemoteIdentity(info);
  return info;
}
async function query(sql, tag) {
  assert(/^\s*(SELECT|PRAGMA\s+(foreign_key_check|quick_check|integrity_check)\b)/i.test(sql), 'Only fixed verification reads are allowed here.');
  const result = await cli(['d1', 'execute', 'DB', '--remote', '--command', sql], tag);
  assert(Array.isArray(result) && result.every(x => x.success !== false), 'D1 verification query failed.');
  return result;
}
async function empty() {
  const info = await identity();
  assert.equal(info.num_tables, 0, 'Database is not empty. No migration was started.');
  const schema = await query("SELECT type,name FROM sqlite_schema WHERE type IN ('table','view','trigger') AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_cf_*' ORDER BY type,name;", 'empty-schema');
  assert.deepEqual(schema[0].results, [], 'Application objects or migration ledger already exist. Stop before writing.');
  const check = await query('PRAGMA quick_check;', 'empty-quick-check');
  assert.deepEqual(check[0].results, [{ quick_check: 'ok' }]);
  const result = { target: d1TestTarget, verifiedAt: new Date().toISOString(), info, applicationObjects: [], quickCheck: check[0].results, migrations };
  await writeFile(new URL('verified-empty.json', evidence), JSON.stringify(result, null, 2));
  return result;
}
async function inspect() {
  const info = await identity();
  assert(review.tables.every(x => /^[a-z_]+$/.test(x)));
  const catalogSpecs = [
    ['don_vi_duoc_giao.csv', 'organization_units', ['code', 'name', 'unit_kind', 'sort_order', 'is_active']],
    ['lanh_dao_chi_dao.csv', 'leaders', ['code', 'full_name', 'position_name', 'sort_order', 'is_active']],
    ['nguon_nhiem_vu.csv', 'task_sources', ['code', 'name', 'sort_order', 'is_active']],
  ];
  // One read request for all supported verification statements. This avoids
  // repeated network setup and does not change or re-run any migration.
  const statements = [
    "SELECT type,name FROM sqlite_schema WHERE type IN ('table','view','trigger','index') AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_cf_*' ORDER BY type,name",
    'SELECT name FROM d1_migrations ORDER BY id',
    'SELECT ' + review.tables.map(x => `(SELECT COUNT(*) FROM ${x}) AS "${x}"`).join(','),
    'SELECT id,code,name FROM tenants',
    ...catalogSpecs.map(([, table, columns]) => `SELECT ${columns.join(',')} FROM ${table} WHERE tenant_id='tenant-huong-do' ORDER BY sort_order`),
    'PRAGMA foreign_key_check', 'PRAGMA quick_check',
  ];
  const batch = await query(statements.join(';\n') + ';', 'post-migration-batch');
  assert.equal(batch.length, statements.length, 'Missing verification result sets.');
  const objects = batch[0].results;
  const applicationTables = objects.filter(x => x.type === 'table' && x.name !== 'd1_migrations').map(x => x.name).sort();
  assert.deepEqual(applicationTables, [...review.tables].sort());
  const history = batch[1].results;
  assert.deepEqual(history.map(x => x.name), migrations.map(x => x.name));
  const expectedCounts = { tenants: 1, organization_units: 11, leaders: 3, task_sources: 3, audit_logs: 1 };
  const counts = Object.entries(batch[2].results[0]).map(([table_name, n]) => ({ table_name, n }));
  for (const row of counts) assert.equal(row.n, expectedCounts[row.table_name] ?? 0, `Unexpected records in ${row.table_name}`);
  const tenants = batch[3].results;
  assert.deepEqual(tenants, [{ id: 'tenant-huong-do', code: 'HUONG_DO', name: 'UBND xã Hương Đô' }]);
  const catalogChecks = [];
  for (const [index, [file, table, columns]] of catalogSpecs.entries()) {
    const csv = (await readFile(new URL('../docs/product/seed/' + file, import.meta.url), 'utf8')).replace(/^\uFEFF/, '').trim().split(/\r?\n/);
    const header = csv.shift().split(',');
    const rows = batch[4 + index].results;
    assert.equal(rows.length, csv.length);
    for (const line of csv) {
      const cells = line.split(','); const row = rows.find(x => x.code === cells[0]); assert(row);
      for (const key of columns) assert.equal(String(row[key]), cells[header.indexOf(key)], `${table}.${key}`);
    }
    catalogChecks.push({ table, records: rows.length, matchesOfficialCsv: true });
  }
  const requiredTriggers = [];
  const requiredIndexes = [];
  for (const item of review.migrations) {
    const sql = await readFile(new URL('../' + item.file, import.meta.url), 'utf8');
    requiredTriggers.push(...[...sql.matchAll(/CREATE TRIGGER (\w+)/g)].map(x => x[1]));
    requiredIndexes.push(...[...sql.matchAll(/CREATE (?:UNIQUE )?INDEX (\w+)/g)].map(x => x[1]));
  }
  for (const name of requiredTriggers) assert(objects.some(x => x.type === 'trigger' && x.name === name), `Missing trigger ${name}`);
  for (const name of requiredIndexes) assert(objects.some(x => x.type === 'index' && x.name === name), `Missing index ${name}`);
  assert(objects.some(x => x.type === 'view' && x.name === 'v_tasks_effective'));
  const foreignKeyCheck = batch[7].results;
  assert.deepEqual(foreignKeyCheck, []);
  const quickCheck = batch[8].results;
  assert.deepEqual(quickCheck, [{ quick_check: 'ok' }]);
  let integrityCheck;
  try {
    const rows = (await query('PRAGMA integrity_check;', 'integrity-check'))[0].results;
    integrityCheck = { status: rows.length === 1 && Object.values(rows[0])[0] === 'ok' ? 'ok' : 'unexpected-result', results: rows };
  } catch (error) {
    // No further writes. Record the actual platform response; never call this a pass.
    const message = String(error.stderr?.trim() || error.stdout?.trim() || error.message).slice(0, 5000);
    integrityCheck = { status: 'not-completed', error: message };
    await writeFile(new URL('integrity-check-error.log', evidence), message);
  }
  const result = {
    target: d1TestTarget, inspectedAt: new Date().toISOString(), info, applicationTables, migrationHistory: history,
    counts, tenants, catalogChecks, triggerCount: requiredTriggers.length, explicitIndexCount: requiredIndexes.length,
    foreignKeyCheck, quickCheck, integrityCheck, noTasksOrProfilesOrTenantAB: true,
  };
  await writeFile(new URL('post-migration.json', evidence), JSON.stringify(result, null, 2));
  return result;
}

try {
  if (action === 'verify-empty') {
    const result = await empty(); console.log(JSON.stringify({ action, target: result.target, verifiedEmpty: true, quickCheck: result.quickCheck }));
  } else if (action === 'apply-approved-b1') {
    await empty();
    console.log('Verified approved TEST UUID/name and empty schema. Applying exactly five reviewed migrations.');
    const output = await cli(['d1', 'migrations', 'apply', 'DB', '--remote'], 'migration-apply', false);
    console.log(output);
    console.log(JSON.stringify(await inspect(), null, 2));
  } else { console.log(JSON.stringify(await inspect(), null, 2)); }
} catch (error) {
  const result = { action, target: d1TestTarget, status: 'stopped', error: String(error.stderr?.trim() || error.stdout?.trim() || error.message).slice(0, 8000), at: new Date().toISOString() };
  await writeFile(new URL('stopped.json', evidence), JSON.stringify(result, null, 2));
  console.error(JSON.stringify(result, null, 2)); process.exitCode = 1;
}
