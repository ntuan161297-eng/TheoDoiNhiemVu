-- Atomic transaction is managed by the Supabase migration runner.
create function public.business_today() returns date
language sql stable security invoker set search_path = ''
as $$ select (statement_timestamp() at time zone 'Asia/Ho_Chi_Minh')::date; $$;
create function public.days_remaining(p_due date, p_as_of date default public.business_today()) returns integer
language sql immutable strict security invoker set search_path = ''
as $$ select p_due - p_as_of; $$;
create function public.deadline_status(p_status text, p_due date, p_as_of date default public.business_today()) returns text
language sql immutable security invoker set search_path = ''
as $$ select case when p_status = 'DA_HOAN_THANH' then null
  when p_due is null or p_as_of is null then 'DU_LIEU_KHONG_HOP_LE'
  when p_due - p_as_of < 0 then 'QUA_HAN'
  when p_due - p_as_of <= 2 then 'SAP_DEN_HAN_KHAN'
  when p_due - p_as_of <= 5 then 'NGUY_CO_CHAM' else 'CON_HAN' end; $$;
create function public.completion_classification(p_status text, p_completed date, p_snapshot date) returns text
language sql immutable security invoker set search_path = ''
as $$ select case when p_status <> 'DA_HOAN_THANH' then null
  when p_completed is null or p_snapshot is null then 'DU_LIEU_KHONG_HOP_LE'
  when p_completed <= p_snapshot then 'HOAN_THANH_DUNG_HAN' else 'HOAN_THANH_CHAM_HAN' end; $$;
revoke all on function public.business_today(), public.days_remaining(date,date), public.deadline_status(text,date,date),
  public.completion_classification(text,date,date) from public, anon, authenticated;
grant execute on function public.business_today(), public.days_remaining(date,date), public.deadline_status(text,date,date),
  public.completion_classification(text,date,date) to authenticated, huong_do_executor;

create function private.reject_history_mutation() returns trigger
language plpgsql security invoker set search_path = ''
as $$ begin raise exception using errcode = '42501', message = 'Lịch sử chỉ được bổ sung, không được sửa hoặc xóa.'; end; $$;
create trigger immutable_audit before update or delete or truncate on public.audit_logs
for each statement execute function private.reject_history_mutation();
create trigger immutable_progress before update or delete or truncate on public.task_progress_updates
for each statement execute function private.reject_history_mutation();

create function private.stamp_row() returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.row_version := old.row_version + 1;
  else
    new.created_at := statement_timestamp();
    new.created_by := auth.uid();
    new.row_version := 1;
  end if;
  new.updated_at := statement_timestamp();
  new.updated_by := auth.uid();
  return new;
end;
$$;
create trigger stamp_task before insert or update on public.tasks for each row execute function private.stamp_row();
create trigger stamp_document before insert or update on public.source_documents for each row execute function private.stamp_row();
create trigger stamp_expedite before insert or update on public.expedite_documents for each row execute function private.stamp_row();
create trigger stamp_extension before insert or update on public.extension_requests for each row execute function private.stamp_row();

create function private.guard_task() returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.current_due_date <> new.original_due_date or new.execution_status = 'DA_HOAN_THANH' then
      raise exception using errcode = '23514', message = 'Tạo nhiệm vụ trước; xác nhận và gia hạn qua nghiệp vụ riêng.';
    end if;
  else
    if (new.id, new.code, new.original_due_date) is distinct from (old.id, old.code, old.original_due_date) then
      raise exception using errcode = '23514', message = 'ID, mã và hạn gốc không được ghi đè.';
    end if;
    if old.execution_status = 'DA_HOAN_THANH' and
      (new.execution_status, new.completed_date, new.completion_summary, new.confirmed_at, new.confirmed_by, new.due_date_at_completion)
      is distinct from
      (old.execution_status, old.completed_date, old.completion_summary, old.confirmed_at, old.confirmed_by, old.due_date_at_completion) then
      raise exception using errcode = '23514', message = 'Không hồi tố kết quả hoàn thành đã xác nhận.';
    end if;
  end if;
  if new.execution_status = 'DA_HOAN_THANH' and (tg_op = 'INSERT' or old.execution_status <> 'DA_HOAN_THANH') then
    perform private.require_role(array['ADMIN','OFFICE_CONFIRMER']);
    if new.completed_date > public.business_today() or new.confirmed_by is distinct from auth.uid()
      or new.due_date_at_completion is distinct from new.current_due_date then
      raise exception using errcode = '23514', message = 'Ngày hoàn thành, người xác nhận hoặc snapshot không hợp lệ.';
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_task before insert or update on public.tasks for each row execute function private.guard_task();

