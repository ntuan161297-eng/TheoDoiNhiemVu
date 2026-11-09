import { describe, expect, it } from 'vitest';
// @ts-expect-error Node tooling intentionally uses the shared JS target guard.
import { d1TestTarget, validateTestBinding, validateTestTooling, validateRemoteIdentity, validatePreviewBindings } from '../../scripts/d1-test-target.mjs';

const tooling = () => ({ name: 'theodoinhiemvu-d1-test-tooling', workers_dev: false, d1_databases: [{ ...d1TestTarget }] });
describe('B1.2 remote target allowlist', () => {
  it('accepts only the approved TEST UUID, exact name and DB binding', () => {
    expect(() => validateTestTooling(tooling())).not.toThrow();
    expect(() => validateRemoteIdentity({ uuid: d1TestTarget.database_id, name: d1TestTarget.database_name })).not.toThrow();
  });
  it('rejects any different UUID before a remote operation', () => {
    expect(() => validateTestBinding({ ...d1TestTarget, database_id: '00000000-0000-4000-8000-000000000001' })).toThrow();
    expect(() => validateRemoteIdentity({ uuid: 'production-fixture-uuid', name: d1TestTarget.database_name })).toThrow();
  });
  it('rejects a similarly named database or a legacy preview UUID override', () => {
    expect(() => validateTestBinding({ ...d1TestTarget, database_name: 'theodoinhiemvu-test' })).toThrow();
    expect(() => validateRemoteIdentity({ uuid: d1TestTarget.database_id, name: 'production-fixture-name' })).toThrow();
    expect(() => validateTestBinding({ ...d1TestTarget, preview_database_id: 'other-fixture-uuid' })).toThrow();
  });
  it('rejects default Worker configs or multiple database targets', () => {
    expect(() => validateTestTooling({ ...tooling(), name: 'theodoinhiemvu' })).toThrow();
    expect(() => validateTestTooling({ ...tooling(), d1_databases: [d1TestTarget, d1TestTarget] })).toThrow();
    expect(() => validateTestTooling({ ...tooling(), assets: { directory: './dist' } })).toThrow();
    expect(() => validateTestTooling({ ...tooling(), env: { production: {} } })).toThrow();
  });
  it('rejects an alternate binding or migrations directory', () => {
    expect(() => validateTestBinding({ ...d1TestTarget, binding: 'PRODUCTION_DB' })).toThrow();
    expect(() => validateTestBinding({ ...d1TestTarget, migrations_dir: 'supabase/migrations' })).toThrow();
  });
  it('permits TEST in previews only, refusing any Production binding or other Preview target', () => {
    const root = { d1_databases: [], r2_buckets: [], previews: { d1_databases: [{ ...d1TestTarget }], r2_buckets: [] } };
    expect(() => validatePreviewBindings(root)).not.toThrow();
    expect(() => validatePreviewBindings({ ...root, d1_databases: [d1TestTarget] })).toThrow();
    expect(() => validatePreviewBindings({ ...root, previews: { ...root.previews, d1_databases: [{ ...d1TestTarget, database_id: 'production-fixture' }] } })).toThrow();
  });
});
