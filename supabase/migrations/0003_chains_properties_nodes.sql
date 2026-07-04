-- ChainLink schema: 0003 — chains, properties, chain_nodes
--
-- A chain is never owned by an organisation (docs/DECISIONS.md). It is the
-- canonical workspace; organisations only gain a *view* into it via
-- chain_participants (0004).

-- Generates a human-readable, unique Chain ID, e.g. "CHAIN-7K2F9X".
-- Retries on collision, which is exceedingly unlikely at this keyspace size
-- but the retry loop makes the guarantee absolute rather than probabilistic.
create or replace function generate_chain_ref()
returns text as $$
declare
  charset text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I to avoid ambiguity
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
$$ language plpgsql;

create table chains (
  id uuid primary key default gen_random_uuid(),
  -- The Chain ID referenced throughout docs/OPERATING_MODEL.md. Stable for
  -- the chain's lifetime; this is what invites and integrations reference.
  chain_ref text not null unique default generate_chain_ref(),
  status text not null default 'active'
    check (status in ('active', 'stalled', 'completed', 'fallen_through')),
  created_by_profile_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger chains_set_updated_at
  before update on chains
  for each row execute function set_updated_at();

create index chains_created_by_profile_id_idx on chains(created_by_profile_id);

-- A property is scoped to the chain it's part of. (If the same physical
-- address ever appears in two chains — e.g. a fallen-through chain restarted
-- — that's a new property row in the new chain, not a shared reference. This
-- keeps chain data fully self-contained and avoids cross-chain leakage
-- through a shared property record.)
create table properties (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  address_line1 text not null,
  address_line2 text,
  city text,
  postcode text,
  country text not null default 'GB',
  listing_price numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger properties_set_updated_at
  before update on properties
  for each row execute function set_updated_at();

create index properties_chain_id_idx on properties(chain_id);

-- chain_nodes (aka "transactions"): one row per property transaction within
-- a chain (a single seller -> buyer sale). Chains branch in the real world
-- (a buyer's own onward purchase is a second transaction feeding into the
-- same chain), so this is deliberately not a flat ordered list.
--
-- Topology decision (see docs/DECISIONS.md, "Chain topology" — now
-- resolved): each node may declare a single `depends_on_node_id`, meaning
-- "this transaction cannot complete until that transaction completes." This
-- gives a tree, which covers the overwhelmingly common real-world shape
-- (a person selling in order to buy). A node with no dependents and no
-- dependency is a simple two-party chain. Multi-parent dependencies (a full
-- DAG) are not modelled yet — no current product requirement needs it, and
-- it can be added later without breaking this shape, by promoting
-- depends_on_node_id into a separate edges table if the need arises.
create table chain_nodes (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  depends_on_node_id uuid references chain_nodes(id) on delete set null,
  sequence_index int,
  status text not null default 'active'
    check (status in ('active', 'exchanged', 'completed', 'fallen_through')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger chain_nodes_set_updated_at
  before update on chain_nodes
  for each row execute function set_updated_at();

create index chain_nodes_chain_id_idx on chain_nodes(chain_id);
create index chain_nodes_depends_on_node_id_idx on chain_nodes(depends_on_node_id);
