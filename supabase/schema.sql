
-- ============================================================
-- PUNJAB EXAM ACADEMY
-- Supabase Database Schema
-- Rerunnable baseline with Row Level Security
-- ============================================================

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- 1. QUESTIONS / MCQs
-- ============================================================

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  exam text,
  question text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  answer integer not null check (answer >= 0),
  explanation text default '',
  language text default 'both',
  difficulty text default 'medium',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. STUDY NOTES AND PREVIOUS PAPERS
-- ============================================================

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('note', 'paper')),
  title text not null,
  description text default '',
  file_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. EXAM NOTIFICATIONS
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. USER PROFILES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'student'
    check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. MOCK TEST ATTEMPTS
-- ============================================================

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_name text,
  score integer not null check (score >= 0),
  total integer not null check (total >= score),
  answers jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. ADMIN CHECK FUNCTION
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ============================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.questions enable row level security;
alter table public.resources enable row level security;
alter table public.notifications enable row level security;
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;

-- ============================================================
-- 8. DROP EXISTING POLICIES (PREVENT DUPLICATE ERRORS)
-- ============================================================

drop policy if exists questions_public_read on public.questions;
drop policy if exists questions_admin_all on public.questions;
drop policy if exists "read published questions" on public.questions;

drop policy if exists resources_public_read on public.resources;
drop policy if exists resources_admin_all on public.resources;
drop policy if exists "read published resources" on public.resources;

drop policy if exists notifications_public_read on public.notifications;
drop policy if exists notifications_admin_all on public.notifications;
drop policy if exists "read published notifications" on public.notifications;

drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_admin_read on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
drop policy if exists profiles_self_insert_student on public.profiles;
drop policy if exists profiles_self_update_name on public.profiles;
drop policy if exists "profile self read" on public.profiles;
drop policy if exists "profile self update" on public.profiles;

drop policy if exists attempts_self_read on public.attempts;
drop policy if exists attempts_self_insert on public.attempts;
drop policy if exists attempts_admin_read on public.attempts;
drop policy if exists "attempts own read" on public.attempts;
drop policy if exists "attempts own insert" on public.attempts;

-- ============================================================
-- 9. QUESTIONS POLICIES
-- ============================================================

create policy questions_public_read
on public.questions
for select
to anon, authenticated
using (published = true);

create policy questions_admin_all
on public.questions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- 10. RESOURCES POLICIES
-- ============================================================

create policy resources_public_read
on public.resources
for select
to anon, authenticated
using (published = true);

create policy resources_admin_all
on public.resources
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- 11. NOTIFICATIONS POLICIES
-- ============================================================

create policy notifications_public_read
on public.notifications
for select
to anon, authenticated
using (published = true);

create policy notifications_admin_all
on public.notifications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- 12. PROFILE POLICIES
-- ============================================================

create policy profiles_self_read
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy profiles_admin_read
on public.profiles
for select
to authenticated
using (public.is_admin());

create policy profiles_admin_update
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Students may insert only their own student profile.
create policy profiles_self_insert_student
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and role = 'student'
);

-- ============================================================
-- 13. ATTEMPTS POLICIES
-- ============================================================

create policy attempts_self_read
on public.attempts
for select
to authenticated
using (auth.uid() = user_id);

create policy attempts_self_insert
on public.attempts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy attempts_admin_read
on public.attempts
for select
to authenticated
using (public.is_admin());

-- ============================================================
-- 14. PROFILE UPDATE SECURITY
-- Students may update display_name but cannot change role.
-- ============================================================

revoke update on public.profiles from anon, authenticated;

grant update (display_name)
on public.profiles
to authenticated;

create policy profiles_self_update_name
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- ============================================================
-- 15. AUTO-CREATE STUDENT PROFILE AFTER SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    'student'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- ============================================================
-- 16. FINISH
-- ============================================================

commit;

-- ============================================================
-- FIRST ADMINISTRATOR
-- Run separately AFTER registering your account.
-- Replace AUTH_USER_UUID with your actual Auth user UUID.
-- ============================================================

-- update public.profiles
-- set role = 'admin'
-- where id = 'AUTH_USER_UUID';
