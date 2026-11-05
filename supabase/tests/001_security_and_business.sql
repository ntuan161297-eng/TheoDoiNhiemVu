-- NOT RUN IN STEP 2.2. Use ONLY a disposable migrated Supabase test database.
-- Entire suite rolls back test users, rows, Storage metadata and audit.
-- Requires the database-owner test runner; it intentionally impersonates roles.
begin;
create function pg_temp.assert_true(p_condition boolean, p_message text) returns void
language plpgsql security invoker set search_path = ''
as $$ begin if p_condition is distinct from true then raise exception 'TEST FAILED: %',p_message; end if; end; $$;
create function pg_temp.expect_error(p_sql text, p_state text, p_message text) returns void
language plpgsql security invoker set search_path = ''
as $$
declare v_caught boolean := false;
begin
  begin execute p_sql;
  exception when others then
    if sqlstate <> p_state then raise exception 'TEST FAILED: %, wanted %, got %: %',p_message,p_state,sqlstate,sqlerrm; end if;
    v_caught := true;
  end;
  if not v_caught then raise exception 'TEST FAILED: %, expected rejection',p_message; end if;
end;
$$;
create function pg_temp.login(p_id uuid, p_anonymous boolean default false) returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  perform set_config('request.jwt.claim.sub',coalesce(p_id::text,''),true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',p_id,'role','authenticated','is_anonymous',p_anonymous,
    'user_metadata',jsonb_build_object('role','ADMIN'))::text,true);
end;
$$;
grant execute on function pg_temp.assert_true(boolean,text),pg_temp.expect_error(text,text),pg_temp.login(uuid,boolean)
  to anon, authenticated, huong_do_executor;
select pg_temp.assert_true((select count(*) = 0 from public.tasks),'Suite requires an empty task database');
select pg_temp.assert_true((select count(*) = 11 from public.units),'Seed 11 units');
select pg_temp.assert_true((select count(*) = 3 from public.leaders),'Seed 3 leaders');
select pg_temp.assert_true((select count(*) = 3 from public.task_sources),'Seed 3 sources');
select pg_temp.assert_true(not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef),'No public SECURITY DEFINER');
select pg_temp.assert_true(not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),'All exposed tables have RLS');
select pg_temp.assert_true(not has_function_privilege('authenticated',
  'private.request_extension(uuid,bigint,uuid,text,date,text,date,uuid,uuid)','EXECUTE'),'GĐ3 cannot be invoked by client');
select pg_temp.assert_true(not exists(select 1 from storage.buckets where id = 'task-documents' and public),'Private bucket');

insert into auth.users(id,raw_user_meta_data) values
('f0000000-0000-4000-8000-000000000001','{"role":"ADMIN"}'),
('f0000000-0000-4000-8000-000000000002','{}'),
('f0000000-0000-4000-8000-000000000003','{}'),
('f0000000-0000-4000-8000-000000000004','{}'),
('f0000000-0000-4000-8000-000000000005','{}'),
('f0000000-0000-4000-8000-000000000006','{}'),
('f0000000-0000-4000-8000-000000000007','{}');
select pg_temp.assert_true(not exists(select 1 from public.user_roles where user_id::text like 'f0000000%'),
  'Provisioning/metadata cannot automatically assign roles');
insert into public.user_roles(user_id,role) values
('f0000000-0000-4000-8000-000000000001','ADMIN'),
('f0000000-0000-4000-8000-000000000002','OFFICE_EDITOR'),
('f0000000-0000-4000-8000-000000000003','OFFICE_CONFIRMER'),
('f0000000-0000-4000-8000-000000000004','LEADER_VIEWER'),
('f0000000-0000-4000-8000-000000000005','OFFICE_EDITOR'),
('f0000000-0000-4000-8000-000000000007','LEADER_VIEWER');
update public.profiles set is_active = false where id = 'f0000000-0000-4000-8000-000000000005';

