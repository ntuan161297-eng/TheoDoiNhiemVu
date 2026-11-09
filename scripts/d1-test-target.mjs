import assert from 'node:assert/strict';

// Operator-approved TEST identity. A database UUID is not an authentication secret.
export const d1TestTarget = Object.freeze({
  binding: 'DB',
  database_name: 'theodoinhiemvu-d1-test',
  database_id: '649fd0db-7fd3-4551-bfac-f3fccc408373',
  migrations_dir: 'cloudflare/d1/migrations',
});

export function validateTestBinding(binding) {
  assert(binding && typeof binding === 'object', 'Missing TEST binding.');
  for (const [key, value] of Object.entries(d1TestTarget)) assert.equal(binding[key], value, `Unexpected TEST ${key}. Stop before writing.`);
  assert(!Object.hasOwn(binding, 'preview_database_id'), 'Legacy preview_database_id is not allowed.');
}

export function validateTestTooling(config) {
  assert.equal(config.name, 'theodoinhiemvu-d1-test-tooling');
  assert.equal(config.workers_dev, false);
  assert.equal(config.d1_databases?.length, 1);
  assert(!config.env && !config.previews && !config.assets && !config.routes && !config.route,
    'Use the dedicated D1 TEST config, not a Worker deployment config.');
  validateTestBinding(config.d1_databases[0]);
}

export function validateRemoteIdentity(info) {
  assert.equal(info.uuid, d1TestTarget.database_id, 'Remote database UUID mismatch. Stop before writing.');
  assert.equal(info.name, d1TestTarget.database_name, 'Remote database name mismatch. Stop before writing.');
}

export function validatePreviewBindings(config) {
  assert.equal((config.d1_databases ?? []).length, 0, 'Production must remain without a D1 binding.');
  assert.equal((config.r2_buckets ?? []).length, 0, 'No Production R2 binding in B1.2.');
  assert.equal(config.previews?.d1_databases?.length, 1, 'Preview must contain exactly one approved TEST binding.');
  assert.equal((config.previews.r2_buckets ?? []).length, 0, 'No Preview R2 binding in B1.2.');
  validateTestBinding(config.previews.d1_databases[0]);
}
