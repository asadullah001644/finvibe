-- Optional display name for header, settings, and admin.

alter table public.profiles
  add column if not exists display_name text;

comment on column public.profiles.display_name is 'User-chosen name shown in UI; nullable until set in Settings.';
