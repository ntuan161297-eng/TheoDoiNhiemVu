-- Atomic transaction is managed by the Supabase migration runner.
create function private.begin_operation(p_operation text, p_key uuid, p_payload jsonb) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare v_hash text; v_request private.operation_requests%rowtype;
begin
  if p_key is null then raise exception using errcode = '22023', message = 'Thiếu idempotency key.'; end if;
  v_hash := encode(sha256(convert_to(p_payload::text, 'UTF8')), 'hex');
  insert into private.operation_requests(actor_id,operation,idempotency_key,payload_hash)
    values(auth.uid(),p_operation,p_key,v_hash) on conflict do nothing;
  select * into strict v_request from private.operation_requests
    where actor_id = auth.uid() and operation = p_operation and idempotency_key = p_key for update;
  if v_request.payload_hash <> v_hash then
    raise exception using errcode = '22023', message = 'Idempotency key đã dùng cho nội dung khác.';
  end if;
  return v_request.result_ref;
end;
$$;
create function private.finish_operation(p_operation text, p_key uuid, p_result uuid) returns void
language sql security invoker set search_path = ''
as $$ update private.operation_requests set result_ref = p_result
  where actor_id = auth.uid() and operation = p_operation and idempotency_key = p_key; $$;

create function private.save_source_document(p_payload jsonb, p_id uuid, p_expected bigint, p_key uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_old public.source_documents%rowtype;
begin
  perform private.require_role(array['ADMIN','OFFICE_EDITOR','OFFICE_CONFIRMER']);
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or exists
    (select 1 from jsonb_object_keys(p_payload) k where k <> all(array['document_type','reference_no','issued_date','issuer','summary','meeting_name'])) then
    raise exception using errcode = '22023', message = 'Trường văn bản căn cứ không hợp lệ.';
  end if;
  v_id := private.begin_operation('save_source_document',p_key,jsonb_build_object('data',p_payload,'id',p_id,'version',p_expected));
  if v_id is not null then return v_id; end if;
  if p_id is null then
    insert into public.source_documents(document_type,reference_no,issued_date,issuer,summary,meeting_name)
    values(p_payload->>'document_type',nullif(btrim(p_payload->>'reference_no'),''),(p_payload->>'issued_date')::date,
      p_payload->>'issuer',p_payload->>'summary',p_payload->>'meeting_name') returning id into v_id;
  else
    select * into strict v_old from public.source_documents where id = p_id for update;
    if p_expected is null or v_old.row_version <> p_expected then
      raise exception using errcode = '40001', message = 'Văn bản đã thay đổi. Hãy tải lại.';
    end if;
    update public.source_documents set document_type = p_payload->>'document_type',reference_no = nullif(btrim(p_payload->>'reference_no'),''),
      issued_date = (p_payload->>'issued_date')::date,issuer = p_payload->>'issuer',summary = p_payload->>'summary',meeting_name = p_payload->>'meeting_name'
      where id = p_id returning id into v_id;
  end if;
  perform private.finish_operation('save_source_document',p_key,v_id);
  return v_id;
end;
$$;

create function private.save_task(p_payload jsonb, p_id uuid, p_expected bigint, p_coordinators uuid[], p_key uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_old public.tasks%rowtype; v_document uuid; v_source uuid; v_unit uuid; v_leader uuid;
begin
  perform private.require_role(array['ADMIN','OFFICE_EDITOR','OFFICE_CONFIRMER']);
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or exists
    (select 1 from jsonb_object_keys(p_payload) k where k <> all(array['external_ref','source_id','source_document_id',
      'new_source_document','primary_unit_id','leader_id','office_owner_id','office_owner_text','content','field','note',
      'assigned_date','start_date','original_due_date','execution_status','priority','progress_percent'])) then
    raise exception using errcode = '22023', message = 'Payload chứa trường bị bảo vệ/không hỗ trợ.';
  end if;
  v_id := private.begin_operation('save_task',p_key,jsonb_build_object('data',p_payload,'id',p_id,'version',p_expected,'coordinators',p_coordinators));
  if v_id is not null then return v_id; end if;
  if p_id is not null then
    select * into strict v_old from public.tasks where id = p_id for update;
    if p_expected is null or v_old.row_version <> p_expected then
      raise exception using errcode = '40001', message = 'Nhiệm vụ đã thay đổi. Hãy tải lại.';
    end if;
    if v_old.archived_at is not null or v_old.execution_status = 'DA_HOAN_THANH' then
      raise exception using errcode = '23514', message = 'Nhiệm vụ đã hoàn thành/lưu trữ không sửa bằng form thường.';
    end if;
    if (p_payload->>'original_due_date')::date is distinct from v_old.original_due_date then
      raise exception using errcode = '23514', message = 'Hạn gốc đã lưu không được thay đổi.';
    end if;
  end if;
  if coalesce(p_payload->>'execution_status','CHUA_THUC_HIEN') not in ('CHUA_THUC_HIEN','DANG_THUC_HIEN') then
    raise exception using errcode = '23514', message = 'Xác nhận hoàn thành qua nghiệp vụ riêng.';
  end if;
  v_source := (p_payload->>'source_id')::uuid; v_unit := (p_payload->>'primary_unit_id')::uuid; v_leader := (p_payload->>'leader_id')::uuid;
  if not exists(select 1 from public.task_sources where id = v_source and is_active)
    or not exists(select 1 from public.units where id = v_unit and is_active)
    or not exists(select 1 from public.leaders where id = v_leader and is_active) then
    raise exception using errcode = '23514', message = 'Nguồn, chủ trì, lãnh đạo phải thuộc danh mục đang hoạt động.';
  end if;
  if v_unit = any(coalesce(p_coordinators,array[]::uuid[])) or exists
    (select 1 from unnest(coalesce(p_coordinators,array[]::uuid[])) u(id)
      where id is null or not exists (select 1 from public.units x where x.id = u.id and x.is_active)) then
    raise exception using errcode = '23514', message = 'Đơn vị phối hợp không hợp lệ/trùng chủ trì.';
  end if;
  v_document := (p_payload->>'source_document_id')::uuid;
  if p_payload ? 'new_source_document' then
    if v_document is not null then raise exception using errcode = '22023', message = 'Chỉ chọn một căn cứ.'; end if;
    v_document := private.save_source_document(p_payload->'new_source_document',null,null,p_key);
  end if;
  if p_id is null then
    insert into public.tasks(code,external_ref,source_id,source_document_id,primary_unit_id,leader_id,office_owner_id,
      office_owner_text,content,field,note,assigned_date,start_date,original_due_date,current_due_date,execution_status,priority,progress_percent)
    values('NV-' || extract(year from public.business_today())::text || '-' || lpad(nextval('private.task_code_seq')::text,8,'0'),
      nullif(btrim(p_payload->>'external_ref'),''),v_source,v_document,v_unit,v_leader,(p_payload->>'office_owner_id')::uuid,
      p_payload->>'office_owner_text',p_payload->>'content',p_payload->>'field',p_payload->>'note',
      (p_payload->>'assigned_date')::date,(p_payload->>'start_date')::date,(p_payload->>'original_due_date')::date,
      (p_payload->>'original_due_date')::date,coalesce(p_payload->>'execution_status','CHUA_THUC_HIEN'),
      coalesce(p_payload->>'priority','NORMAL'),(p_payload->>'progress_percent')::integer) returning id into v_id;
  else
    update public.tasks set external_ref = nullif(btrim(p_payload->>'external_ref'),''),source_id = v_source,
      source_document_id = v_document,primary_unit_id = v_unit,leader_id = v_leader,office_owner_id = (p_payload->>'office_owner_id')::uuid,
      office_owner_text = p_payload->>'office_owner_text',content = p_payload->>'content',field = p_payload->>'field',note = p_payload->>'note',
      assigned_date = (p_payload->>'assigned_date')::date,start_date = (p_payload->>'start_date')::date,
      execution_status = coalesce(p_payload->>'execution_status',v_old.execution_status),priority = coalesce(p_payload->>'priority','NORMAL'),
      progress_percent = (p_payload->>'progress_percent')::integer where id = p_id returning id into v_id;
  end if;
  delete from public.task_coordinating_units where task_id = v_id;
  insert into public.task_coordinating_units(task_id,unit_id)
    select v_id, u.id from (select distinct unnest(coalesce(p_coordinators,array[]::uuid[])) as id) u;
  perform private.finish_operation('save_task',p_key,v_id);
  return v_id;
end;
$$;

create function private.add_progress(p_task uuid, p_expected bigint, p_date date, p_content text, p_percent integer, p_difficulty text, p_key uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_task public.tasks%rowtype; v_result uuid;
begin
  perform private.require_role(array['ADMIN','OFFICE_EDITOR','OFFICE_CONFIRMER']);
  v_result := private.begin_operation('add_progress',p_key,jsonb_build_array(p_task,p_expected,p_date,p_content,p_percent,p_difficulty));
  if v_result is not null then return v_result; end if;
  select * into strict v_task from public.tasks where id = p_task for update;
  if p_expected is null or v_task.row_version <> p_expected then raise exception using errcode = '40001', message = 'Nhiệm vụ đã thay đổi.'; end if;
  if v_task.archived_at is not null or v_task.execution_status = 'DA_HOAN_THANH' or p_date is null
    or p_date < v_task.assigned_date or p_date > public.business_today() then
    raise exception using errcode = '23514', message = 'Trạng thái/ngày cập nhật không hợp lệ.';
  end if;
  insert into public.task_progress_updates(task_id,progress_date,content,progress_percent,difficulty,created_by)
    values(p_task,p_date,p_content,p_percent,p_difficulty,auth.uid()) returning id into v_result;
  update public.tasks set progress_percent = coalesce(p_percent,progress_percent),execution_status = 'DANG_THUC_HIEN' where id = p_task;
  perform private.finish_operation('add_progress',p_key,v_result);
  return v_result;
end;
$$;

create function private.confirm_completion(p_task uuid, p_expected bigint, p_date date, p_summary text, p_key uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_task public.tasks%rowtype; v_result uuid;
begin
  perform private.require_role(array['ADMIN','OFFICE_CONFIRMER']);
  v_result := private.begin_operation('confirm_completion',p_key,jsonb_build_array(p_task,p_expected,p_date,p_summary));
  if v_result is not null then return v_result; end if;
  select * into strict v_task from public.tasks where id = p_task for update;
  if p_expected is null or v_task.row_version <> p_expected then raise exception using errcode = '40001', message = 'Nhiệm vụ đã thay đổi.'; end if;
  if v_task.archived_at is not null or v_task.execution_status = 'DA_HOAN_THANH' or p_date is null
    or p_date < v_task.assigned_date or p_date > public.business_today() or coalesce(btrim(p_summary),'') = '' then
    raise exception using errcode = '23514', message = 'Cần ngày thực tế hợp lệ và nội dung kết quả.';
  end if;
  update public.tasks set execution_status = 'DA_HOAN_THANH',completed_date = p_date,completion_summary = p_summary,
    confirmed_at = statement_timestamp(),confirmed_by = auth.uid(),due_date_at_completion = current_due_date,progress_percent = 100 where id = p_task;
  perform private.finish_operation('confirm_completion',p_key,p_task);
  return p_task;
end;
$$;

create function private.archive_task(p_task uuid, p_expected bigint, p_archive boolean, p_reason text, p_key uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_task public.tasks%rowtype; v_result uuid;
begin
  perform private.require_role(array['ADMIN']);
  if p_archive is null or coalesce(btrim(p_reason),'') = '' then raise exception using errcode = '22023', message = 'Cần lý do lưu trữ/khôi phục.'; end if;
  v_result := private.begin_operation('archive_task',p_key,jsonb_build_array(p_task,p_expected,p_archive,p_reason));
  if v_result is not null then return v_result; end if;
  select * into strict v_task from public.tasks where id = p_task for update;
  if p_expected is null or v_task.row_version <> p_expected then raise exception using errcode = '40001', message = 'Nhiệm vụ đã thay đổi.'; end if;
  update public.tasks set archived_at = case when p_archive then statement_timestamp() end,
    archived_by = case when p_archive then auth.uid() end,archived_reason = case when p_archive then p_reason end where id = p_task;
  insert into public.audit_logs(actor_id,actor_name_snapshot,entity_type,entity_id,task_id,action,reason)
    select auth.uid(),display_name,'tasks',p_task,p_task,case when p_archive then 'ARCHIVE_REASON' else 'RESTORE_REASON' end,p_reason
      from public.profiles where id = auth.uid();
  perform private.finish_operation('archive_task',p_key,p_task);
  return p_task;
end;
$$;

create function private.set_user_access(p_user uuid, p_roles text[], p_active boolean, p_key uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_result uuid; v_profile public.profiles%rowtype;
begin
  perform private.require_role(array['ADMIN']);
  if p_user is null or p_user = auth.uid() then raise exception using errcode = '42501', message = 'Không tự thay đổi quyền/trạng thái bản thân.'; end if;
  if p_roles is null or p_active is null or exists (select 1 from unnest(p_roles) r(role)
    where role is null or role not in ('ADMIN','OFFICE_EDITOR','OFFICE_CONFIRMER','LEADER_VIEWER')) then
    raise exception using errcode = '22023', message = 'Danh sách quyền không hợp lệ.';
  end if;
  perform pg_advisory_xact_lock(718008);
  -- Recheck after the administration lock; a queued administrator may have lost access.
  perform private.require_role(array['ADMIN']);
  v_result := private.begin_operation('set_user_access',p_key,jsonb_build_array(p_user,p_roles,p_active));
  if v_result is not null then return v_result; end if;
  select * into strict v_profile from public.profiles where id = p_user for update;
  if exists (select 1 from public.user_roles where user_id = p_user and role = 'ADMIN') and v_profile.is_active
    and (not p_active or not ('ADMIN' = any(p_roles))) and not exists
      (select 1 from public.profiles p join public.user_roles r on r.user_id = p.id
        where p.id <> p_user and p.is_active and r.role = 'ADMIN') then
    raise exception using errcode = '23514', message = 'Phải giữ ít nhất một quản trị viên hoạt động.';
  end if;
  delete from public.user_roles where user_id = p_user;
  insert into public.user_roles(user_id,role,granted_by) select p_user, r.role,auth.uid() from (select distinct unnest(p_roles) role) r;
  update public.profiles set is_active = p_active,updated_at = statement_timestamp() where id = p_user;
  perform private.finish_operation('set_user_access',p_key,p_user);
  return p_user;
end;
$$;

-- Non-exposed, future GĐ3 transaction building blocks. No client EXECUTE grants.
-- File verification is deliberately not implemented here; only a trusted server can
-- set verified_at/by after checking the bytes and a private Storage object.
create function private.bind_verified_attachment(p_attachment uuid, p_purpose text, p_parent uuid) returns void
language plpgsql security invoker set search_path = ''
as $$
declare v_file public.attachments%rowtype;
begin
  select * into strict v_file from public.attachments where id = p_attachment for update;
  if v_file.created_by <> auth.uid() or v_file.upload_state <> 'PENDING' or v_file.expires_at <= statement_timestamp()
    or v_file.verified_at is null or v_file.verified_by is null or v_file.purpose <> p_purpose then
    raise exception using errcode = '23514', message = 'File chưa được kiểm tra hoặc không thuộc phiên upload hợp lệ.';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = v_file.bucket_id and o.name = v_file.object_path) then
    raise exception using errcode = '23514', message = 'Không tìm thấy file Storage.';
  end if;
  update public.attachments set upload_state = 'READY',
    expedite_document_id = case when p_purpose = 'EXPEDITE' then p_parent end,
    extension_request_id = case when p_purpose in ('EXTENSION_REQUEST','EXTENSION_RESPONSE') then p_parent end where id = p_attachment;
end;
$$;
create function private.request_extension(p_task uuid, p_expected bigint, p_unit uuid, p_number text, p_date date,
  p_reason text, p_due date, p_file uuid, p_key uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_task public.tasks%rowtype; v_id uuid;
begin
  perform private.require_role(array['ADMIN','OFFICE_EDITOR','OFFICE_CONFIRMER']);
  v_id := private.begin_operation('request_extension',p_key,jsonb_build_array(p_task,p_expected,p_unit,p_number,p_date,p_reason,p_due,p_file));
  if v_id is not null then return v_id; end if;
  select * into strict v_task from public.tasks where id = p_task for update;
  if p_expected is null or v_task.row_version <> p_expected then raise exception using errcode = '40001', message = 'Nhiệm vụ đã thay đổi.'; end if;
  if p_due is null or p_due <= v_task.current_due_date or exists
    (select 1 from public.extension_requests where task_id = p_task and state = 'DANG_XIN') then
    raise exception using errcode = '23514', message = 'Hạn đề nghị hoặc hồ sơ đang chờ không hợp lệ.';
  end if;
  insert into public.extension_requests(task_id,sequence_no,requesting_unit_id,request_no,request_date,reason,previous_due_date,proposed_due_date,created_by)
    select p_task,coalesce(max(sequence_no),0)+1,p_unit,p_number,p_date,p_reason,v_task.current_due_date,p_due,auth.uid()
      from public.extension_requests where task_id = p_task returning id into v_id;
  perform private.bind_verified_attachment(p_file,'EXTENSION_REQUEST',v_id);
  update public.tasks set note = note where id = p_task;
  perform private.finish_operation('request_extension',p_key,v_id);
  return v_id;
end;
$$;
create function private.resolve_extension(p_extension uuid, p_task_expected bigint, p_expected bigint,
  p_approve boolean, p_number text, p_date date, p_issuer text, p_due date, p_file uuid, p_key uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_request public.extension_requests%rowtype; v_task public.tasks%rowtype; v_id uuid; v_task_id uuid;
begin
  perform private.require_role(array['ADMIN','OFFICE_CONFIRMER']);
  v_id := private.begin_operation('resolve_extension',p_key,jsonb_build_array(p_extension,p_task_expected,p_expected,p_approve,p_number,p_date,p_issuer,p_due,p_file));
  if v_id is not null then return v_id; end if;
  select task_id into strict v_task_id from public.extension_requests where id = p_extension;
  -- Always task before request to share the same lock order as request/completion.
  select * into strict v_task from public.tasks where id = v_task_id for update;
  select * into strict v_request from public.extension_requests where id = p_extension for update;
  if p_task_expected is null or p_expected is null or v_task.row_version <> p_task_expected or v_request.row_version <> p_expected then
    raise exception using errcode = '40001', message = 'Nhiệm vụ/hồ sơ đã thay đổi.';
  end if;
  if v_request.state <> 'DANG_XIN' or p_approve is null or (p_approve and (p_due is null or p_due <= v_task.current_due_date))
    or (not p_approve and p_due is not null) then raise exception using errcode = '23514', message = 'Kết quả/hạn duyệt không hợp lệ.'; end if;
  update public.extension_requests set state = case when p_approve then 'DA_DUOC_GIA_HAN' else 'KHONG_DUOC_CHAP_THUAN' end,
    response_no = p_number,response_date = p_date,response_issuer = p_issuer,approved_due_date = case when p_approve then p_due end,
    resolved_at = statement_timestamp(),resolved_by = auth.uid() where id = p_extension;
  perform private.bind_verified_attachment(p_file,'EXTENSION_RESPONSE',p_extension);
  update public.tasks set current_due_date = case when p_approve then p_due else current_due_date end where id = v_task.id;
  perform private.finish_operation('resolve_extension',p_key,p_extension);
  return p_extension;
end;
$$;
create function private.create_expedite(p_tasks uuid[], p_versions bigint[], p_number text, p_date date, p_issuer text,
  p_content text, p_file uuid, p_key uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_task public.tasks%rowtype; v_count integer := 0;
begin
  perform private.require_role(array['ADMIN','OFFICE_EDITOR','OFFICE_CONFIRMER']);
  if coalesce(cardinality(p_tasks),0) = 0 or p_versions is null or cardinality(p_tasks) <> cardinality(p_versions)
    or array_position(p_tasks,null) is not null or array_position(p_versions,null) is not null
    or cardinality(p_tasks) <> (select count(distinct x) from unnest(p_tasks) x) then
    raise exception using errcode = '22023', message = 'Cần các nhiệm vụ duy nhất và version tương ứng.';
  end if;
  v_id := private.begin_operation('create_expedite',p_key,jsonb_build_array(p_tasks,p_versions,p_number,p_date,p_issuer,p_content,p_file));
  if v_id is not null then return v_id; end if;
  for v_task in select * from public.tasks where id = any(p_tasks) order by id for update loop
    v_count := v_count + 1;
    if v_task.row_version <> p_versions[array_position(p_tasks,v_task.id)] then raise exception using errcode = '40001', message = 'Nhiệm vụ đã thay đổi.'; end if;
    if v_task.archived_at is not null or v_task.execution_status = 'DA_HOAN_THANH' then
      raise exception using errcode = '23514', message = 'Không đôn đốc nhiệm vụ đã hoàn thành/lưu trữ.';
    end if;
  end loop;
  if v_count <> cardinality(p_tasks) then raise exception using errcode = '23503', message = 'Nhiệm vụ không tồn tại.'; end if;
  insert into public.expedite_documents(reference_no,issued_date,issuer,content,created_by)
    values(p_number,p_date,p_issuer,p_content,auth.uid()) returning id into v_id;
  insert into public.expedite_document_tasks(expedite_document_id,task_id) select v_id,unnest(p_tasks);
  perform private.bind_verified_attachment(p_file,'EXPEDITE',v_id);
  update public.tasks set note = note where id = any(p_tasks);
  perform private.finish_operation('create_expedite',p_key,v_id);
  return v_id;
end;
$$;

-- SQL INVOKER wrappers are the ONLY public write entry points. All DEFINERs remain private.
create function public.save_source_document(p_payload jsonb, p_id uuid, p_expected bigint, p_key uuid) returns uuid
language sql security invoker set search_path = ''
as $$ select private.save_source_document(p_payload,p_id,p_expected,p_key); $$;
create function public.save_task(p_payload jsonb, p_id uuid, p_expected bigint, p_coordinators uuid[], p_key uuid) returns uuid
language sql security invoker set search_path = ''
as $$ select private.save_task(p_payload,p_id,p_expected,p_coordinators,p_key); $$;
create function public.add_progress(p_task uuid, p_expected bigint, p_date date, p_content text, p_percent integer, p_difficulty text, p_key uuid) returns uuid
language sql security invoker set search_path = ''
as $$ select private.add_progress(p_task,p_expected,p_date,p_content,p_percent,p_difficulty,p_key); $$;
create function public.confirm_completion(p_task uuid, p_expected bigint, p_date date, p_summary text, p_key uuid) returns uuid
language sql security invoker set search_path = ''
as $$ select private.confirm_completion(p_task,p_expected,p_date,p_summary,p_key); $$;
create function public.archive_task(p_task uuid, p_expected bigint, p_archive boolean, p_reason text, p_key uuid) returns uuid
language sql security invoker set search_path = ''
as $$ select private.archive_task(p_task,p_expected,p_archive,p_reason,p_key); $$;
create function public.set_user_access(p_user uuid, p_roles text[], p_active boolean, p_key uuid) returns uuid
language sql security invoker set search_path = ''
as $$ select private.set_user_access(p_user,p_roles,p_active,p_key); $$;

-- Explicit allowlist; nothing grants authenticated EXECUTE to GĐ3 private functions.
do $function_permissions$
declare f record;
begin
  for f in select p.oid::regprocedure as signature, n.nspname as schema_name, p.proname as name
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('private','public') and p.proname in
      ('begin_operation','finish_operation','save_source_document','save_task','add_progress','confirm_completion',
       'archive_task','set_user_access','bind_verified_attachment','request_extension','resolve_extension','create_expedite')
  loop
    if f.schema_name = 'private' then execute format('alter function %s owner to huong_do_executor',f.signature); end if;
    execute format('revoke all on function %s from public, anon, authenticated',f.signature);
    if f.name in ('save_source_document','save_task','add_progress','confirm_completion','archive_task','set_user_access') then
      execute format('grant execute on function %s to authenticated',f.signature);
    end if;
  end loop;
end;
$function_permissions$;
