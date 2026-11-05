-- Atomic transaction is managed by the Supabase migration runner.
create sequence private.task_code_seq;
revoke all on sequence private.task_code_seq from public, anon, authenticated;
grant usage on sequence private.task_code_seq to huong_do_executor;

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('VAN_BAN','KET_LUAN_CUOC_HOP')),
  reference_no text, issued_date date, issuer text, summary text not null check (btrim(summary) <> ''), meeting_name text,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id),
  row_version bigint not null default 1 check (row_version > 0)
);
create index source_documents_reference_idx on public.source_documents(reference_no, issued_date, issuer);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), code text not null unique,
  external_ref text,
  source_id uuid not null references public.task_sources(id),
  source_document_id uuid references public.source_documents(id),
  primary_unit_id uuid not null references public.units(id),
  leader_id uuid not null references public.leaders(id),
  office_owner_id uuid references public.profiles(id), office_owner_text text,
  content text not null check (btrim(content) <> ''), field text, note text,
  assigned_date date not null, start_date date,
  original_due_date date not null, current_due_date date not null,
  execution_status text not null default 'CHUA_THUC_HIEN'
    check (execution_status in ('CHUA_THUC_HIEN','DANG_THUC_HIEN','DA_HOAN_THANH')),
  priority text not null default 'NORMAL' check (priority in ('NORMAL','HIGH','URGENT')),
  progress_percent integer check (progress_percent between 0 and 100),
  completed_date date, completion_summary text, confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id), due_date_at_completion date,
  archived_at timestamptz, archived_by uuid references public.profiles(id), archived_reason text,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id),
  row_version bigint not null default 1 check (row_version > 0),
  constraint tasks_dates check (original_due_date >= assigned_date and current_due_date >= original_due_date
    and (start_date is null or start_date >= assigned_date)),
  constraint tasks_completed_bundle check (
    (execution_status = 'DA_HOAN_THANH' and completed_date is not null and completed_date >= assigned_date
      and completion_summary is not null and btrim(completion_summary) <> ''
      and confirmed_at is not null and confirmed_by is not null and due_date_at_completion is not null)
    or (execution_status <> 'DA_HOAN_THANH' and completed_date is null and completion_summary is null
      and confirmed_at is null and confirmed_by is null and due_date_at_completion is null)),
  constraint tasks_archive_bundle check (
    (archived_at is null and archived_by is null and archived_reason is null)
    or (archived_at is not null and archived_by is not null and btrim(archived_reason) <> '' and archived_reason is not null))
);
-- PostgreSQL UTF-8 normalizer: deterministic NFC + spaces + case; empty refs become NULL.
create function private.normalized(p_value text) returns text
language sql immutable strict security invoker set search_path = ''
as $$ select lower(regexp_replace(btrim(normalize(p_value, NFC)), '\s+', ' ', 'g')); $$;
revoke all on function private.normalized(text) from public, anon, authenticated;
grant execute on function private.normalized(text) to huong_do_executor;
create unique index tasks_external_ref_unique on public.tasks(private.normalized(external_ref))
  where external_ref is not null;
alter table public.tasks add constraint tasks_external_ref_nonempty check (external_ref is null or btrim(external_ref) <> '');
create index tasks_unit_date_idx on public.tasks(primary_unit_id, assigned_date) where archived_at is null;
create index tasks_source_date_idx on public.tasks(source_id, assigned_date) where archived_at is null;
create index tasks_leader_date_idx on public.tasks(leader_id, assigned_date) where archived_at is null;
create index tasks_deadline_idx on public.tasks(execution_status, current_due_date) where archived_at is null;
create index tasks_assigned_idx on public.tasks(assigned_date, id);
create index tasks_document_idx on public.tasks(source_document_id);

create table public.task_coordinating_units (
  task_id uuid not null references public.tasks(id), unit_id uuid not null references public.units(id),
  primary key(task_id, unit_id)
);
create index coordinating_unit_task_idx on public.task_coordinating_units(unit_id, task_id);
create table public.task_progress_updates (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id),
  progress_date date not null, content text not null check (btrim(content) <> ''),
  progress_percent integer check (progress_percent between 0 and 100), difficulty text,
  created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id)
);
create index progress_task_date_idx on public.task_progress_updates(task_id, progress_date desc);
create table public.expedite_documents (
  id uuid primary key default gen_random_uuid(), reference_no text not null check (btrim(reference_no) <> ''),
  issued_date date not null, sent_date date, issuer text not null check (btrim(issuer) <> ''),
  signer text, summary text, content text not null check (btrim(content) <> ''), response_due_date date,
  cancelled_at timestamptz, cancelled_by uuid references public.profiles(id), cancel_reason text,
  created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id),
  row_version bigint not null default 1 check (row_version > 0),
  check ((cancelled_at is null and cancelled_by is null and cancel_reason is null)
    or (cancelled_at is not null and cancelled_by is not null and cancel_reason is not null and btrim(cancel_reason) <> ''))
);
create unique index expedite_document_identity on public.expedite_documents
  (private.normalized(reference_no), issued_date, private.normalized(issuer));
