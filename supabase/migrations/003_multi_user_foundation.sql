-- FinVibe Phase 1: Multi-user foundation (non-destructive)
-- Run BEFORE deploying auth code. Keeps open RLS until Phase 4.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user'
    check (role in ('user', 'super_admin')),
  is_disabled boolean not null default false,
  app_pin_hash text,
  currency text not null default 'PKR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

-- Temporary permissive policies until Phase 4 lockdown
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (true) with check (true);

create policy "profiles_insert_own" on public.profiles
  for insert with check (true);

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text;
  assigned_role text := 'user';
begin
  begin
    admin_email := current_setting('app.super_admin_email', true);
  exception when others then
    admin_email := null;
  end;

  if admin_email is not null and lower(new.email) = lower(admin_email) then
    assigned_role := 'super_admin';
  end if;

  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), assigned_role)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Add nullable user_id to data tables
-- ---------------------------------------------------------------------------
alter table public.budgets
  add column if not exists user_id uuid references auth.users(id);

alter table public.expenses
  add column if not exists user_id uuid references auth.users(id);

alter table public.recurring_expenses
  add column if not exists user_id uuid references auth.users(id);

create index if not exists budgets_user_month_idx
  on public.budgets (user_id, month_key);

create index if not exists expenses_user_date_idx
  on public.expenses (user_id, date desc);

create index if not exists recurring_user_idx
  on public.recurring_expenses (user_id);

-- Keep global month_key unique until backfill + Phase 4 lockdown