create function private.check_task_relations() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_task_id uuid; v_task public.tasks%rowtype; v_due date;
begin
  if tg_table_name = 'tasks' then v_task_id := coalesce(new.id, old.id);
  else v_task_id := coalesce(new.task_id, old.task_id); end if;
  select * into v_task from public.tasks where id = v_task_id;
  if not found then return null; end if;
  if exists (select 1 from public.task_coordinating_units c where c.task_id = v_task_id and c.unit_id = v_task.primary_unit_id) then
    raise exception using errcode = '23514', message = 'Đơn vị phối hợp không được trùng chủ trì.';
  end if;
  select e.approved_due_date into v_due from public.extension_requests e
    where e.task_id = v_task_id and e.state = 'DA_DUOC_GIA_HAN' order by e.sequence_no desc limit 1;
  if v_task.current_due_date is distinct from coalesce(v_due, v_task.original_due_date) then
    raise exception using errcode = '23514', message = 'Hạn hiệu lực phải khớp quyết định gia hạn đã áp dụng.';
  end if;
  return null;
end;
$$;
alter function private.check_task_relations() owner to huong_do_executor;
create constraint trigger task_relations after insert or update on public.tasks
deferrable initially deferred for each row execute function private.check_task_relations();
create constraint trigger coordinator_relations after insert or update or delete on public.task_coordinating_units
deferrable initially deferred for each row execute function private.check_task_relations();
create constraint trigger extension_task_relations after insert or update or delete on public.extension_requests
deferrable initially deferred for each row execute function private.check_task_relations();

create function private.guard_extension() returns trigger
language plpgsql security invoker set search_path = ''
as $$
declare v_task public.tasks%rowtype;
begin
  select * into strict v_task from public.tasks where id = new.task_id for update;
  if v_task.archived_at is not null or v_task.execution_status = 'DA_HOAN_THANH' then
    raise exception using errcode = '23514', message = 'Không gia hạn nhiệm vụ đã hoàn thành/lưu trữ.';
  end if;
  if tg_op = 'INSERT' then
    if new.state <> 'DANG_XIN' or new.previous_due_date <> v_task.current_due_date then
      raise exception using errcode = '23514', message = 'Đề nghị mới phải chờ xét và giữ snapshot hạn hiện tại.';
    end if;
  else
    if old.state <> 'DANG_XIN' or new.state = 'DANG_XIN' or
      (new.id,new.task_id,new.sequence_no,new.request_no,new.request_date,new.reason,new.requesting_unit_id,new.previous_due_date,new.proposed_due_date)
      is distinct from
      (old.id,old.task_id,old.sequence_no,old.request_no,old.request_date,old.reason,old.requesting_unit_id,old.previous_due_date,old.proposed_due_date) then
      raise exception using errcode = '23514', message = 'Hồ sơ đề nghị và kết quả đã ghi nhận không sửa bằng CRUD thông thường.';
    end if;
    perform private.require_role(array['ADMIN','OFFICE_CONFIRMER']);
    if new.state = 'DA_DUOC_GIA_HAN' and new.approved_due_date <= v_task.current_due_date then
      raise exception using errcode = '23514', message = 'Hạn duyệt phải sau hạn hiệu lực hiện tại.';
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_extension before insert or update on public.extension_requests
for each row execute function private.guard_extension();
create trigger extension_no_delete before delete or truncate on public.extension_requests
for each statement execute function private.reject_history_mutation();

create function private.check_document_evidence() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_extension uuid; v_expedite uuid; v_state text;
begin
  if tg_table_name = 'extension_requests' then v_extension := new.id;
  elsif tg_table_name = 'expedite_documents' then v_expedite := new.id;
  elsif tg_table_name = 'expedite_document_tasks' then v_expedite := coalesce(new.expedite_document_id, old.expedite_document_id);
  else
    v_extension := coalesce(new.extension_request_id, old.extension_request_id);
    v_expedite := coalesce(new.expedite_document_id, old.expedite_document_id);
  end if;
  if v_extension is not null then
    select state into v_state from public.extension_requests where id = v_extension;
    if found and (not exists (select 1 from public.attachments where extension_request_id = v_extension
        and purpose = 'EXTENSION_REQUEST' and upload_state = 'READY')
      or (v_state <> 'DANG_XIN' and not exists (select 1 from public.attachments where extension_request_id = v_extension
        and purpose = 'EXTENSION_RESPONSE' and upload_state = 'READY'))) then
      raise exception using errcode = '23514', message = 'Hồ sơ gia hạn thiếu file đề nghị/phản hồi.';
    end if;
  end if;
  if v_expedite is not null and exists (select 1 from public.expedite_documents where id = v_expedite) and
    (not exists (select 1 from public.expedite_document_tasks where expedite_document_id = v_expedite)
      or not exists (select 1 from public.attachments where expedite_document_id = v_expedite
        and purpose = 'EXPEDITE' and upload_state = 'READY')) then
    raise exception using errcode = '23514', message = 'Văn bản đôn đốc phải có nhiệm vụ và file.';
  end if;
  return null;