create table public.expedite_document_tasks (
  expedite_document_id uuid not null references public.expedite_documents(id),
  task_id uuid not null references public.tasks(id), primary key(expedite_document_id, task_id)
);
create index expedite_task_document_idx on public.expedite_document_tasks(task_id, expedite_document_id);
create table public.extension_requests (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id),
  sequence_no integer not null check (sequence_no > 0), requesting_unit_id uuid not null references public.units(id),
  request_no text not null check (btrim(request_no) <> ''), request_date date not null,
  reason text not null check (btrim(reason) <> ''), previous_due_date date not null, proposed_due_date date not null,
  state text not null default 'DANG_XIN' check (state in ('DANG_XIN','DA_DUOC_GIA_HAN','KHONG_DUOC_CHAP_THUAN')),
  response_no text, response_date date, response_issuer text, response_signer text, approved_due_date date,
  resolved_at timestamptz, resolved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id),
  row_version bigint not null default 1 check (row_version > 0),
  unique(task_id, sequence_no), check (proposed_due_date > previous_due_date),
  constraint extension_result_bundle check (
    (state = 'DANG_XIN' and response_no is null and response_date is null and resolved_at is null
      and resolved_by is null and approved_due_date is null and response_issuer is null and response_signer is null)
    or (state in ('DA_DUOC_GIA_HAN','KHONG_DUOC_CHAP_THUAN') and response_no is not null and btrim(response_no) <> ''
      and response_date is not null and resolved_at is not null and resolved_by is not null
      and ((state = 'DA_DUOC_GIA_HAN' and approved_due_date is not null and approved_due_date > previous_due_date)
        or (state = 'KHONG_DUOC_CHAP_THUAN' and approved_due_date is null))))
);
create unique index one_pending_extension_per_task on public.extension_requests(task_id) where state = 'DANG_XIN';
create index extensions_unit_idx on public.extension_requests(requesting_unit_id);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id), source_document_id uuid references public.source_documents(id),
  progress_update_id uuid references public.task_progress_updates(id),
  expedite_document_id uuid references public.expedite_documents(id), extension_request_id uuid references public.extension_requests(id),
  purpose text not null check (purpose in ('TASK_RESULT','SOURCE','PROGRESS','EXPEDITE','EXTENSION_REQUEST','EXTENSION_RESPONSE')),
  bucket_id text not null default 'task-documents' check (bucket_id = 'task-documents'), object_path text not null,
  original_name text not null check (btrim(original_name) <> ''), mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760), sha256 text check (sha256 ~ '^[a-f0-9]{64}$'),
  verified_at timestamptz, verified_by uuid references public.profiles(id),
  upload_state text not null default 'PENDING' check (upload_state in ('PENDING','READY','REJECTED')),
  created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id), expires_at timestamptz,
  unique(bucket_id, object_path), check (object_path !~ '(^/|\.\.|\\)'),
  check (num_nonnulls(task_id, source_document_id, progress_update_id, expedite_document_id, extension_request_id) <= 1),
  check (upload_state <> 'READY' or
    (verified_at is not null and verified_by is not null
      and num_nonnulls(task_id, source_document_id, progress_update_id, expedite_document_id, extension_request_id) = 1
      and case purpose when 'TASK_RESULT' then task_id is not null when 'SOURCE' then source_document_id is not null
      when 'PROGRESS' then progress_update_id is not null when 'EXPEDITE' then expedite_document_id is not null
      else extension_request_id is not null end)),
  check (upload_state <> 'PENDING' or expires_at is not null),
  check (mime_type in ('application/pdf','image/jpeg','image/png'))
);
create index attachments_task_idx on public.attachments(task_id);
create index attachments_source_idx on public.attachments(source_document_id);
create index attachments_progress_idx on public.attachments(progress_update_id);
create index attachments_expedite_idx on public.attachments(expedite_document_id);
create index attachments_extension_idx on public.attachments(extension_request_id, purpose);
create index attachments_pending_idx on public.attachments(upload_state, expires_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id),
  actor_name_snapshot text not null, entity_type text not null, entity_id uuid, task_id uuid references public.tasks(id),
  action text not null, before_data jsonb, after_data jsonb, reason text, request_id uuid,
  occurred_at timestamptz not null default now()
);
create index audit_task_time_idx on public.audit_logs(task_id, occurred_at, id);
create index audit_entity_time_idx on public.audit_logs(entity_type, entity_id, occurred_at);
create index audit_actor_idx on public.audit_logs(actor_id);
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(), file_name text not null, file_hash text not null check (file_hash ~ '^[a-f0-9]{64}$'),
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  status text not null check (status in ('PREVIEW','INVALID','READY','COMMITTED','FAILED')),
  parser_version text not null, preview_hash text, confirmed_at timestamptz,
  counts jsonb not null default '{}'::jsonb check (jsonb_typeof(counts) = 'object'),
  request_id uuid unique, error_summary text
);
create index import_jobs_actor_idx on public.import_jobs(created_by, created_at);
create table public.import_job_rows (
  id uuid primary key default gen_random_uuid(), import_job_id uuid not null references public.import_jobs(id),
  excel_row_no integer not null check (excel_row_no >= 6), normalized_data jsonb not null,
  errors jsonb not null default '[]'::jsonb check (jsonb_typeof(errors) = 'array'),
  duplicate_action text not null default 'SKIP' check (duplicate_action in ('SKIP','UPDATE','CREATE')),
  matched_task_id uuid references public.tasks(id), expected_row_version bigint, result jsonb,
  unique(import_job_id, excel_row_no)
);
create index import_rows_task_idx on public.import_job_rows(matched_task_id);
create table private.operation_requests (
  id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.profiles(id),
  operation text not null, idempotency_key uuid not null, payload_hash text not null,
  result_ref uuid, created_at timestamptz not null default now(), unique(actor_id, operation, idempotency_key)
);
alter table private.operation_requests enable row level security;
revoke all on private.operation_requests from public, anon, authenticated;
grant select, insert, update on private.operation_requests to huong_do_executor;
create policy executor_operations on private.operation_requests for all to huong_do_executor using (true) with check (true);

