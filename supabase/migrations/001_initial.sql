-- FinVibe initial schema (Supabase Postgres)

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  month_key text not null unique,
  total_salary numeric not null default 0,
  savings_goal numeric not null default 0,
  categories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null check (amount > 0),
  category text not null,
  description text not null default '',
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses (date desc);
create index if not exists expenses_category_idx on public.expenses (category);

alter table public.budgets enable row level security;
alter table public.expenses enable row level security;

create policy "Allow all on budgets" on public.budgets
  for all using (true) with check (true);

create policy "Allow all on expenses" on public.expenses
  for all using (true) with check (true);
