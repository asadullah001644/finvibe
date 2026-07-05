-- FinVibe Phase 3: Backfill all existing data to super admin
-- PREREQUISITE: Sign up with muhammadasadullah833@gmail.com first.

do $$
declare
  owner_id uuid;
  orphan_budgets int;
  orphan_expenses int;
  orphan_recurring int;
begin
  select id into owner_id
  from auth.users
  where lower(email) = lower('muhammadasadullah833@gmail.com');

  if owner_id is null then
    raise exception 'Super admin not found. Sign up at /signup with muhammadasadullah833@gmail.com first.';
  end if;

  update public.budgets set user_id = owner_id where user_id is null;
  update public.expenses set user_id = owner_id where user_id is null;
  update public.recurring_expenses set user_id = owner_id where user_id is null;

  insert into public.profiles (id, email, role)
  select owner_id, 'muhammadasadullah833@gmail.com', 'super_admin'
  on conflict (id) do update
    set role = 'super_admin',
        email = excluded.email,
        updated_at = now();

  select count(*) into orphan_budgets from public.budgets where user_id is null;
  select count(*) into orphan_expenses from public.expenses where user_id is null;
  select count(*) into orphan_recurring from public.recurring_expenses where user_id is null;

  if orphan_budgets + orphan_expenses + orphan_recurring > 0 then
    raise exception 'Backfill incomplete: % budgets, % expenses, % recurring still null',
      orphan_budgets, orphan_expenses, orphan_recurring;
  end if;

  raise notice 'Backfill complete for user %', owner_id;
end $$;