-- ANON: no read, write, report or private helper access.
set local role anon;
select pg_temp.login(null);
select pg_temp.expect_error('select * from public.units','42501','Anon catalog');
select pg_temp.expect_error('select * from public.tasks','42501','Anon tasks');
select pg_temp.expect_error('select public.dashboard_kpi()','42501','Anon report');
select pg_temp.expect_error('select public.save_task(''{}'',null,null,''{}'',gen_random_uuid())','42501','Anon write');
select pg_temp.expect_error('select private.has_role(array[''ADMIN''])','42501','Anon private schema');
reset role;

-- Valid JWT but no membership: spoofed metadata never grants ADMIN.
set local role authenticated;
select pg_temp.login('f0000000-0000-4000-8000-000000000006');
select pg_temp.assert_true((select count(*) = 0 from public.units),'Unassigned cannot read units');
select pg_temp.assert_true((select count(*) = 0 from public.tasks),'Unassigned cannot read tasks');
select pg_temp.expect_error('select public.dashboard_kpi()','42501','Unassigned KPI must error, not fake zero success');
select pg_temp.expect_error('select public.set_user_access(auth.uid(),array[''ADMIN''],true,gen_random_uuid())','42501','Metadata cannot promote');
select pg_temp.login('f0000000-0000-4000-8000-000000000005');
select pg_temp.assert_true((select count(*) = 0 from public.units),'Inactive user cannot read');
select pg_temp.expect_error('select public.save_task(''{}'',null,null,''{}'',gen_random_uuid())','42501','Inactive write');
select pg_temp.login('f0000000-0000-4000-8000-000000000007',true);
select pg_temp.assert_true((select count(*) = 0 from public.units),'Anonymous Auth user cannot read');
reset role;

-- EDITOR: positive CRUD/progress and idempotency; negative protected columns/roles.
set local role authenticated;
select pg_temp.login('f0000000-0000-4000-8000-000000000002');
select set_config('huong_do_test.task_id',public.save_task(jsonb_build_object(
  'source_id','33000000-0000-4000-8000-000000000001','primary_unit_id','11000000-0000-4000-8000-000000000001',
  'leader_id','22000000-0000-4000-8000-000000000001','content','TEST rollback only',
  'assigned_date',public.business_today()-10,'original_due_date',public.business_today()+4),null,null,
  array['11000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000003']::uuid[],
  'e0000000-0000-4000-8000-000000000001')::text,true);
select pg_temp.assert_true(public.save_task(jsonb_build_object(
  'source_id','33000000-0000-4000-8000-000000000001','primary_unit_id','11000000-0000-4000-8000-000000000001',
  'leader_id','22000000-0000-4000-8000-000000000001','content','TEST rollback only',
  'assigned_date',public.business_today()-10,'original_due_date',public.business_today()+4),null,null,
  array['11000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000003']::uuid[],
  'e0000000-0000-4000-8000-000000000001')::text = current_setting('huong_do_test.task_id'),'Idempotent retry returns same task');
select pg_temp.expect_error('select public.save_task(''{}'',null,null,''{}'',''e0000000-0000-4000-8000-000000000001'')','22023','Same key, different payload');
select pg_temp.expect_error('update public.tasks set original_due_date = original_due_date+1','42501','Direct original due write');
select pg_temp.expect_error('update public.tasks set current_due_date = current_due_date+1','42501','Direct current due write');
select pg_temp.expect_error('update public.tasks set execution_status = ''DA_HOAN_THANH''','42501','Direct completion');
select pg_temp.expect_error('insert into public.user_roles values(auth.uid(),''ADMIN'',null,now())','42501','Direct self promotion');
select pg_temp.expect_error('update public.profiles set is_active = true','42501','Direct profile manipulation');
select pg_temp.expect_error('update public.audit_logs set action = ''fake''','42501','Audit update');
select pg_temp.expect_error('delete from public.audit_logs','42501','Audit delete');
select pg_temp.expect_error('select public.confirm_completion(current_setting(''huong_do_test.task_id'')::uuid,1,public.business_today(),''TEST'',gen_random_uuid())',
  '42501','Editor cannot confirm');
select public.add_progress(current_setting('huong_do_test.task_id')::uuid,1,public.business_today(),'TEST progress',100,null,gen_random_uuid());
select pg_temp.assert_true((select execution_status = 'DANG_THUC_HIEN' and progress_percent = 100 from public.tasks
  where id = current_setting('huong_do_test.task_id')::uuid),'100 percent is not completion');
