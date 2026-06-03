-- Core Amplyopia schema (profiles + scores)
-- For full setup including PWA and admin, run RUN-IN-SUPABASE.sql instead.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  gender text check (gender is null or gender in ('boy', 'girl')),
  birthdate date,
  age int,
  is_admin boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  points int not null default 0,
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.scores enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "scores_select_own" on public.scores;
create policy "scores_select_own" on public.scores for select using (auth.uid() = user_id);

drop policy if exists "scores_insert_own" on public.scores;
create policy "scores_insert_own" on public.scores for insert with check (auth.uid() = user_id);
