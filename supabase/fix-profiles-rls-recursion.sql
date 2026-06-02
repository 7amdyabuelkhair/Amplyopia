-- Fix: "infinite recursion detected in policy for relation profiles"
-- Cause: admin policies queried public.profiles inside profiles RLS checks.
-- Run this entire script once in Supabase → SQL Editor.

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

-- Replace recursive admin policies
drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
on public.profiles for select to authenticated
using (public.is_admin());

drop policy if exists "notification_messages_insert_admin" on public.notification_messages;
create policy "notification_messages_insert_admin"
on public.notification_messages for insert to authenticated
with check (public.is_admin());

drop policy if exists "notification_targets_insert_admin" on public.notification_targets;
create policy "notification_targets_insert_admin"
on public.notification_targets for insert to authenticated
with check (public.is_admin());

drop policy if exists "push_subscriptions_select_admin" on public.push_subscriptions;
create policy "push_subscriptions_select_admin"
on public.push_subscriptions for select to authenticated
using (public.is_admin());
