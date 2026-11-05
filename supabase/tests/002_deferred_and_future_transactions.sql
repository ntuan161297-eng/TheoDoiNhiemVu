-- NOT RUN IN STEP 2.2. Disposable Supabase TEST database only.
-- Storage rows below are synthetic METADATA, not real uploaded files.
-- They test DB transaction guards, not MIME/content verification or Storage API.
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
create function pg_temp.login(p_id uuid) returns void
language plpgsql security invoker set search_path = ''
as $$ begin
  perform set_config('request.jwt.claim.sub',coalesce(p_id::text,''),true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',p_id,'role','authenticated','is_anonymous',false)::text,true);
end; $$;
grant execute on function pg_temp.assert_true(boolean,text),pg_temp.expect_error(text,text),pg_temp.login(uuid)
  to anon, authenticated, huong_do_executor;
select pg_temp.assert_true((select count(*) = 0 from public.tasks),'Requires disposable empty task DB');
insert into auth.users(id) values
('f1000000-0000-4000-8000-000000000001'),('f1000000-0000-4000-8000-000000000002'),
('f1000000-0000-4000-8000-000000000003'),('f1000000-0000-4000-8000-000000000004');
insert into public.user_roles(user_id,role) values
('f1000000-0000-4000-8000-000000000001','OFFICE_EDITOR'),
('f1000000-0000-4000-8000-000000000002','OFFICE_CONFIRMER'),
('f1000000-0000-4000-8000-000000000003','LEADER_VIEWER'),
('f1000000-0000-4000-8000-000000000004','ADMIN');
-- Trusted owner fixtures stand in for the future server verifier.
insert into storage.objects(bucket_id,name,metadata)
select 'task-documents','test-only/' || n || '.pdf','{"mimetype":"application/pdf","size":100}'::jsonb
from generate_series(1,6) n;
insert into public.attachments(id,purpose,object_path,original_name,mime_type,size_bytes,created_by,expires_at,verified_at,verified_by)
select ('a1000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  case n when 1 then 'EXTENSION_REQUEST' when 2 then 'EXTENSION_RESPONSE' when 3 then 'EXTENSION_REQUEST'
    when 4 then 'EXTENSION_RESPONSE' when 5 then 'EXPEDITE' else 'EXTENSION_REQUEST' end,
  'test-only/' || n || '.pdf','TEST.pdf','application/pdf',100,
  case when n in (2,4) then 'f1000000-0000-4000-8000-000000000002'::uuid else 'f1000000-0000-4000-8000-000000000001'::uuid end,
  now()+interval '1 hour',case when n <> 6 then now() end,
  case when n <> 6 then 'f1000000-0000-4000-8000-000000000002'::uuid end
from generate_series(1,6) n;

-- INTERNAL testing only: SQL owner may SET ROLE executor, browsers may NOT.
set local role huong_do_executor;
select pg_temp.login('f1000000-0000-4000-8000-000000000001');
select set_config('huong_do_test.task1',private.save_task(jsonb_build_object(
  'source_id','33000000-0000-4000-8000-000000000001','primary_unit_id','11000000-0000-4000-8000-000000000001',
  'leader_id','22000000-0000-4000-8000-000000000001','content','TEST future transaction 1',
  'assigned_date',public.business_today()-10,'original_due_date',public.business_today()+1),null,null,'{}',gen_random_uuid())::text,true);
select set_config('huong_do_test.task2',private.save_task(jsonb_build_object(
  'source_id','33000000-0000-4000-8000-000000000001','primary_unit_id','11000000-0000-4000-8000-000000000002',
  'leader_id','22000000-0000-4000-8000-000000000001','content','TEST future transaction 2',
  'assigned_date',public.business_today()-10,'original_due_date',public.business_today()+1),null,null,'{}',gen_random_uuid())::text,true);
set constraints all immediate;
set constraints all deferred;
select pg_temp.expect_error('update public.tasks set original_due_date = original_due_date + 1','23514','Original due trigger even for internal role');
select pg_temp.expect_error('update public.tasks set current_due_date = current_due_date + 1; set constraints all immediate',
  '23514','Unapproved due cache change rejected at transaction boundary');
select pg_temp.expect_error('insert into public.task_coordinating_units(task_id,unit_id) values(current_setting(''huong_do_test.task1'')::uuid,
  ''11000000-0000-4000-8000-000000000001''); set constraints all immediate','23514','Lead cannot coordinate');
select pg_temp.expect_error('select private.request_extension(current_setting(''huong_do_test.task1'')::uuid,1,
  ''11000000-0000-4000-8000-000000000001'',''TEST'',public.business_today(),''TEST'',public.business_today()+10,
  ''a1000000-0000-4000-8000-000000000006'',gen_random_uuid())','23514','Unverified file rolls back request');
select pg_temp.assert_true((select count(*) = 0 from public.extension_requests),'Failed file bind leaves no request');
select pg_temp.assert_true((select row_version = 1 from public.tasks where id = current_setting('huong_do_test.task1')::uuid),'Failed request rolls back task version');
select set_config('huong_do_test.extension1',private.request_extension(current_setting('huong_do_test.task1')::uuid,1,
  '11000000-0000-4000-8000-000000000001','TEST request 1',public.business_today(),'TEST reason',public.business_today()+10,
  'a1000000-0000-4000-8000-000000000001',gen_random_uuid())::text,true);
select pg_temp.assert_true((select current_due_date = original_due_date from public.tasks where id = current_setting('huong_do_test.task1')::uuid),
  'Pending keeps original effective due');
select pg_temp.expect_error('insert into public.extension_requests(task_id,sequence_no,requesting_unit_id,request_no,request_date,reason,
  previous_due_date,proposed_due_date,created_by) values(current_setting(''huong_do_test.task1'')::uuid,2,
  ''11000000-0000-4000-8000-000000000001'',''TEST duplicate'',public.business_today(),''TEST'',public.business_today()+1,
  public.business_today()+20,auth.uid())','23505','Partial unique rejects second pending');
select pg_temp.expect_error('select private.resolve_extension(current_setting(''huong_do_test.extension1'')::uuid,2,1,true,
  ''TEST response'',public.business_today(),''TEST'',public.business_today()+12,''a1000000-0000-4000-8000-000000000002'',gen_random_uuid())',
  '42501','Editor rejected inside decision function');
select pg_temp.login('f1000000-0000-4000-8000-000000000003');
select pg_temp.expect_error('select private.request_extension(null,null,null,null,null,null,null,null,gen_random_uuid())','42501',
  'Viewer rejected inside transaction function');
select pg_temp.login('f1000000-0000-4000-8000-000000000002');
select private.resolve_extension(current_setting('huong_do_test.extension1')::uuid,2,1,true,'TEST approve',public.business_today(),
  'TEST authority',public.business_today()+12,'a1000000-0000-4000-8000-000000000002',gen_random_uuid());
select pg_temp.assert_true((select current_due_date = public.business_today()+12 and original_due_date = public.business_today()+1
  from public.tasks where id = current_setting('huong_do_test.task1')::uuid),'Approved date may differ from proposed; original unchanged');
set constraints all immediate;
set constraints all deferred;
select pg_temp.login('f1000000-0000-4000-8000-000000000001');
select set_config('huong_do_test.extension2',private.request_extension(current_setting('huong_do_test.task1')::uuid,3,
  '11000000-0000-4000-8000-000000000001','TEST request 2',public.business_today(),'TEST reason',public.business_today()+20,
  'a1000000-0000-4000-8000-000000000003',gen_random_uuid())::text,true);
select pg_temp.assert_true((select current_due_date = public.business_today()+12 from public.tasks where id = current_setting('huong_do_test.task1')::uuid),
  'Second pending keeps last approval');
select pg_temp.login('f1000000-0000-4000-8000-000000000002');
select private.resolve_extension(current_setting('huong_do_test.extension2')::uuid,4,1,false,'TEST reject',public.business_today(),
  'TEST authority',null,'a1000000-0000-4000-8000-000000000004',gen_random_uuid());
select pg_temp.assert_true((select current_due_date = public.business_today()+12 from public.tasks where id = current_setting('huong_do_test.task1')::uuid),
  'Reject keeps previous approved due');
set constraints all immediate;
set constraints all deferred;

select pg_temp.login('f1000000-0000-4000-8000-000000000001');
select set_config('huong_do_test.expedite',private.create_expedite(
  array[current_setting('huong_do_test.task1')::uuid,current_setting('huong_do_test.task2')::uuid],array[5,1]::bigint[],
  'TEST expedite',public.business_today(),'TEST issuer','TEST content','a1000000-0000-4000-8000-000000000005',
  'e1000000-0000-4000-8000-000000000001')::text,true);
select pg_temp.assert_true((select count(*) = 1 from public.expedite_documents),'One shared expedite document');
select pg_temp.assert_true((select count(*) = 2 from public.expedite_document_tasks),'Two links, no task duplication');
select pg_temp.assert_true(private.create_expedite(array[current_setting('huong_do_test.task1')::uuid,current_setting('huong_do_test.task2')::uuid],
  array[5,1]::bigint[],'TEST expedite',public.business_today(),'TEST issuer','TEST content','a1000000-0000-4000-8000-000000000005',
  'e1000000-0000-4000-8000-000000000001')::text = current_setting('huong_do_test.expedite'),'Expedite retry idempotent');
set constraints all immediate;
set constraints all deferred;
reset role;
set local role authenticated;
select pg_temp.login('f1000000-0000-4000-8000-000000000003');
select pg_temp.assert_true((public.dashboard_kpi()->>'total')::integer = 2 and
  (public.dashboard_kpi()->>'expedited_tasks')::integer = 2 and (public.dashboard_kpi()->>'expedite_total')::integer = 2,'Distinct task and expedite KPIs');
select pg_temp.assert_true((select count(*) = 5 from storage.objects where bucket_id = 'task-documents'),'Viewer reads ready file metadata only');
select pg_temp.expect_error('insert into storage.objects(bucket_id,name) values(''task-documents'',''not-allowed.pdf'')','42501','No client upload policy');
reset role;
set local role anon;
select pg_temp.login(null);
select pg_temp.assert_true((select count(*) = 0 from storage.objects where bucket_id = 'task-documents'),'Anon cannot read private file rows');
reset role;
set local role huong_do_executor;
select pg_temp.login('f1000000-0000-4000-8000-000000000001');
update public.expedite_documents set cancelled_at = now(),cancelled_by = auth.uid(),cancel_reason = 'TEST cancel'
  where id = current_setting('huong_do_test.expedite')::uuid;
set constraints all immediate;
set constraints all deferred;
reset role;
set local role authenticated;
select pg_temp.login('f1000000-0000-4000-8000-000000000003');
select pg_temp.assert_true((public.dashboard_kpi()->>'expedited_tasks')::integer = 0,'Cancelled expedite no longer counted');
select pg_temp.assert_true((select count(*) = 2 from public.expedite_document_tasks),'Cancellation preserves links/history');
reset role;
set local role huong_do_executor;
select pg_temp.login('f1000000-0000-4000-8000-000000000002');
select private.confirm_completion(current_setting('huong_do_test.task1')::uuid,6,public.business_today(),'TEST complete',gen_random_uuid());
select pg_temp.expect_error('update public.tasks set due_date_at_completion = due_date_at_completion+1','23514','Completion snapshot immutable');
reset role;
set constraints all immediate;
rollback;