select pg_temp.expect_error('select public.add_progress(current_setting(''huong_do_test.task_id'')::uuid,1,public.business_today(),''stale'',50,null,gen_random_uuid())',
  '40001','Stale version rejected');
select pg_temp.assert_true((public.dashboard_kpi()->>'total')::integer = 1,'KPI distinct task count with two coordinators');
select pg_temp.assert_true((public.dashboard_kpi()->>'risk')::integer = 1,'Risk bucket');
select pg_temp.assert_true((select count(*) = 11 and sum(total) = 1 from public.report_by_unit()),'11 units, lead unit counts once');
select pg_temp.assert_true((public.dashboard_kpi(jsonb_build_object('coordinator_id','11000000-0000-4000-8000-000000000002'))->>'total')::integer = 1,
  'Coordinator filter uses EXISTS');
select pg_temp.assert_true((public.dashboard_kpi(jsonb_build_object('unit_ids',jsonb_build_array('11000000-0000-4000-8000-000000000002')))->>'total')::integer = 0,
  'Coordinator is not counted as lead');
reset role;
-- Flush all deferred relationship guards before testing the next operation.
set constraints all immediate;
set constraints all deferred;

-- VIEWER: all read paths, no write, no private future transaction EXECUTE.
set local role authenticated;
select pg_temp.login('f0000000-0000-4000-8000-000000000004');
select pg_temp.assert_true((select count(*) = 1 from public.tasks),'Viewer reads tasks');
select pg_temp.assert_true((select count(*) > 0 from public.audit_logs),'Viewer reads task timeline');
select pg_temp.assert_true(not exists(select 1 from public.audit_logs where task_id is null),'Viewer cannot read account audit');
select pg_temp.expect_error('select public.save_task(''{}'',null,null,''{}'',gen_random_uuid())','42501','Viewer cannot save');
select pg_temp.expect_error('select public.add_progress(current_setting(''huong_do_test.task_id'')::uuid,2,public.business_today(),''TEST'',1,null,gen_random_uuid())',
  '42501','Viewer cannot progress');
select pg_temp.expect_error('select public.confirm_completion(current_setting(''huong_do_test.task_id'')::uuid,2,public.business_today(),''TEST'',gen_random_uuid())',
  '42501','Viewer cannot confirm');
select pg_temp.expect_error('select public.set_user_access(auth.uid(),array[''ADMIN''],true,gen_random_uuid())','42501','Viewer cannot grant roles');
select pg_temp.expect_error('select private.resolve_extension(null,null,null,true,null,null,null,null,null,gen_random_uuid())',
  '42501','GĐ3 not exposed or client-granted');
reset role;

-- CONFIRMER: completion bundle, future date rejection, snapshot and completed KPI.
set local role authenticated;
select pg_temp.login('f0000000-0000-4000-8000-000000000003');
select pg_temp.expect_error('select public.confirm_completion(current_setting(''huong_do_test.task_id'')::uuid,2,null,''TEST'',gen_random_uuid())',
  '23514','Missing actual date');
select pg_temp.expect_error('select public.confirm_completion(current_setting(''huong_do_test.task_id'')::uuid,2,public.business_today()+1,''TEST'',gen_random_uuid())',
  '23514','Future completion');
select public.confirm_completion(current_setting('huong_do_test.task_id')::uuid,2,public.business_today(),'TEST completed',gen_random_uuid());
select pg_temp.assert_true((select due_date_at_completion = original_due_date and confirmed_by = auth.uid()
  and public.completion_classification(execution_status,completed_date,due_date_at_completion) = 'HOAN_THANH_DUNG_HAN'
  from public.tasks where id = current_setting('huong_do_test.task_id')::uuid),'Confirmed snapshot/actor');
select pg_temp.assert_true((public.dashboard_kpi()->>'completed')::integer = 1 and (public.dashboard_kpi()->>'risk')::integer = 0,
  'Completed task leaves active deadline buckets');
select pg_temp.expect_error('select public.set_user_access(''f0000000-0000-4000-8000-000000000004'',array[''ADMIN''],true,gen_random_uuid())',
  '42501','Confirmer cannot grant roles');
