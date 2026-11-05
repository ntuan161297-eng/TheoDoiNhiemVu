// Offline structural/syntax review. Never opens a DB/network connection or executes SQL.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { parse, parsePlPgSQL } from 'libpg-query';

const migrationDir = new URL('../supabase/migrations/', import.meta.url);
const testsDir = new URL('../supabase/tests/', import.meta.url);
const verificationDir = new URL('../supabase/verification/', import.meta.url);
const root = new URL('../', import.meta.url);
const expectedTables = ['profiles','user_roles','units','leaders','task_sources','source_documents','tasks',
  'task_coordinating_units','task_progress_updates','expedite_documents','expedite_document_tasks',
  'extension_requests','attachments','audit_logs','import_jobs','import_job_rows'].map(n => `public.${n}`);
expectedTables.push('private.operation_requests');
const tables = new Map();
const functions = new Map();
const views = new Map();
const policies = [];
const clientGrants = [];
const report = { mode: 'OFFLINE_STATIC_ONLY', databaseExecuted: false, targetPostgresMajor: 17,
  parserPostgresMajor: 18, files: [], checks: [], limitations: [
    'PostgreSQL 18 WASM grammar checks PG17-compatible source; no PG17 server compilation performed.',
    'No database catalog/type resolution, RLS execution, transaction/concurrency or Storage API tests executed.',
    'SQL role/business test files are syntax-reviewed only; a disposable Supabase database run still requires approval.'
  ] };
