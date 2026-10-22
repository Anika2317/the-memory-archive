-- Removal requests from people who no longer have their private link.
-- Visitors can send one; only admins can read them or clear them once handled.

create table public.removal_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  memory_id bigint,
  details text not null check (length(details) between 1 and 4000),
  contact text not null check (length(contact) between 1 and 200)
);

alter table public.removal_requests enable row level security;

create policy "anyone can request a removal" on public.removal_requests
  for insert to anon with check (true);
create policy "admins can read removal requests" on public.removal_requests
  for select to authenticated using (public.is_admin());
create policy "admins can clear removal requests" on public.removal_requests
  for delete to authenticated using (public.is_admin());
