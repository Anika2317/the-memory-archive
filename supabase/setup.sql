-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

create table public.memories (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  data jsonb not null
);

create table public.answers (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  question text not null,
  data jsonb not null
);

-- Visitors can read and add, but never edit or delete.
alter table public.memories enable row level security;
alter table public.answers enable row level security;

create policy "anyone can read memories" on public.memories for select to anon using (true);
create policy "anyone can add memories" on public.memories for insert to anon with check (true);
create policy "anyone can read answers" on public.answers for select to anon using (true);
create policy "anyone can add answers" on public.answers for insert to anon with check (true);

-- Photos, recordings and videos (50 MB max each).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800, array['image/*', 'audio/*', 'video/*']);

create policy "anyone can upload media" on storage.objects
  for insert to anon with check (bucket_id = 'media');
