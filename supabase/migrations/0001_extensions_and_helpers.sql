-- ChainLink schema: 0001 — extensions and shared helpers
--
-- Establishes extensions and a reusable trigger function for maintaining
-- `updated_at` columns, used by every table that has one.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
