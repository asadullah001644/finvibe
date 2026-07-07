-- Global custom categories (super admin manages, all users see)

drop table if exists public.user_custom_categories;

create table if not exists public.custom_categories (
  id uuid primary key default gen_random_uuid(),
  group_label text,
  leaf_name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_categories_leaf_not_empty check (char_length(trim(leaf_name)) > 0),
  constraint custom_categories_group_not_empty check (
    group_label is null or char_length(trim(group_label)) > 0
  )
);

create unique index if not exists custom_categories_path_idx
  on public.custom_categories (coalesce(group_label, ''), leaf_name);

create index if not exists custom_categories_created_at_idx
  on public.custom_categories (created_at);

alter table public.custom_categories enable row level security;

create policy "custom_categories_select" on public.custom_categories
  for select using (public.is_active_user() or public.is_super_admin());

create policy "custom_categories_insert" on public.custom_categories
  for insert with check (public.is_super_admin());

create policy "custom_categories_update" on public.custom_categories
  for update using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "custom_categories_delete" on public.custom_categories
  for delete using (public.is_super_admin());