const check = (name, condition) => { assert.ok(condition, name); report.checks.push(name); };
const walk = function* (value) {
  if (!value || typeof value !== 'object') return;
  yield value;
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) { for (const item of child) yield* walk(item); }
    else yield* walk(child);
  }
};
const qualified = relation => `${relation.schemaname ?? 'public'}.${relation.relname}`;
const strings = nodes => nodes.map(n => n.String.sval);
const foreignKeys = [];
const functionCalls = [];
let allMigrations = '';
let plpgsqlCount = 0;
let sqlBodyCount = 0;
let expectedErrorStatements = 0;
for (const [dir, label] of [[migrationDir, 'migrations'], [testsDir, 'tests'], [verificationDir, 'verification']]) {
  const names = (await readdir(dir)).filter(n => n.endsWith('.sql')).sort();
  check(`${label}: SQL files exist`, names.length > 0);
  if (label === 'migrations') check('Unique ordered timestamp filenames', names.every(n => /^\d{14}_[a-z0-9_]+\.sql$/.test(n))
    && new Set(names.map(n => n.slice(0,14))).size === names.length);
  for (const name of names) {
    const sql = await readFile(new URL(name, dir), 'utf8');
    const parsed = await parse(sql);
    const file = { path: `supabase/${label}/${name}`, sha256: createHash('sha256').update(sql).digest('hex'),
      statements: parsed.stmts.length, plpgsqlBodies: 0, sqlBodies: 0 };
    if (label === 'migrations') check(`${name}: runner owns transaction`, !parsed.stmts.some(s => s.stmt.TransactionStmt));
    else check(`${name}: rollback-only test/verification envelope`, /^\s*(?:--[^\n]*\n\s*)*begin;/i.test(sql) && /rollback;\s*$/i.test(sql));
    if (label === 'migrations') allMigrations += sql + '\n';
    else for (const node of walk(parsed)) {
      const call = node.FuncCall;
      if (call && strings(call.funcname).join('.') === 'pg_temp.expect_error') {
        await parse(call.args[0].A_Const.sval.sval);
        check(`${name}: expected SQLSTATE format`, /^[A-Z0-9]{5}$/.test(call.args[1].A_Const.sval.sval));
        expectedErrorStatements++;
      }
    }
    for (const { stmt, stmt_location = 0, stmt_len = 0 } of parsed.stmts) {
      const fn = stmt.CreateFunctionStmt;
      if (fn) {
        const options = fn.options.map(o => o.DefElem);
        const option = key => options.filter(o => o.defname === key);
        const language = option('language')[0]?.arg.String.sval;
        const body = option('as')[0]?.arg.List.items[0].String.sval;
        const nameParts = strings(fn.funcname);
        const fnName = nameParts.join('.');
        const definer = option('security').some(o => o.arg.Boolean.boolval === true);
        check(`${fnName}: explicit safe search_path`, option('set').some(o => o.arg.VariableSetStmt?.name === 'search_path'
          && o.arg.VariableSetStmt.args[0]?.A_Const?.sval?.sval === ''));
        if (label === 'migrations') {
          check(`${fnName}: DEFINER is not exposed`, !definer || nameParts[0] === 'private');
          check(`${fnName}: no replace hides signature drift`, !fn.replace);
          functions.set(fnName, fn);
        }
        const statement = Buffer.from(sql).subarray(stmt_location, stmt_len ? stmt_location + stmt_len : undefined).toString('utf8');
        if (language === 'plpgsql') {
          await parsePlPgSQL(statement + ';');
          file.plpgsqlBodies++; plpgsqlCount++;
        } else if (language === 'sql') {
          const bodyAst = await parse(body);
          file.sqlBodies++; sqlBodyCount++;
          if (label === 'migrations') for (const node of walk(bodyAst)) {
            if (node.FuncCall) functionCalls.push(node.FuncCall);
          }
        }
      }
      if (stmt.DoStmt) {
        const body = stmt.DoStmt.args.map(a => a.DefElem).find(a => a.defname === 'as').arg.String.sval;
        await parsePlPgSQL(`create function static_do_block() returns void language plpgsql as $static_body$${body}$static_body$;`);
        file.plpgsqlBodies++; plpgsqlCount++;
      }
      if (label !== 'migrations') continue;
      if (stmt.CreateStmt) {
        const table = stmt.CreateStmt;
        const tableName = qualified(table.relation);
        check(`Table ${tableName} defined only once`, !tables.has(tableName));
        const cols = table.tableElts.filter(e => e.ColumnDef).map(e => e.ColumnDef);
        const constraints = table.tableElts.filter(e => e.Constraint).map(e => e.Constraint);
        check(`Table ${tableName} has PK`, [...constraints,...cols.flatMap(c => (c.constraints ?? []).map(n => n.Constraint))]
          .some(c => c.contype === 'CONSTR_PRIMARY'));
        tables.set(tableName, new Set(cols.map(c => c.colname)));
        for (const node of walk(table)) if (node.Constraint?.contype === 'CONSTR_FOREIGN') {
          const fk = node.Constraint;
          foreignKeys.push({ from: tableName, to: qualified(fk.pktable), columns: strings(fk.pk_attrs), action: fk.fk_del_action });
        }
      }
      if (stmt.ViewStmt) views.set(qualified(stmt.ViewStmt.view), stmt.ViewStmt);
      if (stmt.CreatePolicyStmt) policies.push(stmt.CreatePolicyStmt);
      if (stmt.GrantStmt?.is_grant) clientGrants.push(stmt.GrantStmt);
    }
    report.files.push(file);
  }
}
check('All 17 required/support tables exist', expectedTables.length === tables.size && expectedTables.every(t => tables.has(t)));
for (const fk of foreignKeys) {
  const targetColumns = tables.get(fk.to) ?? (fk.to === 'auth.users' ? new Set(['id']) : null);
  check(`FK ${fk.from} -> ${fk.to}(${fk.columns}) resolves`, targetColumns && fk.columns.every(c => targetColumns.has(c)));
  check(`FK ${fk.from} -> ${fk.to} does not cascade`, fk.action !== 'c');
}
for (const table of expectedTables) {
  const explicit = allMigrations.includes(`alter table ${table} enable row level security`);
  const secureBlock = allMigrations.match(/do \$secure\$([\s\S]*?)\$secure\$/)?.[1] ?? '';
  const dynamic = table.startsWith('public.') && secureBlock.includes(`'${table.split('.')[1]}'`)
    && secureBlock.includes("format('alter table public.%I enable row level security', n)");
  check(`${table}: RLS declared`, explicit || dynamic);
  const readPolicy = policies.find(p => qualified(p.table) === table && p.cmd_name === 'select');
  if (table.startsWith('public.')) check(`${table}: explicit SELECT policy`, !!readPolicy);
}
for (const p of policies) {
  const isClient = p.roles?.some(r => ['authenticated','anon'].includes(r.RoleSpec?.rolename) || r.RoleSpec?.roletype === 'ROLESPEC_PUBLIC');
  check(`${p.policy_name}: no direct client write policy`, !isClient || p.cmd_name === 'select');
}
for (const grant of clientGrants) {
  const clients = grant.grantees.some(r => ['authenticated','anon'].includes(r.RoleSpec?.rolename) || r.RoleSpec?.roletype === 'ROLESPEC_PUBLIC');
  if (clients && grant.objtype === 'OBJECT_TABLE') check('Client table grants are SELECT only', grant.privileges?.length > 0
    && grant.privileges.every(p => p.AccessPriv.priv_name === 'select'));
  if (clients && grant.objtype === 'OBJECT_SCHEMA') check('Client schema grants have no CREATE', grant.privileges?.length > 0
    && grant.privileges.every(p => p.AccessPriv.priv_name === 'usage'));
}
for (const [name, view] of views) check(`${name}: security invoker view`, view.options.some(o =>
  o.DefElem.defname === 'security_invoker' && (o.DefElem.arg.String?.sval === 'true' || o.DefElem.arg.Boolean?.boolval)));
