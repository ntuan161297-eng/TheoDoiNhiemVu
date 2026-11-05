-- READ-ONLY, prepared for a later separately approved connection. Not run in step 2.2.
begin;
set transaction read only;
select current_user, current_setting('server_version') as server_version,
  current_setting('server_version_num')::integer >= 170000 as postgres_17_or_newer;
select nspname from pg_namespace where nspname in ('public','auth','storage','private');
select rolname,rolcanlogin,rolsuper,rolcreaterole,rolbypassrls from pg_roles
  where rolname in ('postgres','anon','authenticated','huong_do_executor');
-- For a fresh project, these application tables/policies/bucket should not exist.
select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
where (n.nspname = 'public' and c.relname in ('profiles','user_roles','units','leaders','task_sources','tasks',
  'source_documents','attachments','audit_logs','extension_requests','expedite_documents','import_jobs'))
  or (n.nspname = 'private' and c.relname = 'operation_requests');
select schemaname,tablename,policyname,roles,cmd from pg_policies where schemaname = 'storage' and tablename = 'objects';
select id,public,file_size_limit,allowed_mime_types from storage.buckets where id = 'task-documents';
select count(*) as existing_auth_users_review_before_provisioning from auth.users;
-- private must NOT be present in Dashboard > Data API > Exposed schemas.
-- This setting can be supplied externally to PostgREST; inspect Dashboard as well.
select current_setting('pgrst.db_schemas',true) as database_setting_if_present;
rollback;
