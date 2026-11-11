-- Run in Supabase SQL Editor. Review before production.
create extension if not exists pgcrypto;
create table if not exists public.questions(
 id uuid primary key default gen_random_uuid(), subject text not null, exam text, question text not null,
 options jsonb not null check(jsonb_typeof(options)='array'), answer integer not null,
 explanation text default '', language text default 'both', difficulty text default 'medium',
 published boolean default false, created_at timestamptz default now()
);
create table if not exists public.resources(
 id uuid primary key default gen_random_uuid(), type text not null check(type in ('note','paper')),
 title text not null, description text default '', file_url text, published boolean default false,
 created_at timestamptz default now()
);
create table if not exists public.notifications(
 id uuid primary key default gen_random_uuid(), title text not null, body text not null,
 url text, published boolean default false, created_at timestamptz default now()
);
create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade, display_name text,
 role text not null default 'student' check(role in ('student','admin')), created_at timestamptz default now()
);
create table if not exists public.attempts(
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 test_name text, score integer not null, total integer not null, answers jsonb default '{}',
 created_at timestamptz default now()
);
alter table public.questions enable row level security;
alter table public.resources enable row level security;
alter table public.notifications enable row level security;
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
-- Public visitors may read published content only
create policy "read published questions" on public.questions for select using (published=true);
create policy "read published resources" on public.resources for select using (published=true);
create policy "read published notifications" on public.notifications for select using (published=true);
-- Profile owners can read/update own profile (role must be assigned securely by service/admin)
create policy "profile self read" on public.profiles for select using (auth.uid()=id);
create policy "profile self update" on public.profiles for update using (auth.uid()=id);
create policy "attempts own read" on public.attempts for select using (auth.uid()=user_id);
create policy "attempts own insert" on public.attempts for insert with check (auth.uid()=user_id);
-- IMPORTANT: do not let users self-promote to admin. Set role from trusted SQL/service role.