for (const call of functionCalls) {
  const names = strings(call.funcname);
  if (names[0] === 'public' || names[0] === 'private') check(`SQL-body function reference ${names.join('.')} exists`, functions.has(names.join('.')));
}
check('Private schema excluded from Data API', !/schemas\s*=\s*\[[^\]]*"private"/.test(await readFile(new URL('supabase/config.toml', root),'utf8')));
check('Every public write wrapper is INVOKER', ['save_task','save_source_document','add_progress','confirm_completion','archive_task','set_user_access']
  .every(n => functions.get(`public.${n}`)?.options.some(o => o.DefElem.defname === 'security' && !o.DefElem.arg.Boolean.boolval)));
check('Pending extension uniqueness declared', /create unique index one_pending_extension_per_task[\s\S]*?where state = 'DANG_XIN'/.test(allMigrations));
check('Completion snapshot invariant declared', allMigrations.includes('tasks_completed_bundle') && allMigrations.includes('due_date_at_completion is not null'));
check('Immutable original due guard declared', allMigrations.includes('(new.id, new.code, new.original_due_date) is distinct from'));
check('Deferred effective-due consistency declared', allMigrations.includes('extension_task_relations') && allMigrations.includes('coalesce(v_due, v_task.original_due_date)'));
check('Idempotency unique scope declared', allMigrations.includes('unique(actor_id, operation, idempotency_key)'));
check('Private bucket and no client storage writes', /values\('task-documents','task-documents',false,/.test(allMigrations));
check('No credential/role/demo task seeds', !/insert\s+into\s+(auth\.users|public\.(tasks|user_roles|profiles))\b/i.test(
  await readFile(new URL('20261105090500_official_catalog_seed.sql',migrationDir),'utf8')));

// Parse seed VALUES as AST, then compare every column with the authoritative CSV.
const seed = await parse(await readFile(new URL('20261105090500_official_catalog_seed.sql',migrationDir),'utf8'));
const literal = node => {
  const value = node.A_Const;
  if (value.isnull) return null;
  if (value.sval) return value.sval.sval;
  if (value.ival) return value.ival.ival ?? 0;
  if (value.boolval) return value.boolval.boolval ?? false;
  throw new Error(`Unsupported seed literal: ${JSON.stringify(node)}`);
};
for (const [table, csvFile, count] of [['units','don_vi_duoc_giao.csv',11],['leaders','lanh_dao_chi_dao.csv',3],['task_sources','nguon_nhiem_vu.csv',3]]) {
  const insert = seed.stmts.map(s => s.stmt.InsertStmt).find(s => s?.relation.relname === table);
  const columns = insert.cols.map(c => c.ResTarget.name);
  const rows = insert.selectStmt.SelectStmt.valuesLists.map(row => Object.fromEntries(row.List.items.map((v,i) => [columns[i],literal(v)])));
  const csv = (await readFile(new URL(`docs/product/seed/${csvFile}`,root),'utf8')).replace(/^\uFEFF/,'').trim().split(/\r?\n/).map(l => l.split(','));
  const [headers,...data] = csv;
  check(`${table}: official seed count ${count}`, rows.length === count && data.length === count);
  for (const line of data) {
    const source = Object.fromEntries(headers.map((h,i) => [h,line[i]]));
    const row = rows.find(r => r.code === source.code);
    check(`${table}.${source.code}: all CSV fields match exactly`, row && headers.every(h =>
      h === 'sort_order' ? row[h] === Number(source[h]) : h === 'is_active' ? row[h] === (source[h] === '1') : row[h] === source[h]));
    check(`${table}.${source.code}: UUID ID`, /^[0-9a-f-]{36}$/.test(row.id));
  }
}
report.summary = { migrations: report.files.filter(f => f.path.includes('/migrations/')).length,
  sqlTestFiles: report.files.filter(f => f.path.includes('/tests/')).length,
  verificationFiles: report.files.filter(f => f.path.includes('/verification/')).length,
  tables: tables.size, foreignKeys: foreignKeys.length, functions: functions.size, views: views.size,
  parsedPlpgsqlBodies: plpgsqlCount, parsedSqlBodies: sqlBodyCount, parsedExpectedErrorStatements: expectedErrorStatements,
  checksPassed: report.checks.length };
await writeFile(new URL('docs/qa/STAGE2_MIGRATION_STATIC.json', root), JSON.stringify(report,null,2) + '\n');
console.log(JSON.stringify(report.summary,null,2));
console.log('PASS: offline static checks only. No SQL was executed against any database.');
