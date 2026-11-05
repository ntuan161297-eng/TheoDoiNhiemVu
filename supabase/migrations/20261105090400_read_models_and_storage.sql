-- Atomic transaction is managed by the Supabase migration runner.
grant execute on function private.normalized(text) to authenticated;
create view public.task_read_model with (security_invoker = true) as
select t.*,
  public.days_remaining(t.current_due_date) as days_left,
  public.deadline_status(t.execution_status,t.current_due_date) as deadline_state,
  public.completion_classification(t.execution_status,t.completed_date,t.due_date_at_completion) as completion_state,
  coalesce((select e.state from public.extension_requests e where e.task_id = t.id order by e.sequence_no desc limit 1),'KHONG_XIN') as extension_state,
  (select count(*) from public.expedite_document_tasks l join public.expedite_documents d on d.id = l.expedite_document_id
    where l.task_id = t.id and d.cancelled_at is null) as expedite_count
from public.tasks t;
revoke all on public.task_read_model from public, anon, authenticated;
grant select on public.task_read_model to authenticated;

create function public.filtered_tasks(p_filters jsonb default '{}'::jsonb, p_as_of date default public.business_today())
returns setof public.task_read_model
language plpgsql stable security invoker set search_path = ''
as $$
begin
  if not private.can_read() then raise exception using errcode = '42501', message = 'Không có quyền xem dữ liệu nghiệp vụ.'; end if;
  if p_filters is null or jsonb_typeof(p_filters) <> 'object' or p_as_of is null or exists
    (select 1 from jsonb_object_keys(p_filters) k where k <> all(array['search','year','source_ids','unit_ids','leader_ids',
      'execution_status','deadline_state','extension_state','assigned_from','assigned_to','priority','coordinator_id','expedited','include_archived'])) then
    raise exception using errcode = '22023', message = 'Bộ lọc/ngày tham chiếu không hợp lệ.';
  end if;
  return query
  select m.id,m.code,m.external_ref,m.source_id,m.source_document_id,m.primary_unit_id,m.leader_id,m.office_owner_id,m.office_owner_text,
    m.content,m.field,m.note,m.assigned_date,m.start_date,m.original_due_date,m.current_due_date,m.execution_status,m.priority,m.progress_percent,
    m.completed_date,m.completion_summary,m.confirmed_at,m.confirmed_by,m.due_date_at_completion,m.archived_at,m.archived_by,m.archived_reason,
    m.created_at,m.created_by,m.updated_at,m.updated_by,m.row_version,
    public.days_remaining(m.current_due_date,p_as_of),public.deadline_status(m.execution_status,m.current_due_date,p_as_of),
    m.completion_state,m.extension_state,m.expedite_count
  from public.task_read_model m
  where (m.archived_at is null or coalesce((p_filters->>'include_archived')::boolean,false))
    and (nullif(p_filters->>'search','') is null or position(private.normalized(p_filters->>'search') in
      private.normalized(concat_ws(' ',m.code,m.external_ref,m.content,
        (select s.reference_no from public.source_documents s where s.id = m.source_document_id)))) > 0)
    and (p_filters->>'year' is null or extract(year from m.assigned_date) = (p_filters->>'year')::integer)
    and (not (p_filters ? 'source_ids') or m.source_id in (select value::uuid from jsonb_array_elements_text(p_filters->'source_ids')))
    and (not (p_filters ? 'unit_ids') or m.primary_unit_id in (select value::uuid from jsonb_array_elements_text(p_filters->'unit_ids')))
    and (not (p_filters ? 'leader_ids') or m.leader_id in (select value::uuid from jsonb_array_elements_text(p_filters->'leader_ids')))
    and (p_filters->>'execution_status' is null or case p_filters->>'execution_status'
      when 'PENDING' then m.execution_status <> 'DA_HOAN_THANH'
      when 'LATE' then m.completion_state = 'HOAN_THANH_CHAM_HAN'
      else m.execution_status = p_filters->>'execution_status' end)
    and (p_filters->>'deadline_state' is null or public.deadline_status(m.execution_status,m.current_due_date,p_as_of) = p_filters->>'deadline_state')
    and (p_filters->>'extension_state' is null or m.extension_state = p_filters->>'extension_state')
    and (p_filters->>'assigned_from' is null or m.assigned_date >= (p_filters->>'assigned_from')::date)
    and (p_filters->>'assigned_to' is null or m.assigned_date <= (p_filters->>'assigned_to')::date)
    and (p_filters->>'priority' is null or m.priority = p_filters->>'priority')
    and (p_filters->>'coordinator_id' is null or exists (select 1 from public.task_coordinating_units c
      where c.task_id = m.id and c.unit_id = (p_filters->>'coordinator_id')::uuid))
    and (p_filters->>'expedited' is null or (m.expedite_count > 0) = (p_filters->>'expedited')::boolean)
  order by case public.deadline_status(m.execution_status,m.current_due_date,p_as_of)
    when 'QUA_HAN' then 0 when 'SAP_DEN_HAN_KHAN' then 1 when 'NGUY_CO_CHAM' then 2 when 'CON_HAN' then 3 else 4 end,
    m.current_due_date,m.id;
