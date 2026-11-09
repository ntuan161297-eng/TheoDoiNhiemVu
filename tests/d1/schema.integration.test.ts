import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { authorizePlatformRequest, authorizeTenantRequest, type IdentityVerifier, type TenantContext } from '../../server/auth/authorization';
import { getTenantTask } from '../../server/data/tenant-tasks';

const exec = promisify(execFile);
const state = resolve('.local/cloudflare/d1-b1-tests', randomUUID());
const configPath = resolve('wrangler.d1-local.jsonc');
const issuer = 'https://identity.fixture.invalid';
let proxy: { env: { DB: D1Database }; dispose(): Promise<void> };
let db: D1Database;
let getProxy: typeof import('wrangler')['getPlatformProxy'];
const run = (sql: string, ...values: (string | number | null)[]) => db.prepare(sql).bind(...values).run();
const scalar = async (sql: string, ...values: (string | number | null)[]) => {
  const row = await db.prepare(sql).bind(...values).first<Record<string, string | number | null>>();
  return row ? Object.values(row)[0] : null;
};
const insert = (table: string, data: Record<string, string | number | null>) => run(
  `INSERT INTO ${table}(${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(() => '?').join(',')})`, ...Object.values(data));
const request = () => new Request('https://worker.fixture.invalid/api/tasks', { headers: { 'X-Tenant-Id': 'B', Authorization: 'Bearer unverified-fixture' } });
// Tests ONLY. Production has no verifier implementation or business route in B1.
const verifier = (subject: string): IdentityVerifier => async () => ({ issuer, subject });
const auth = (subject: string, tenant = 'A', permission: Parameters<typeof authorizeTenantRequest>[4] = 'tasks:read') =>
  authorizeTenantRequest(request(), db, verifier(subject), tenant, permission);
const task = (id: string, tenant = 'A', overrides: Record<string, string | number | null> = {}) => insert('tasks', {
  id, tenant_id: tenant, code: id, source_id: `${tenant}-source`, lead_unit_id: `${tenant}-u1`, leader_id: `${tenant}-leader`,
  title: `LOCAL QA fixture ${id}`, assigned_date: '2020-01-01', original_due_date: '2020-02-10',
  created_by_membership_id: `m-${tenant}-editor`, updated_by_membership_id: `m-${tenant}-editor`, ...overrides,
});
const extension = (id: string, taskId: string, overrides: Record<string, string | number | null> = {}) => insert('extension_requests', {
  id, tenant_id: 'A', task_id: taskId, sequence: 1, requesting_unit_id: 'A-u1', request_reference_no: id,
  request_date: '2020-02-01', reason: 'LOCAL QA only', previous_due_date: '2020-02-10', proposed_due_date: '2020-03-10',
  created_by_membership_id: 'm-A-editor', ...overrides,
});
const decide = (id: string, status = 'APPROVED', due: string | null = '2020-03-10') => run(`UPDATE extension_requests SET status=?,
  response_reference_no='QA-response',response_date='2020-02-02',approved_due_date=?,
  decided_by_membership_id='m-A-confirmer',decided_at='2020-02-02T01:00:00.000Z' WHERE id=?`, status, due, id);
const complete = (id: string, due = '2020-02-10', date = '2020-02-05') => run(`UPDATE tasks SET execution_status='DA_HOAN_THANH',
  completed_date=?,completion_summary='LOCAL QA completed',due_date_at_completion=?,
  confirmed_by_membership_id='m-A-confirmer',confirmed_at='2020-02-06T01:00:00.000Z' WHERE id=?`, date, due, id);

