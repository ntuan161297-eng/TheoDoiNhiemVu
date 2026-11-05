-- STEP 2.2: REVIEW ONLY. No users or credentials are seeded.
-- Supabase migration runner owns the transaction; do not embed BEGIN/COMMIT.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema public, private to authenticated;
revoke create on schema public from public, anon, authenticated;

-- Definers are owned by a constrained non-login role, not postgres/service_role.
do $role$
begin
  if not exists (select 1 from pg_roles where rolname = 'huong_do_executor') then
    create role huong_do_executor nologin noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
  elsif exists (select 1 from pg_roles where rolname = 'huong_do_executor'
    and (rolcanlogin or rolsuper or rolbypassrls or rolcreaterole or rolcreatedb)) then
    raise exception 'Unsafe existing huong_do_executor role';
  end if;
end;
$role$;
grant huong_do_executor to postgres;
grant usage on schema public, private, auth to huong_do_executor;
grant create on schema private to huong_do_executor;
grant execute on function auth.uid(), auth.jwt() to huong_do_executor;
-- PUBLIC function EXECUTE defaults are global; schema-only revoke is insufficient.
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema private revoke all on tables from anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (length(btrim(display_name)) between 1 and 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete restrict,
  role text not null check (role in ('ADMIN','OFFICE_EDITOR','OFFICE_CONFIRMER','LEADER_VIEWER')),
  granted_by uuid references public.profiles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index user_roles_role_user_idx on public.user_roles(role, user_id);
create index user_roles_granted_by_idx on public.user_roles(granted_by);

create table public.units (
  id uuid primary key default gen_random_uuid(), code text not null unique,
  name text not null check (btrim(name) <> ''), unit_kind text not null default 'CHUA_PHAN_LOAI',
  sort_order integer not null check (sort_order > 0), is_active boolean not null default true
);
create table public.leaders (
  id uuid primary key default gen_random_uuid(), code text not null unique,
  full_name text not null check (btrim(full_name) <> ''), position_name text not null,
  sort_order integer not null check (sort_order > 0), is_active boolean not null default true
);
create table public.task_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('TINH_GIAO','HDND','KET_LUAN_CUOC_HOP')),
  name text not null check (btrim(name) <> ''),
  sort_order integer not null check (sort_order > 0), is_active boolean not null default true
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.units enable row level security;
alter table public.leaders enable row level security;
alter table public.task_sources enable row level security;
revoke all on public.profiles, public.user_roles, public.units, public.leaders, public.task_sources
  from public, anon, authenticated;
grant select on public.profiles, public.user_roles, public.units, public.leaders, public.task_sources to authenticated;
grant select, insert, update on public.profiles to huong_do_executor;
grant select, insert, update, delete on public.user_roles to huong_do_executor;
grant select, update on public.units, public.leaders, public.task_sources to huong_do_executor;
create policy executor_profiles on public.profiles for all to huong_do_executor using (true) with check (true);
create policy executor_roles on public.user_roles for all to huong_do_executor using (true) with check (true);
create policy executor_units on public.units for all to huong_do_executor using (true) with check (true);
create policy executor_leaders on public.leaders for all to huong_do_executor using (true) with check (true);
create policy executor_sources on public.task_sources for all to huong_do_executor using (true) with check (true);

create function private.has_role(p_roles text[]) returns boolean
language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null
    and coalesce(auth.jwt()->>'is_anonymous', 'false') = 'false'
    and exists (select 1 from public.profiles p join public.user_roles r on r.user_id = p.id
      where p.id = auth.uid() and p.is_active and r.role = any(p_roles));
$$;
alter function private.has_role(text[]) owner to huong_do_executor;
revoke all on function private.has_role(text[]) from public, anon, authenticated;
grant execute on function private.has_role(text[]) to authenticated;

create function private.can_read() returns boolean
language sql stable security invoker set search_path = ''
as $$ select private.has_role(array['ADMIN','OFFICE_EDITOR','OFFICE_CONFIRMER','LEADER_VIEWER']); $$;
revoke all on function private.can_read() from public, anon, authenticated;
grant execute on function private.can_read() to authenticated, huong_do_executor;

create function private.require_role(p_roles text[]) returns uuid
language plpgsql stable security invoker set search_path = ''
as $$
begin
  if not private.has_role(p_roles) then
    raise exception using errcode = '42501', message = 'Không đủ quyền hoặc tài khoản đã khóa.';
  end if;
  return auth.uid();
end;
$$;
revoke all on function private.require_role(text[]) from public, anon, authenticated;
grant execute on function private.require_role(text[]) to huong_do_executor;

create policy own_or_admin_profile on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.has_role(array['ADMIN'])));
create policy own_or_admin_roles on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or (select private.has_role(array['ADMIN'])));
create policy lookup_units_read on public.units for select to authenticated using ((select private.can_read()));
create policy lookup_leaders_read on public.leaders for select to authenticated using ((select private.can_read()));
create policy lookup_sources_read on public.task_sources for select to authenticated using ((select private.can_read()));

create function private.provision_profile() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- Ignore user_metadata role/is_active. Empty membership means no business access.
  insert into public.profiles(id, display_name) values (new.id, 'Người dùng thử nghiệm');
  return new;
end;
$$;
alter function private.provision_profile() owner to huong_do_executor;
revoke all on function private.provision_profile() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.provision_profile();
