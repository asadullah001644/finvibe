-- Recurring expense templates and seeded expense linkage

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null check (amount > 0),
  category text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses
  add column if not exists recurring_expense_id uuid references public.recurring_expenses (id) on delete set null;

create index if not exists expenses_recurring_expense_id_idx
  on public.expenses (recurring_expense_id)
  where recurring_expense_id is not null;

alter table public.recurring_expenses enable row level security;

create policy "Allow all on recurring_expenses" on public.recurring_expenses
  for all using (true) with check (true);
