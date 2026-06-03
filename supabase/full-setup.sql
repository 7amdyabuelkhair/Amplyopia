-- Amplyopia: run this ONCE in Supabase → SQL Editor (safe to re-run)
-- Order: profiles → scores → terms → PWA tables → RLS fixes

-- ---------- 1) Core tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  gender text not null check (gender in ('boy','girl')),
  birthdate date not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

do $$ begin
  alter table public.profiles alter column age drop not null;
exception
  when undefined_column then null;
end $$;

create table if not exists public.scores (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  points int not null default 0,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- Terms consent (fixes profile save errors)
create table if not exists public.user_terms_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  accepted_terms boolean not null default true,
  accepted_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.scores enable row level security;
alter table public.user_terms_consents enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "scores_select_own" on public.scores;
create policy "scores_select_own"
on public.scores for select using (auth.uid() = user_id);

drop policy if exists "scores_insert_own" on public.scores;
create policy "scores_insert_own"
on public.scores for insert with check (auth.uid() = user_id);

drop policy if exists "terms_select_own" on public.user_terms_consents;
create policy "terms_select_own"
on public.user_terms_consents for select using (auth.uid() = user_id);

drop policy if exists "terms_insert_own" on public.user_terms_consents;
create policy "terms_insert_own"
on public.user_terms_consents for insert with check (auth.uid() = user_id);

drop policy if exists "terms_update_own" on public.user_terms_consents;
create policy "terms_update_own"
on public.user_terms_consents for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 2) PWA / notifications ----------
alter table public.profiles
add column if not exists is_admin boolean not null default false;

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.notification_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  icon text,
  url text default '/index.html',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_targets (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notification_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  icon text,
  url text default '/index.html',
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
alter table public.notification_messages enable row level security;
alter table public.notification_targets enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
on public.push_subscriptions for select to authenticated using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_upsert_own" on public.push_subscriptions;
create policy "push_subscriptions_upsert_own"
on public.push_subscriptions for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
on public.push_subscriptions for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notification_targets_select_own" on public.notification_targets;
create policy "notification_targets_select_own"
on public.notification_targets for select to authenticated using (auth.uid() = user_id);

drop policy if exists "notification_targets_update_own" on public.notification_targets;
create policy "notification_targets_update_own"
on public.notification_targets for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admin helper (no infinite recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid() limit 1),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "profiles_select_admin_emails" on public.profiles;
drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
on public.profiles for select to authenticated using (public.is_admin());

drop policy if exists "notification_messages_insert_admin" on public.notification_messages;
create policy "notification_messages_insert_admin"
on public.notification_messages for insert to authenticated with check (public.is_admin());

drop policy if exists "notification_targets_insert_admin" on public.notification_targets;
create policy "notification_targets_insert_admin"
on public.notification_targets for insert to authenticated with check (public.is_admin());

drop policy if exists "push_subscriptions_select_admin" on public.push_subscriptions;
create policy "push_subscriptions_select_admin"
on public.push_subscriptions for select to authenticated using (public.is_admin());
