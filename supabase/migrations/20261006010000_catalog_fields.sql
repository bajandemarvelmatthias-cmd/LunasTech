-- Guide description and device details (decision-log.md #23).
-- guides: optional description. device_types: optional manufacturer, category
-- and notes, plus an active / archived status (archived devices are hidden
-- from customers). Existing rows become active. Safe to run more than once.

alter table public.guides
  add column if not exists description text;

alter table public.device_types
  add column if not exists manufacturer text,
  add column if not exists category text
    check (category in ('smartphones', 'laptops', 'tablets', 'game_consoles')),
  add column if not exists notes text,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'archived'));