end;
$$;
create function public.dashboard_kpi(p_filters jsonb default '{}'::jsonb, p_as_of date default public.business_today()) returns jsonb
language plpgsql stable security invoker set search_path = ''
as $$
declare v_result jsonb;
begin
  if not private.can_read() then raise exception using errcode = '42501', message = 'Không có quyền xem thống kê.'; end if;
  select jsonb_build_object('as_of',p_as_of,'total',count(distinct id),
    'completed',count(distinct id) filter (where execution_status = 'DA_HOAN_THANH'),
    'pending',count(distinct id) filter (where execution_status <> 'DA_HOAN_THANH'),
    'on_track',count(distinct id) filter (where deadline_state = 'CON_HAN'),
    'risk',count(distinct id) filter (where deadline_state = 'NGUY_CO_CHAM'),
    'urgent',count(distinct id) filter (where deadline_state = 'SAP_DEN_HAN_KHAN'),
    'overdue',count(distinct id) filter (where deadline_state = 'QUA_HAN'),
    'late_completed',count(distinct id) filter (where completion_state = 'HOAN_THANH_CHAM_HAN'),
    'requesting_extension',count(distinct id) filter (where extension_state = 'DANG_XIN'),
    'expedited_tasks',count(distinct id) filter (where expedite_count > 0),
    'expedite_total',coalesce(sum(expedite_count),0)) into v_result from public.filtered_tasks(p_filters,p_as_of);
  return v_result;
end;
$$;
create function public.report_by_unit(p_filters jsonb default '{}'::jsonb, p_as_of date default public.business_today())
returns table(unit_id uuid,unit_code text,unit_name text,total bigint,completed bigint,pending bigint,
  risk bigint,urgent bigint,overdue bigint,late_completed bigint,requesting_extension bigint,as_of date)
language plpgsql stable security invoker set search_path = ''
as $$
begin
  if not private.can_read() then raise exception using errcode = '42501', message = 'Không có quyền xem báo cáo.'; end if;
  return query
  with filtered as materialized (select * from public.filtered_tasks(p_filters,p_as_of))
  select u.id,u.code,u.name,count(distinct f.id),
    count(distinct f.id) filter (where f.execution_status = 'DA_HOAN_THANH'),
    count(distinct f.id) filter (where f.execution_status <> 'DA_HOAN_THANH'),
    count(distinct f.id) filter (where f.deadline_state = 'NGUY_CO_CHAM'),
    count(distinct f.id) filter (where f.deadline_state = 'SAP_DEN_HAN_KHAN'),
    count(distinct f.id) filter (where f.deadline_state = 'QUA_HAN'),
    count(distinct f.id) filter (where f.completion_state = 'HOAN_THANH_CHAM_HAN'),
    count(distinct f.id) filter (where f.extension_state = 'DANG_XIN'),p_as_of
  from public.units u left join filtered f on f.primary_unit_id = u.id
  group by u.id,u.code,u.name,u.sort_order order by u.sort_order,u.code;
end;
$$;
revoke all on function public.filtered_tasks(jsonb,date),public.dashboard_kpi(jsonb,date),public.report_by_unit(jsonb,date)
  from public, anon, authenticated;
grant execute on function public.filtered_tasks(jsonb,date),public.dashboard_kpi(jsonb,date),public.report_by_unit(jsonb,date) to authenticated;

-- All referenced FK columns get an index with the FK as its leading column.
-- Limit catalog-driven DDL to the tables owned by this application.
do $fk_indexes$
declare r record;
begin
  for r in select c.conrelid::regclass as relation_name, t.relname, a.attname
    from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and cardinality(c.conkey) = 1
      and ((n.nspname = 'public' and t.relname in ('profiles','user_roles','source_documents','tasks','task_coordinating_units',
        'task_progress_updates','expedite_documents','expedite_document_tasks','extension_requests','attachments','audit_logs','import_jobs','import_job_rows'))
        or (n.nspname = 'private' and t.relname = 'operation_requests'))
      and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1] and i.indpred is null)
  loop
    execute format('create index %I on %s (%I)',r.relname || '_' || r.attname || '_fk_idx',r.relation_name,r.attname);
  end loop;
end;
$fk_indexes$;

-- Require an isolated project: existing permissive Storage policies could OR-bypass ours.
-- Fail for review rather than delete policies belonging to another application.
do $storage_preflight$
begin
  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects') then
    raise exception 'Storage policies already exist. Review project isolation before applying this migration.';
  end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects' and c.relrowsecurity) then
    raise exception 'Supabase storage.objects must already have RLS enabled';
  end if;
  if exists (select 1 from storage.buckets where id = 'task-documents') then
    raise exception 'task-documents bucket already exists. Review settings before migration.';
  end if;
end;
$storage_preflight$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('task-documents','task-documents',false,10485760,array['application/pdf','image/jpeg','image/png']);
grant select on storage.objects to huong_do_executor;
create policy huong_do_internal_object_read on storage.objects for select to huong_do_executor
using (bucket_id = 'task-documents');
create policy huong_do_object_read on storage.objects for select to authenticated
using (bucket_id = 'task-documents' and (select private.can_read()) and exists
  (select 1 from public.attachments a where a.bucket_id = storage.objects.bucket_id and a.object_path = storage.objects.name
    and (a.upload_state = 'READY' or a.created_by = (select auth.uid()) or (select private.has_role(array['ADMIN'])))));
-- No INSERT/UPDATE/DELETE policy: upload/verification comes in a later approved step.
