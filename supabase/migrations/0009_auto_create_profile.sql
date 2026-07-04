-- ChainLink schema: 0009 — auto-create profile on signup
--
-- Needed now that real authentication is being wired up (chain creation
-- requires auth.uid() to resolve to a profiles row). Without this trigger,
-- a person could authenticate via Supabase Auth but have no corresponding
-- profiles row, breaking every FK that points at profiles(id).
--
-- security definer is required here: this function runs as part of the
-- auth.users insert, before the new user has any session to satisfy RLS
-- with.

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
