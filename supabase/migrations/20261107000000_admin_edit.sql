-- Admins can edit a memory: its words, details, place, and which memories it connects to.
-- Visitors still can't change anything.

create function public.update_memory(row_id bigint, new_data jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() or jsonb_typeof(new_data) <> 'object' then
    return false;
  end if;
  update public.memories set data = new_data where id = row_id;
  return found;
end;
$$;
