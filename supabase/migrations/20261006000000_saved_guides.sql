-- Saved guides (docs/foundation/decision-log.md #17). A user bookmarks guides
-- to find them again. Same ownership pattern as guide_progress: users manage
-- only their own rows. Additive: no existing table is changed.

create table public.saved_guides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  guide_id uuid not null references public.guides (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, guide_id)
);

create index on public.saved_guides (guide_id);

alter table public.saved_guides enable row level security;

create policy saved_guides_own on public.saved_guides for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
