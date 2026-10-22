-- Deleting: whoever added a memory or answer can delete it with the key their browser kept,
-- and admins (signed in, listed in public.admins) can delete anything.

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
-- No policies: nobody can read or change this list through the API.
alter table public.admins enable row level security;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- The browser sends a random key with each new row; only its hash is stored.
alter table public.memories add column delete_key text;
alter table public.answers add column delete_key text;

create function public.hash_delete_key() returns trigger
language plpgsql as $$
begin
  if new.delete_key is not null then
    new.delete_key := encode(sha256(convert_to(new.delete_key, 'UTF8')), 'hex');
  end if;
  return new;
end;
$$;

create trigger hash_delete_key before insert on public.memories
  for each row execute function public.hash_delete_key();
create trigger hash_delete_key before insert on public.answers
  for each row execute function public.hash_delete_key();

create function public.delete_memory(row_id bigint, key text default null) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from public.memories
  where id = row_id
    and (public.is_admin()
      or (key is not null and delete_key = encode(sha256(convert_to(key, 'UTF8')), 'hex')));
  return found;
end;
$$;

create function public.delete_answer(row_id bigint, key text default null) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from public.answers
  where id = row_id
    and (public.is_admin()
      or (key is not null and delete_key = encode(sha256(convert_to(key, 'UTF8')), 'hex')));
  return found;
end;
$$;

-- Once its memory is gone, a media file can be removed by anyone.
create function public.media_unused(object_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.memories
    where right(data -> 'media' ->> 'url', length(object_name) + 7) = '/media/' || object_name
  );
$$;

create policy "anyone can see unused media" on storage.objects
  for select to anon using (bucket_id = 'media' and public.media_unused(name));
create policy "anyone can remove unused media" on storage.objects
  for delete to anon using (bucket_id = 'media' and public.media_unused(name));
