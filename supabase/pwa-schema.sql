-- PWA + notifications schema for Amplyopia
-- Run in Supabase SQL editor after schema.sql

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

-- Push subscriptions: users manage own rows
drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
on public.push_subscriptions for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_upsert_own" on public.push_subscriptions;
create policy "push_subscriptions_upsert_own"
on public.push_subscriptions for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
on public.push_subscriptions for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Notification targets: users read/update own inbox
drop policy if exists "notification_targets_select_own" on public.notification_targets;
create policy "notification_targets_select_own"
on public.notification_targets for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "notification_targets_update_own" on public.notification_targets;
create policy "notification_targets_update_own"
on public.notification_targets for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Admin helper (security definer avoids infinite RLS recursion on profiles)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(
      (select p.is_admin from public.profiles p where p.id = auth.uid() limit 1),
      false
    )
    or exists (
      select 1 from auth.users u
      where u.id = auth.uid()
      and lower(u.email) in (
        'hamdyabuelkhair@gmail.com',
        'aretaj267@gmail.com'
      )
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admin can read all profiles
drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
on public.profiles for select to authenticated
using (public.is_admin());

-- Admin can create notifications + targets
drop policy if exists "notification_messages_insert_admin" on public.notification_messages;
create policy "notification_messages_insert_admin"
on public.notification_messages for insert to authenticated
with check (public.is_admin());

drop policy if exists "notification_targets_insert_admin" on public.notification_targets;
create policy "notification_targets_insert_admin"
on public.notification_targets for insert to authenticated
with check (public.is_admin());

-- Admin can read all push subscriptions (optional, for debugging)
drop policy if exists "push_subscriptions_select_admin" on public.push_subscriptions;
create policy "push_subscriptions_select_admin"
on public.push_subscriptions for select to authenticated
using (public.is_admin());