reset role;

-- ADMIN: manage another user; no direct DML, self change or audit mutation.
set local role authenticated;
select pg_temp.login('f0000000-0000-4000-8000-000000000001');
select public.set_user_access('f0000000-0000-4000-8000-000000000006',array['LEADER_VIEWER'],true,gen_random_uuid());
select pg_temp.assert_true(exists(select 1 from public.user_roles where user_id = 'f0000000-0000-4000-8000-000000000006'
  and role = 'LEADER_VIEWER'),'Admin assigned other user');
select pg_temp.expect_error('select public.set_user_access(auth.uid(),array[''ADMIN''],true,gen_random_uuid())','42501','Admin cannot self change roles');
select pg_temp.expect_error('update public.tasks set current_due_date = current_due_date + 1','42501','Admin cannot directly change due');
select pg_temp.expect_error('delete from public.audit_logs','42501','Admin cannot delete audit');
select public.archive_task(current_setting('huong_do_test.task_id')::uuid,3,true,'TEST archive',gen_random_uuid());
select pg_temp.assert_true((public.dashboard_kpi()->>'total')::integer = 0,'Archived tasks excluded by default');
select public.archive_task(current_setting('huong_do_test.task_id')::uuid,4,false,'TEST restore',gen_random_uuid());
select pg_temp.assert_true((public.dashboard_kpi()->>'total')::integer = 1,'Restored tasks counted again');
-- Live DB membership check blocks an already issued JWT after deactivation.
select public.set_user_access('f0000000-0000-4000-8000-000000000004',array['LEADER_VIEWER'],false,gen_random_uuid());
select pg_temp.login('f0000000-0000-4000-8000-000000000004');
select pg_temp.assert_true((select count(*) = 0 from public.tasks),'Revoked role/profile enforced without JWT refresh');
select pg_temp.expect_error('select public.dashboard_kpi()','42501','Inactive existing JWT report blocked');
reset role;

-- Pure date boundary checks use a fixed date, not the machine timezone.
set local role authenticated;
select pg_temp.login('f0000000-0000-4000-8000-000000000003');
select pg_temp.assert_true(public.deadline_status('DANG_THUC_HIEN','2026-11-10','2026-11-04') = 'CON_HAN','6 days');
select pg_temp.assert_true(public.deadline_status('DANG_THUC_HIEN','2026-11-09','2026-11-04') = 'NGUY_CO_CHAM','5 days');
select pg_temp.assert_true(public.deadline_status('DANG_THUC_HIEN','2026-11-07','2026-11-04') = 'NGUY_CO_CHAM','3 days');
select pg_temp.assert_true(public.deadline_status('DANG_THUC_HIEN','2026-11-06','2026-11-04') = 'SAP_DEN_HAN_KHAN','2 days');
select pg_temp.assert_true(public.deadline_status('DANG_THUC_HIEN','2026-11-04','2026-11-04') = 'SAP_DEN_HAN_KHAN','0 days');
select pg_temp.assert_true(public.deadline_status('DANG_THUC_HIEN','2026-11-03','2026-11-04') = 'QUA_HAN','-1 day');
select pg_temp.assert_true(public.deadline_status('DA_HOAN_THANH','2026-11-03','2026-11-04') is null,'Completed has no deadline alert');
select pg_temp.assert_true(public.completion_classification('DA_HOAN_THANH','2026-11-03','2026-11-03') = 'HOAN_THANH_DUNG_HAN','On-time equality');
select pg_temp.assert_true(public.completion_classification('DA_HOAN_THANH','2026-11-04','2026-11-03') = 'HOAN_THANH_CHAM_HAN','Late completion');
select pg_temp.assert_true(('2026-11-04 16:59:59+00'::timestamptz at time zone 'Asia/Ho_Chi_Minh')::date = '2026-11-04'::date
  and ('2026-11-04 17:00:00+00'::timestamptz at time zone 'Asia/Ho_Chi_Minh')::date = '2026-11-05'::date,'Vietnam midnight');
reset role;
set constraints all immediate;
rollback;
