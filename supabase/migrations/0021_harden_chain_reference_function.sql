-- ChainLink schema: 0021 — harden chain reference generation
-- Pin the search path and execute as the function owner so collision checks are
-- independent of caller RLS while exposing no table data.

create or replace function generate_chain_ref()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  charset text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  attempt int := 0;
begin
  loop
    candidate := 'CHAIN-';
    for i in 1..6 loop
      candidate := candidate || substr(charset, floor(random() * length(charset) + 1)::int, 1);
    end loop;

    exit when not exists (select 1 from chains where chain_ref = candidate);
    attempt := attempt + 1;
    if attempt > 20 then
      raise exception 'Could not generate a unique chain_ref after % attempts', attempt;
    end if;
  end loop;

  return candidate;
end;
$$;

revoke all on function generate_chain_ref() from public;
grant execute on function generate_chain_ref() to authenticated;
