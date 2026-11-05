-- READ-ONLY verification after the separately approved migration. Not run in step 2.2.
begin;
set transaction read only;
select 'units' as table_name,count(*) as row_count from public.units
union all select 'leaders',count(*) from public.leaders
union all select 'task_sources',count(*) from public.task_sources
union all select 'tasks',count(*) from public.tasks
union all select 'user_roles',count(*) from public.user_roles;
select code,name,sort_order from public.units order by sort_order;
select code,full_name,position_name from public.leaders order by sort_order;
select code,name from public.task_sources order by sort_order;
select n.nspname,c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r' and ((n.nspname = 'public' and c.relname in ('profiles','user_roles','units','leaders','task_sources',
    'source_documents','tasks','task_coordinating_units','task_progress_updates','expedite_documents','expedite_document_tasks',
    'extension_requests','attachments','audit_logs','import_jobs','import_job_rows')) or (n.nspname = 'private' and c.relname = 'operation_requests'))
  order by n.nspname,c.relname;
select n.nspname,p.proname,p.prosecdef,pg_get_userbyid(p.proowner) as owner,p.proconfig
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public','private') order by n.nspname,p.proname;
select schemaname,tablename,policyname,roles,cmd from pg_policies where schemaname in ('public','private','storage')
  order by schemaname,tablename,policyname;
select c.conrelid::regclass as table_name,c.conname,pg_get_constraintdef(c.oid) as definition
  from pg_constraint c join pg_namespace n on n.oid = c.connamespace
  where n.nspname in ('public','private') order by c.conrelid::regclass::text,c.conname;
select id,public,file_size_limit,allowed_mime_types from storage.buckets where id = 'task-documents';
-- A DB-owner query shows metadata; it does NOT prove end-user RLS enforcement.
rollback;