beforeAll(async () => {
  await mkdir(state, { recursive: true });
  // @ts-expect-error Shared JS runtime helper is used only by local tooling.
  const { localWorkerdEnvironment } = await import('../../scripts/local-workerd-runtime.mjs');
  const env = await localWorkerdEnvironment({ ...process.env, WRANGLER_SEND_METRICS: 'false', CI: 'true' });
  if (env.MINIFLARE_WORKERD_PATH) process.env.MINIFLARE_WORKERD_PATH = env.MINIFLARE_WORKERD_PATH;
  process.env.WRANGLER_SEND_METRICS = 'false';
  const args = [resolve('scripts/wrangler-local.mjs'), 'd1', 'migrations', 'apply', 'DB', '--local', '--config', configPath, '--persist-to', state];
  const first = await exec(process.execPath, args, { env, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  const second = await exec(process.execPath, args, { env, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  await writeFile(join(state, 'migration.log'), first.stdout + first.stderr + second.stdout + second.stderr);
  ({ getPlatformProxy: getProxy } = await import('wrangler'));
  proxy = await getProxy<{ DB: D1Database }>({ configPath, remoteBindings: false, envFiles: [], persist: { path: join(state, 'v3') } });
  db = proxy.env.DB;
});
afterAll(async () => { await proxy?.dispose(); });

describe('B1 migrations on real LOCAL D1/workerd', () => {
  it('applies all five migrations once and leaves only official catalog data before fixtures', async () => {
    expect(await scalar('SELECT COUNT(*) FROM d1_migrations')).toBe(5);
    expect(await scalar('SELECT COUNT(*) FROM tenants')).toBe(1);
    expect(await scalar('SELECT COUNT(*) FROM organization_units')).toBe(11);
    expect(await scalar('SELECT COUNT(*) FROM leaders')).toBe(3);
    expect(await scalar('SELECT COUNT(*) FROM task_sources')).toBe(3);
    for (const table of ['profiles', 'tenant_memberships', 'platform_admins', 'tasks', 'attachments', 'import_jobs']) {
      expect(await scalar(`SELECT COUNT(*) FROM ${table}`), table).toBe(0);
    }
    expect(await scalar('SELECT COUNT(*) FROM organization_units WHERE parent_id IS NOT NULL')).toBe(0);
    expect(await scalar('PRAGMA foreign_keys')).toBe(1);
  });

  it('matches every official CSV field, including capitalization, without copying UI task mocks', async () => {
    const catalogs = [
      ['don_vi_duoc_giao.csv', 'organization_units', ['code', 'name', 'unit_kind', 'sort_order', 'is_active']],
      ['lanh_dao_chi_dao.csv', 'leaders', ['code', 'full_name', 'position_name', 'sort_order', 'is_active']],
      ['nguon_nhiem_vu.csv', 'task_sources', ['code', 'name', 'sort_order', 'is_active']],
    ] as const;
    for (const [file, table, columns] of catalogs) {
      const csv = (await readFile(resolve('docs/product/seed', file), 'utf8')).replace(/^\uFEFF/, '').trim().split(/\r?\n/);
      const header = csv.shift()!.split(',');
      for (const line of csv) {
        const cells = line.split(',');
        const row = await db.prepare(`SELECT ${columns.join(',')} FROM ${table} WHERE tenant_id=? AND code=?`)
          .bind('tenant-huong-do', cells[0]).first<Record<string, string | number>>();
        expect(row).not.toBeNull();
        for (const col of columns) expect(String(row![col]), `${table}.${col}`).toBe(cells[header.indexOf(col)]);
      }
    }
  });

  it('records a schema/seed manifest before QA-only tenants and identities are inserted', async () => {
    const tables = (await db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name<>'d1_migrations' ORDER BY name").all<{ name: string }>()).results;
    expect(tables).toHaveLength(20);
    let foreignKeys = 0;
    for (const t of tables) foreignKeys += (await db.prepare(`PRAGMA foreign_key_list(${t.name})`).all()).results.length;
    const triggers = await scalar("SELECT COUNT(*) FROM sqlite_schema WHERE type='trigger'");
    const indexes = await scalar("SELECT COUNT(*) FROM sqlite_schema WHERE type='index'");
    await writeFile(resolve('.local/cloudflare/d1-b1-schema.json'), JSON.stringify({ state, tables, foreignKeyColumns: foreignKeys, triggers, indexes, seed: { tenants: 1, units: 11, leaders: 3, sources: 3, profiles: 0, tasks: 0 } }, null, 2));
    expect((await db.prepare('PRAGMA foreign_key_check').all()).results).toEqual([]);
  });

  it('creates synthetic tenant A/B fixtures only in this isolated QA database', async () => {
    for (const tenant of ['A', 'B']) {
      await insert('tenants', { id: tenant, code: `QA-${tenant}`, name: `LOCAL QA tenant ${tenant}` });
      for (const n of [1, 2, 3]) await insert('organization_units', { id: `${tenant}-u${n}`, tenant_id: tenant, code: `U${n}`, name: `LOCAL QA unit ${n}` });
      await insert('task_sources', { id: `${tenant}-source`, tenant_id: tenant, code: 'SAME_CODE', name: 'LOCAL QA source' });
      await insert('leaders', { id: `${tenant}-leader`, tenant_id: tenant, code: 'SAME_CODE', full_name: 'LOCAL QA leader', position_name: 'Fixture' });
    }
    const actors = [
      ['A-editor', 'A', 'OFFICE_EDITOR'], ['B-editor', 'B', 'OFFICE_EDITOR'],
      ['A-confirmer', 'A', 'OFFICE_CONFIRMER'], ['A-viewer', 'A', 'LEADER_VIEWER'], ['A-admin', 'A', 'TENANT_ADMIN'],
    ];
    for (const [subject, tenant, role] of actors) {
      await insert('profiles', { id: `p-${subject}`, identity_issuer: issuer, identity_subject: subject, display_name: 'LOCAL QA identity' });
      await insert('tenant_memberships', { id: `m-${subject}`, tenant_id: tenant, profile_id: `p-${subject}`, status: 'ACTIVE' });
      await insert('tenant_member_roles', { tenant_id: tenant, membership_id: `m-${subject}`, role });
    }
    await insert('profiles', { id: 'p-super', identity_issuer: issuer, identity_subject: 'super', display_name: 'LOCAL QA platform actor' });
    await insert('platform_admins', { profile_id: 'p-super' });
    await task('A-task'); await task('B-task', 'B');
    expect(await scalar('SELECT COUNT(*) FROM tasks WHERE tenant_id=?', 'A')).toBe(1);
  });

  it('allows repeated catalog codes across tenants but rejects duplicates inside one tenant', async () => {
    await expect(insert('task_sources', { id: 'A-source-duplicate', tenant_id: 'A', code: 'same_code', name: 'Duplicate' })).rejects.toThrow(/UNIQUE/);
    await expect(insert('tenant_memberships', { id: 'duplicate-membership', tenant_id: 'A', profile_id: 'p-A-editor', status: 'ACTIVE' })).rejects.toThrow(/UNIQUE/);
    await expect(insert('profiles', { id: 'duplicate-profile', identity_issuer: issuer, identity_subject: 'A-editor', display_name: 'Duplicate' })).rejects.toThrow(/UNIQUE/);
  });

  it('supports multi-level TreeView while rejecting self/long cycles, cross-tenant parents and moves', async () => {
    await run("UPDATE organization_units SET parent_id='A-u1' WHERE id='A-u2'");
    await run("UPDATE organization_units SET parent_id='A-u2' WHERE id='A-u3'");
    expect(await scalar(`WITH RECURSIVE tree(id) AS (SELECT id FROM organization_units WHERE tenant_id='A' AND parent_id IS NULL UNION ALL
      SELECT u.id FROM organization_units u JOIN tree t ON u.parent_id=t.id WHERE u.tenant_id='A') SELECT COUNT(*) FROM tree`)).toBe(3);
    await expect(run("UPDATE organization_units SET parent_id='A-u3' WHERE id='A-u1'")).rejects.toThrow(/cycle/);
    await expect(run("UPDATE organization_units SET parent_id='A-u1' WHERE id='A-u1'")).rejects.toThrow(/cycle|CHECK/);
    await expect(run("UPDATE organization_units SET parent_id='B-u1' WHERE id='A-u1'")).rejects.toThrow(/FOREIGN KEY/);
    await expect(run("UPDATE organization_units SET tenant_id='B' WHERE id='A-u1'")).rejects.toThrow(/immutable/);
    await expect(run("DELETE FROM organization_units WHERE id='A-u1'")).rejects.toThrow(/FOREIGN KEY/);
  });

  it('prevents role escalation to SUPER_ADMIN and assignment to another tenant membership/unit', async () => {
    await expect(insert('tenant_member_roles', { tenant_id: 'A', membership_id: 'm-B-editor', role: 'TENANT_ADMIN' })).rejects.toThrow(/FOREIGN KEY/);
    await expect(insert('tenant_member_roles', { tenant_id: 'A', membership_id: 'm-A-editor', role: 'SUPER_ADMIN' })).rejects.toThrow(/CHECK/);
    await expect(insert('user_unit_assignments', { tenant_id: 'A', membership_id: 'm-A-editor', unit_id: 'B-u1' })).rejects.toThrow(/FOREIGN KEY/);
    await expect(insert('user_unit_assignments', { tenant_id: 'A', membership_id: 'm-B-editor', unit_id: 'A-u1' })).rejects.toThrow(/FOREIGN KEY/);
    await insert('user_unit_assignments', { tenant_id: 'A', membership_id: 'm-A-editor', unit_id: 'A-u1', is_primary: 1 });
    await expect(insert('user_unit_assignments', { tenant_id: 'A', membership_id: 'm-A-editor', unit_id: 'A-u2', is_primary: 1 })).rejects.toThrow(/UNIQUE/);
  });

  it('makes membership identity, provider identity, record IDs and tenant ownership immutable', async () => {
    await expect(run("UPDATE tenant_memberships SET profile_id='p-B-editor' WHERE id='m-A-editor'")).rejects.toThrow(/immutable/);
    await expect(run("UPDATE profiles SET identity_subject='other' WHERE id='p-A-editor'")).rejects.toThrow(/immutable/);
    await expect(run("UPDATE tasks SET id='changed' WHERE id='A-task'")).rejects.toThrow(/immutable/);
    await expect(run("UPDATE tasks SET tenant_id='B' WHERE id='A-task'")).rejects.toThrow(/immutable/);
  });

  it('rejects every cross-tenant task reference, including actor, owner, document, source and leader', async () => {
    await insert('source_documents', { id: 'B-doc', tenant_id: 'B', document_kind: 'MEETING', summary: 'LOCAL QA', created_by_membership_id: 'm-B-editor' });
    for (const fields of [{ source_id: 'B-source' }, { lead_unit_id: 'B-u1' }, { leader_id: 'B-leader' }, { source_document_id: 'B-doc' }, { created_by_membership_id: 'm-B-editor' }, { office_owner_membership_id: 'm-B-editor' }]) {
      await expect(task('bad-task', 'A', fields)).rejects.toThrow(/FOREIGN KEY/);
    }
    await expect(insert('source_documents', { id: 'bad-doc', tenant_id: 'A', document_kind: 'MEETING', summary: 'LOCAL QA', created_by_membership_id: 'm-B-editor' })).rejects.toThrow(/FOREIGN KEY/);
  });

  it('rejects invalid calendar dates, missing leaders, invalid progress and partial completion', async () => {
    for (const fields of [{ assigned_date: '2020-02-30' }, { original_due_date: '2019-12-31' }, { original_due_date: 'not-a-date' }, { leader_id: null }, { progress_percent: 101 }, { execution_status: 'DA_HOAN_THANH' }]) {
      await expect(task('bad-validation', 'A', fields)).rejects.toThrow(/CHECK|NOT NULL/);
    }
    await run("UPDATE tasks SET progress_percent=100 WHERE id='A-task'");
    expect(await db.prepare("SELECT execution_status FROM tasks WHERE id='A-task'").first('execution_status')).toBe('CHUA_THUC_HIEN');
  });

  it('does not multiply tasks via coordinating units or accept lead/cross-tenant coordinators', async () => {
    await expect(insert('task_coordinating_units', { tenant_id: 'A', task_id: 'A-task', unit_id: 'A-u1' })).rejects.toThrow(/cannot_coordinate/);
    await expect(insert('task_coordinating_units', { tenant_id: 'A', task_id: 'A-task', unit_id: 'B-u1' })).rejects.toThrow(/FOREIGN KEY/);
    await insert('task_coordinating_units', { tenant_id: 'A', task_id: 'A-task', unit_id: 'A-u2' });
    await insert('task_coordinating_units', { tenant_id: 'A', task_id: 'A-task', unit_id: 'A-u3' });
    expect(await scalar("SELECT COUNT(DISTINCT t.id) FROM tasks t LEFT JOIN task_coordinating_units c ON c.tenant_id=t.tenant_id AND c.task_id=t.id WHERE t.tenant_id='A'")).toBe(1);
    await expect(run("UPDATE tasks SET lead_unit_id='A-u2' WHERE id='A-task'")).rejects.toThrow(/cannot_coordinate/);
  });

  it('keeps all progress and expedite links within their tenant and unique per document/task', async () => {
    await expect(insert('task_progress_updates', { id: 'bad-progress', tenant_id: 'A', task_id: 'B-task', report_date: '2020-01-10', content: 'QA', created_by_membership_id: 'm-A-editor' })).rejects.toThrow(/FOREIGN KEY/);
    for (const tenant of ['A', 'B']) await insert('expedite_documents', { id: `${tenant}-expedite`, tenant_id: tenant, reference_no: 'QA-only', issued_date: '2020-01-10', content: 'LOCAL QA', created_by_membership_id: `m-${tenant}-editor` });
    await expect(insert('expedite_document_tasks', { tenant_id: 'A', expedite_document_id: 'B-expedite', task_id: 'A-task' })).rejects.toThrow(/FOREIGN KEY/);
    await expect(insert('expedite_document_tasks', { tenant_id: 'A', expedite_document_id: 'A-expedite', task_id: 'B-task' })).rejects.toThrow(/FOREIGN KEY/);
    await insert('expedite_document_tasks', { tenant_id: 'A', expedite_document_id: 'A-expedite', task_id: 'A-task' });
    await expect(insert('expedite_document_tasks', { tenant_id: 'A', expedite_document_id: 'A-expedite', task_id: 'A-task' })).rejects.toThrow(/UNIQUE/);
    await run("UPDATE expedite_documents SET content='LOCAL QA edited' WHERE id='A-expedite'");
    expect(await scalar("SELECT COUNT(*) FROM expedite_document_tasks WHERE tenant_id='A' AND task_id='A-task'")).toBe(1);
  });

  it('keeps pending/rejected extensions on the original due date and allows only one pending', async () => {
    await extension('A-ext1', 'A-task');
    expect(await scalar("SELECT effective_due_date FROM v_tasks_effective WHERE id='A-task'")).toBe('2020-02-10');
    await expect(extension('A-ext-parallel', 'A-task', { sequence: 2 })).rejects.toThrow(/UNIQUE/);
    await expect(run("UPDATE tasks SET original_due_date='2020-05-10' WHERE id='A-task'")).rejects.toThrow(/immutable/);
    await decide('A-ext1', 'REJECTED', null);
    expect(await scalar("SELECT effective_due_date FROM v_tasks_effective WHERE id='A-task'")).toBe('2020-02-10');
    await expect(run("DELETE FROM extension_requests WHERE id='A-ext1'")).rejects.toThrow(/immutable/);
  });

  it('requires explicit approval evidence and preserves the last approved date during the next request', async () => {
    await extension('A-ext2', 'A-task', { sequence: 2 });
    await expect(run("UPDATE extension_requests SET status='APPROVED' WHERE id='A-ext2'")).rejects.toThrow(/CHECK/);
    await decide('A-ext2');
    await extension('A-ext3', 'A-task', { sequence: 3, previous_due_date: '2020-03-10', proposed_due_date: '2020-04-10' });
    expect(await scalar("SELECT effective_due_date FROM v_tasks_effective WHERE id='A-task'")).toBe('2020-03-10');
    await expect(run("UPDATE extension_requests SET approved_due_date='2020-06-10' WHERE id='A-ext2'")).rejects.toThrow(/immutable/);
    await decide('A-ext3', 'REJECTED', null);
    await expect(extension('bad-sequence', 'A-task', { sequence: 8, previous_due_date: '2020-03-10', proposed_due_date: '2020-05-10' })).rejects.toThrow(/sequence/);
    await expect(extension('bad-snapshot', 'A-task', { sequence: 4 })).rejects.toThrow(/previous_due/);
    await expect(extension('cross-extension', 'B-task')).rejects.toThrow(/FOREIGN KEY/);
  });

  it('requires a real completion date, actor and correct due snapshot and locks recorded completion', async () => {
    await expect(complete('A-task', '2020-02-10')).rejects.toThrow(/snapshot_mismatch/);
    await expect(complete('A-task', '2020-03-10', '9999-12-31')).rejects.toThrow(/future/);
    await expect(run("UPDATE tasks SET execution_status='DA_HOAN_THANH',completed_date='2020-03-01',completion_summary='QA',due_date_at_completion='2020-03-10',confirmed_at='2020-03-02T00:00:00Z',confirmed_by_membership_id='m-B-editor' WHERE id='A-task'")).rejects.toThrow(/FOREIGN KEY/);
    await complete('A-task', '2020-03-10', '2020-03-11');
    expect(await scalar("SELECT completed_date > due_date_at_completion FROM tasks WHERE id='A-task'")).toBe(1);
    await expect(run("UPDATE tasks SET completed_date='2020-02-01' WHERE id='A-task'")).rejects.toThrow(/correction/);
    await expect(extension('after-completion', 'A-task', { sequence: 4, previous_due_date: '2020-03-10', proposed_due_date: '2020-04-10' })).rejects.toThrow(/completed_task/);
  });

  it('enforces attachment owner, tenant FK and tenant-prefixed private object key metadata', async () => {
    const data = { id: 'A-file', tenant_id: 'A', task_id: 'A-task', document_role: 'TASK_RESULT', storage_key: 'A/qa/file.pdf', file_name: 'qa.pdf', mime_type: 'application/pdf', size_bytes: 12, uploaded_by_membership_id: 'm-A-editor' };
    await expect(insert('attachments', { ...data, task_id: 'B-task' })).rejects.toThrow(/FOREIGN KEY/);
    await expect(insert('attachments', { ...data, storage_key: 'B/qa/file.pdf' })).rejects.toThrow(/CHECK/);
    await expect(insert('attachments', { ...data, task_id: null })).rejects.toThrow(/CHECK/);
    await expect(insert('attachments', { ...data, expedite_document_id: 'A-expedite' })).rejects.toThrow(/CHECK/);
    await insert('attachments', data);
    await expect(run("UPDATE attachments SET tenant_id='B' WHERE id='A-file'")).rejects.toThrow(/immutable/);
  });

  it('scopes import jobs, row references and idempotency keys to the tenant', async () => {
    for (const tenant of ['A', 'B']) await insert('import_jobs', { id: `${tenant}-import`, tenant_id: tenant, file_name: 'LOCAL-QA.xlsx', idempotency_key: 'same-idempotency-key', created_by_membership_id: `m-${tenant}-editor` });
    const row = { id: 'A-row', tenant_id: 'A', import_job_id: 'A-import', row_number: 6, status: 'VALID', input_json: '{}' };
    await expect(insert('import_job_rows', { ...row, import_job_id: 'B-import' })).rejects.toThrow(/FOREIGN KEY/);
    await expect(insert('import_job_rows', { ...row, duplicate_task_id: 'B-task' })).rejects.toThrow(/FOREIGN KEY/);
    await expect(insert('import_job_rows', { ...row, row_number: 5 })).rejects.toThrow(/CHECK/);
    await expect(insert('import_job_rows', { ...row, input_json: 'not-json' })).rejects.toThrow(/CHECK/);
    await insert('import_job_rows', row);
    await expect(insert('import_jobs', { id: 'A-import-dup', tenant_id: 'A', file_name: 'QA.xlsx', idempotency_key: 'same-idempotency-key', created_by_membership_id: 'm-A-editor' })).rejects.toThrow(/UNIQUE/);
    await expect(insert('import_jobs', { id: 'A-wrong-sheet', tenant_id: 'A', file_name: 'QA.xlsx', sheet_name: 'VI_DU', idempotency_key: 'wrong-sheet', created_by_membership_id: 'm-A-editor' })).rejects.toThrow(/CHECK/);
  });

  it('makes audit append-only, validates actor membership and separates platform scope', async () => {
    const audit = { id: 'A-audit', scope: 'TENANT', tenant_id: 'A', actor_kind: 'USER', actor_profile_id: 'p-A-editor', actor_membership_id: 'm-A-editor', action: 'QA', entity_type: 'tasks', entity_id: 'A-task', after_json: '{}' };
    await expect(insert('audit_logs', { ...audit, actor_membership_id: 'm-B-editor' })).rejects.toThrow(/FOREIGN KEY/);
    await expect(insert('audit_logs', { ...audit, actor_profile_id: 'p-B-editor' })).rejects.toThrow(/FOREIGN KEY/);
    await expect(insert('audit_logs', { ...audit, scope: 'PLATFORM' })).rejects.toThrow(/CHECK/);
    await insert('audit_logs', audit);
    await expect(run("UPDATE audit_logs SET action='changed' WHERE id='A-audit'")).rejects.toThrow(/append_only/);
    await expect(run("DELETE FROM audit_logs WHERE id='A-audit'")).rejects.toThrow(/append_only/);
    await insert('audit_logs', { id: 'platform-audit', scope: 'PLATFORM', actor_kind: 'USER', actor_profile_id: 'p-super', action: 'QA', entity_type: 'tenants', entity_id: 'A' });
  });

  it('rejects INSERT OR REPLACE attempts to rewrite audit history', async () => {
    await expect(run(`INSERT OR REPLACE INTO audit_logs(id,scope,tenant_id,actor_kind,action,entity_type,entity_id)
      VALUES ('A-audit','TENANT','A','SYSTEM','tampered','tasks','A-task')`)).rejects.toThrow(/identity_already_exists/);
    expect(await scalar("SELECT action FROM audit_logs WHERE id='A-audit'")).toBe('QA');
  });

  it('rejects implicit replacement of tenant-owned records, including unreferenced units and original deadlines', async () => {
    await insert('organization_units', { id: 'replace-unit', tenant_id: 'A', code: 'REPLACE-QA', name: 'LOCAL QA immutable owner' });
    await expect(run(`INSERT OR REPLACE INTO organization_units(id,tenant_id,code,name)
      VALUES ('replace-unit','B','REPLACE-QA','Must not move')`)).rejects.toThrow(/identity_already_exists/);
    await expect(run(`INSERT OR REPLACE INTO tasks(id,tenant_id,code,source_id,lead_unit_id,leader_id,title,assigned_date,original_due_date,created_by_membership_id,updated_by_membership_id)
      VALUES ('A-task','A','A-task','A-source','A-u1','A-leader','Must not replace','2020-01-01','2020-12-31','m-A-editor','m-A-editor')`)).rejects.toThrow(/identity_already_exists/);
    expect(await scalar("SELECT original_due_date FROM tasks WHERE id='A-task'")).toBe('2020-02-10');
  });

  it('rolls back an entire D1 batch when a dependent tenant FK fails', async () => {
    await expect(db.batch([
      db.prepare("INSERT INTO organization_units(id,tenant_id,code,name) VALUES ('batch-unit','A','BATCH','LOCAL QA rollback')"),
      db.prepare("INSERT INTO user_unit_assignments(tenant_id,membership_id,unit_id) VALUES ('A','m-B-editor','batch-unit')"),
    ])).rejects.toThrow(/FOREIGN KEY/);
    expect(await scalar("SELECT COUNT(*) FROM organization_units WHERE id='batch-unit'")).toBe(0);
  });

  it('commits an admin update with its audit atomically and rolls back on audit validation failure', async () => {
    await expect(db.batch([
      db.prepare("UPDATE organization_units SET name='Must roll back' WHERE id='A-u2'"),
      db.prepare("INSERT INTO audit_logs(id,scope,tenant_id,actor_kind,action,entity_type,entity_id,after_json) VALUES ('bad-audit','TENANT','A','SYSTEM','QA','organization_units','A-u2','invalid-json')"),
    ])).rejects.toThrow(/CHECK/);
    expect(await scalar("SELECT name FROM organization_units WHERE id='A-u2'")).toBe('LOCAL QA unit 2');
    await db.batch([
      db.prepare("UPDATE organization_units SET name='LOCAL QA audited' WHERE id='A-u2'"),
      db.prepare("INSERT INTO audit_logs(id,scope,tenant_id,actor_kind,action,entity_type,entity_id,after_json) VALUES ('batch-audit','TENANT','A','SYSTEM','QA','organization_units','A-u2','{}')"),
    ]);
    expect(await scalar("SELECT name FROM organization_units WHERE id='A-u2'")).toBe('LOCAL QA audited');
    expect(await scalar("SELECT COUNT(*) FROM audit_logs WHERE id='batch-audit'")).toBe(1);
  });
});

describe('B1 internal Worker authorization against LOCAL D1', () => {
  it('fails closed without a verifier and does not trust bearer/tenant/DEMO headers', async () => {
    await expect(authorizeTenantRequest(request(), db, undefined, 'A', 'tasks:read')).rejects.toMatchObject({ status: 503 });
    await expect(authorizeTenantRequest(request(), db, async () => null, 'A', 'tasks:read')).rejects.toMatchObject({ status: 401 });
    await expect(authorizeTenantRequest(request(), db, async () => { throw new Error('invalid token'); }, 'A', 'tasks:read')).rejects.toMatchObject({ status: 401 });
  });
  it('allows tenant A reads only in A and cannot access a task in B by changing the ID', async () => {
    const context = await auth('A-editor');
    expect((await getTenantTask(db, context, 'A-task'))?.id).toBe('A-task');
    expect(await getTenantTask(db, context, 'B-task')).toBeNull();
    await expect(auth('A-editor', 'B')).rejects.toMatchObject({ status: 403 });
  });
  it('supports one identity in multiple tenants with different roles and no context leakage', async () => {
    await insert('tenant_memberships', { id: 'm-multi-B', tenant_id: 'B', profile_id: 'p-A-editor', status: 'ACTIVE' });
    await insert('tenant_member_roles', { tenant_id: 'B', membership_id: 'm-multi-B', role: 'LEADER_VIEWER' });
    try {
      const a = await auth('A-editor', 'A', 'tasks:write');
      const b = await auth('A-editor', 'B', 'tasks:read');
      expect(await getTenantTask(db, a, 'B-task')).toBeNull();
      expect((await getTenantTask(db, b, 'B-task'))?.tenant_id).toBe('B');
      expect(await getTenantTask(db, b, 'A-task')).toBeNull();
      await expect(auth('A-editor', 'B', 'tasks:write')).rejects.toMatchObject({ status: 403 });
    } finally { await run("UPDATE tenant_memberships SET status='REVOKED' WHERE id='m-multi-B'"); }
  });
  it('keeps Office Editor, Confirmer, Viewer and Tenant Admin capabilities distinct', async () => {
    await auth('A-editor', 'A', 'tasks:write');
    await expect(auth('A-editor', 'A', 'tasks:confirm')).rejects.toMatchObject({ status: 403 });
    await auth('A-confirmer', 'A', 'tasks:confirm');
    await expect(auth('A-confirmer', 'A', 'tasks:write')).rejects.toMatchObject({ status: 403 });
    await auth('A-viewer');
    await expect(auth('A-viewer', 'A', 'tasks:write')).rejects.toMatchObject({ status: 403 });
    await expect(auth('A-editor', 'A', 'roles:manage')).rejects.toMatchObject({ status: 403 });
    await auth('A-admin', 'A', 'roles:manage');
    await expect(auth('A-admin', 'B', 'roles:manage')).rejects.toMatchObject({ status: 403 });
    await expect(auth('A-admin')).rejects.toMatchObject({ status: 403 });
  });
  it('does not give Super Admin access to any tenant task without explicit tenant membership/role', async () => {
    const platform = await authorizePlatformRequest(request(), db, verifier('super'), 'tenants:manage');
    expect(platform.profileId).toBe('p-super');
    await expect(auth('super')).rejects.toMatchObject({ status: 403 });
    await expect(getTenantTask(db, platform as unknown as TenantContext, 'A-task')).rejects.toMatchObject({ status: 403 });
    await expect(authorizePlatformRequest(request(), db, verifier('A-admin'), 'tenants:manage')).rejects.toMatchObject({ status: 403 });
  });
  it('honors membership suspension immediately, including a previously issued internal context', async () => {
    const stale = await auth('A-viewer');
    await run("UPDATE tenant_memberships SET status='SUSPENDED' WHERE id='m-A-viewer'");
    try {
      await expect(auth('A-viewer')).rejects.toMatchObject({ status: 403 });
      expect(await getTenantTask(db, stale, 'A-task')).toBeNull();
    } finally { await run("UPDATE tenant_memberships SET status='ACTIVE' WHERE id='m-A-viewer'"); }
  });
  it('honors profile/tenant suspension and role revocation without using cached permissions', async () => {
    const stale = await auth('A-editor');
    await run("DELETE FROM tenant_member_roles WHERE tenant_id='A' AND membership_id='m-A-editor'");
    try {
      await expect(auth('A-editor')).rejects.toMatchObject({ status: 403 });
      expect(await getTenantTask(db, stale, 'A-task')).toBeNull();
    } finally { await insert('tenant_member_roles', { tenant_id: 'A', membership_id: 'm-A-editor', role: 'OFFICE_EDITOR' }); }
    await run("UPDATE profiles SET status='SUSPENDED' WHERE id='p-A-viewer'");
    try { await expect(auth('A-viewer')).rejects.toMatchObject({ status: 403 }); }
    finally { await run("UPDATE profiles SET status='ACTIVE' WHERE id='p-A-viewer'"); }
    await run("UPDATE tenants SET status='SUSPENDED' WHERE id='A'");
    try { await expect(auth('A-viewer')).rejects.toMatchObject({ status: 403 }); }
    finally { await run("UPDATE tenants SET status='ACTIVE' WHERE id='A'"); }
  });
  it('has no invalid foreign keys after all allowed/denied mutations and persists across restart', async () => {
    expect((await db.prepare('PRAGMA foreign_key_check').all()).results).toEqual([]);
    await proxy.dispose();
    proxy = await getProxy<{ DB: D1Database }>({ configPath, remoteBindings: false, envFiles: [], persist: { path: join(state, 'v3') } });
    db = proxy.env.DB;
    expect(await scalar('SELECT COUNT(*) FROM d1_migrations')).toBe(5);
    expect(await scalar("SELECT COUNT(*) FROM organization_units WHERE tenant_id='tenant-huong-do'")).toBe(11);
    expect(await scalar("SELECT effective_due_date FROM v_tasks_effective WHERE id='A-task'")).toBe('2020-03-10');
    expect((await getTenantTask(db, await auth('A-editor'), 'A-task'))?.id).toBe('A-task');
  });
});
