-- FinVibe Phase 4: RLS lockdown (run AFTER 005 backfill)
-- Aborts if any row still has null user_id.

do $$
begin
  if exists (select 1 from public.budgets where user_id is null) then
    raise exception 'Abort: orphan budgets exist. Run 005_backfill_super_admin.sql first.';
  end if;
  if exists (select 1 from public.expenses where user_id is null) then
    raise exception 'Abort: orphan expenses exist. Run 005_backfill_super_admin.sql first.';
  end if;
  if exists (select 1 from public.recurring_expenses where user_id is null) then
    raise exception 'Abort: orphan recurring_expenses exist. Run 005_backfill_super_admin.sql first.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Helper functions (security definer — avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
      and is_disabled = false
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_disabled = false
  );
$$;

-- ---------------------------------------------------------------------------
-- Schema constraints
-- ---------------------------------------------------------------------------
alter table public.budgets alter column user_id set not null;
alter table public.expenses alter column user_id set not null;
alter table public.recurring_expenses alter column user_id set not null;

alter table public.budgets alter column user_id set default auth.uid();
alter table public.expenses alter column user_id set default auth.uid();
alter table public.recurring_expenses alter column user_id set default auth.uid();

alter table public.budgets drop constraint if exists budgets_month_key_key;
alter table public.budgets drop constraint if exists budgets_user_month_unique;
alter table public.budgets add constraint budgets_user_month_unique unique (user_id, month_key);

-- ---------------------------------------------------------------------------
-- Prevent non-admin role escalation
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_super_admin() then
    raise exception 'Cannot change role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ---------------------------------------------------------------------------
-- Drop open policies
-- ---------------------------------------------------------------------------
drop policy if exists "Allow all on budgets" on public.budgets;
drop policy if exists "Allow all on expenses" on public.expenses;
drop policy if exists "Allow all on recurring_expenses" on public.recurring_expenses;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

-- ---------------------------------------------------------------------------
-- budgets RLS
-- ---------------------------------------------------------------------------
create policy "budgets_select" on public.budgets
  for select using (
    (auth.uid() = user_id and public.is_active_user())
    or public.is_super_admin()
  );

create policy "budgets_insert" on public.budgets
  for insert with check (auth.uid() = user_id and public.is_active_user());

create policy "budgets_update" on public.budgets
  for update using (
    (auth.uid() = user_id and public.is_active_user())
    or public.is_super_admin()
  );

create policy "budgets_delete" on public.budgets
  for delete using (
    (auth.uid() = user_id and public.is_active_user())
    or public.is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- expenses RLS
-- ---------------------------------------------------------------------------
create policy "expenses_select" on public.expenses
  for select using (
    (auth.uid() = user_id and public.is_active_user())
    or public.is_super_admin()
  );

create policy "expenses_insert" on public.expenses
  for insert with check (auth.uid() = user_id and public.is_active_user());

create policy "expenses_update" on public.expenses
  for update using (
    (auth.uid() = user_id and public.is_active_user())
    or public.is_super_admin()
  );

create policy "expenses_delete" on public.expenses
  for delete using (
    (auth.uid() = user_id and public.is_active_user())
    or public.is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- recurring_expenses RLS
-- ---------------------------------------------------------------------------
create policy "recurring_select" on public.recurring_expenses
  for select using (
    (auth.uid() = user_id and public.is_active_user())
    or public.is_super_admin()
  );

create policy "recurring_insert" on public.recurring_expenses
  for insert with check (auth.uid() = user_id and public.is_active_user());

create policy "recurring_update" on public.recurring_expenses
  for update using (
    (auth.uid() = user_id and public.is_active_user())
    or public.is_super_admin()
  );

create policy "recurring_delete" on public.recurring_expenses
  for delete using (
    (auth.uid() = user_id and public.is_active_user())
    or public.is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- profiles RLS
-- ---------------------------------------------------------------------------
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_super_admin());

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id and is_disabled = false)
  with check (auth.uid() = id);

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_super_admin());
