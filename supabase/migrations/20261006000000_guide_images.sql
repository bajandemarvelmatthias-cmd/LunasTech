-- Guide pictures and card details (decision-log.md #22).
-- Adds an optional cover photo, difficulty and estimated time to guides, an
-- optional photo to each guide step, and a storage bucket for the photos.
-- Photos are public by URL (file names are random); only admins can upload.
-- Run it in the Supabase SQL editor and report any error.

create type public.guide_difficulty as enum ('easy', 'moderate', 'hard');

alter table public.guides
  add column difficulty public.guide_difficulty,
  add column estimated_minutes integer check (estimated_minutes between 1 and 1440),
  add column cover_image_path text;

alter table public.guide_steps
  add column image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guide-images', 'guide-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy guide_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'guide-images' and public.is_admin());