end;
$$;
alter function private.check_document_evidence() owner to huong_do_executor;
create constraint trigger extension_evidence after insert or update on public.extension_requests
deferrable initially deferred for each row execute function private.check_document_evidence();
create constraint trigger expedite_evidence after insert or update on public.expedite_documents
deferrable initially deferred for each row execute function private.check_document_evidence();
create constraint trigger expedite_links_evidence after insert or update or delete on public.expedite_document_tasks
deferrable initially deferred for each row execute function private.check_document_evidence();
create constraint trigger attachment_evidence after insert or update or delete on public.attachments
deferrable initially deferred for each row execute function private.check_document_evidence();

create function private.guard_attachment() returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if old.upload_state = 'READY' then
    raise exception using errcode = '23514', message = 'Không ghi đè, chuyển chủ thể hoặc xóa file chứng cứ.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if (new.id,new.bucket_id,new.object_path,new.created_by) is distinct from (old.id,old.bucket_id,old.object_path,old.created_by) then
    raise exception using errcode = '23514', message = 'Định danh upload không được thay đổi.';
  end if;
  return new;
end;
$$;
create trigger attachment_guard before update or delete on public.attachments
for each row execute function private.guard_attachment();

create function private.audit_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_before jsonb; v_after jsonb; v_row jsonb; v_actor uuid; v_name text; v_task uuid;
begin
  if tg_op <> 'INSERT' then v_before := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_after := to_jsonb(new); end if;
  v_row := coalesce(v_after, v_before);
  v_actor := auth.uid();
  select display_name into v_name from public.profiles where id = v_actor;
  if tg_table_name = 'tasks' then v_task := (v_row->>'id')::uuid;
  elsif tg_table_name in ('task_progress_updates','task_coordinating_units','expedite_document_tasks','extension_requests') then
    v_task := (v_row->>'task_id')::uuid;
  elsif tg_table_name = 'attachments' then
    v_task := (v_row->>'task_id')::uuid;
    if v_task is null and v_row->>'progress_update_id' is not null then
      select task_id into v_task from public.task_progress_updates where id = (v_row->>'progress_update_id')::uuid;
    elsif v_task is null and v_row->>'extension_request_id' is not null then
      select task_id into v_task from public.extension_requests where id = (v_row->>'extension_request_id')::uuid;
    end if;
  end if;
  insert into public.audit_logs(actor_id,actor_name_snapshot,entity_type,entity_id,task_id,action,before_data,after_data)
    values(v_actor,coalesce(v_name,'Hệ thống / quản trị database'),tg_table_name,
      coalesce(v_row->>'id',v_row->>'user_id',v_row->>'task_id')::uuid,v_task,tg_op,v_before,v_after);
  -- Shared document updates must remain visible in each related task timeline.
  if tg_table_name = 'expedite_documents' then
    insert into public.audit_logs(actor_id,actor_name_snapshot,entity_type,entity_id,task_id,action,before_data,after_data)
      select v_actor,coalesce(v_name,'Hệ thống / quản trị database'),tg_table_name,(v_row->>'id')::uuid,l.task_id,tg_op,v_before,v_after
      from public.expedite_document_tasks l where l.expedite_document_id = (v_row->>'id')::uuid;
  elsif tg_table_name = 'source_documents' then
    insert into public.audit_logs(actor_id,actor_name_snapshot,entity_type,entity_id,task_id,action,before_data,after_data)
      select v_actor,coalesce(v_name,'Hệ thống / quản trị database'),tg_table_name,(v_row->>'id')::uuid,t.id,tg_op,v_before,v_after
      from public.tasks t where t.source_document_id = (v_row->>'id')::uuid;
  elsif tg_table_name = 'attachments' and v_row->>'expedite_document_id' is not null then
    insert into public.audit_logs(actor_id,actor_name_snapshot,entity_type,entity_id,task_id,action,before_data,after_data)
      select v_actor,coalesce(v_name,'Hệ thống / quản trị database'),tg_table_name,(v_row->>'id')::uuid,l.task_id,tg_op,v_before,v_after
      from public.expedite_document_tasks l where l.expedite_document_id = (v_row->>'expedite_document_id')::uuid;
  end if;
  return null;
end;
$$;
alter function private.audit_change() owner to huong_do_executor;
do $audit$
declare n text;
begin
  foreach n in array array['profiles','user_roles','units','leaders','task_sources','source_documents','tasks',
    'task_coordinating_units','task_progress_updates','expedite_documents','expedite_document_tasks','extension_requests','attachments','import_jobs','import_job_rows']
  loop
    execute format('create trigger record_audit after insert or update or delete on public.%I for each row execute function private.audit_change()', n);
  end loop;
end;
$audit$;
-- Only trigger invocation, no direct EXECUTE from API users.
revoke all on function private.reject_history_mutation(), private.stamp_row(), private.guard_task(),
  private.check_task_relations(), private.guard_extension(), private.check_document_evidence(),
  private.guard_attachment(), private.audit_change() from public, anon, authenticated;
grant execute on function private.reject_history_mutation(), private.stamp_row(), private.guard_task(),
  private.guard_extension(), private.guard_attachment() to huong_do_executor;