-- New tables are secured before this migration commits. No direct client DML.
do $secure$
declare n text;
begin
  foreach n in array array['source_documents','tasks','task_coordinating_units','task_progress_updates',
    'expedite_documents','expedite_document_tasks','extension_requests','attachments','audit_logs','import_jobs','import_job_rows']
  loop
    execute format('alter table public.%I enable row level security', n);
    execute format('revoke all on public.%I from public, anon, authenticated', n);
    execute format('grant select on public.%I to authenticated', n);
    execute format('grant select, insert on public.%I to huong_do_executor', n);
    execute format('create policy executor_internal on public.%I for all to huong_do_executor using (true) with check (true)', n);
  end loop;
end;
$secure$;
grant update on public.source_documents, public.tasks, public.expedite_documents, public.extension_requests,
  public.attachments, public.import_jobs, public.import_job_rows to huong_do_executor;
grant delete on public.task_coordinating_units, public.expedite_document_tasks to huong_do_executor;

create policy documents_read on public.source_documents for select to authenticated using ((select private.can_read()));
create policy tasks_read on public.tasks for select to authenticated using ((select private.can_read()));
create policy coordinating_read on public.task_coordinating_units for select to authenticated using ((select private.can_read()));
create policy progress_read on public.task_progress_updates for select to authenticated using ((select private.can_read()));
create policy expedites_read on public.expedite_documents for select to authenticated using ((select private.can_read()));
create policy expedite_links_read on public.expedite_document_tasks for select to authenticated using ((select private.can_read()));
create policy extensions_read on public.extension_requests for select to authenticated using ((select private.can_read()));
create policy attachments_read on public.attachments for select to authenticated using (
  (select private.can_read()) and (upload_state = 'READY' or created_by = (select auth.uid()) or (select private.has_role(array['ADMIN']))));
create policy audit_read on public.audit_logs for select to authenticated using (
  (select private.has_role(array['ADMIN'])) or (task_id is not null and (select private.can_read())));
create policy import_jobs_read on public.import_jobs for select to authenticated using (
  (select private.can_read()) and (created_by = (select auth.uid()) or (select private.has_role(array['ADMIN']))));
create policy import_rows_read on public.import_job_rows for select to authenticated using (
  exists (select 1 from public.import_jobs j where j.id = import_job_id));
