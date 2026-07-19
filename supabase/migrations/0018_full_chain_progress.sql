-- ChainLink schema: 0018 — full-chain progression and transaction assignment
--
-- Makes the documented chain-creator administrator role enforceable, keeps
-- seller/buyer participant assignments in sync with transaction nodes, repairs
-- historical starter milestones, and prevents incomplete milestone sets.

-- A chain creator is its initial administrator even when their participant
-- access_mode is 'guest' (buyers/sellers do not become business accounts).
-- Connected/proxy professionals retain the management capability the existing
-- application already exposed to them.
create or replace function can_manage_chain(target_chain_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from chains c
    join chain_participants cp
      on cp.chain_id = c.id
      and cp.profile_id = auth.uid()
      and cp.status = 'active'
    where c.id = target_chain_id
      and c.created_by_profile_id = auth.uid()
  ) or exists (
    select 1
    from chain_participants cp
    where cp.chain_id = target_chain_id
      and cp.profile_id = auth.uid()
      and cp.status = 'active'
      and cp.access_mode in ('proxy', 'connected')
  );
$$;

revoke all on function can_manage_chain(uuid) from public;
grant execute on function can_manage_chain(uuid) to authenticated;

-- Transaction-side assignments can only be changed by a chain manager.
drop policy if exists chain_nodes_update_by_manager on chain_nodes;
create policy chain_nodes_update_by_manager on chain_nodes
  for update
  using (can_manage_chain(chain_id))
  with check (can_manage_chain(chain_id));

-- A node side must point to an active participant on the same chain with the
-- corresponding role. This protects the invariant even if a future caller
-- bypasses the current service-layer validation.
create or replace function validate_chain_node_participant_sides()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.seller_participant_id is not null and not exists (
    select 1 from chain_participants cp
    where cp.id = new.seller_participant_id
      and cp.chain_id = new.chain_id
      and cp.role = 'seller'
      and cp.status = 'active'
  ) then
    raise exception 'Seller assignment must reference an active seller on this chain';
  end if;

  if new.buyer_participant_id is not null and not exists (
    select 1 from chain_participants cp
    where cp.id = new.buyer_participant_id
      and cp.chain_id = new.chain_id
      and cp.role = 'buyer'
      and cp.status = 'active'
  ) then
    raise exception 'Buyer assignment must reference an active buyer on this chain';
  end if;

  return new;
end;
$$;

drop trigger if exists chain_nodes_validate_participant_sides on chain_nodes;
create trigger chain_nodes_validate_participant_sides
  before insert or update of seller_participant_id, buyer_participant_id on chain_nodes
  for each row execute function validate_chain_node_participant_sides();

-- When accepting a seller/buyer invitation is unambiguous, attach that person
-- to the one vacant transaction side automatically. Branching chains remain a
-- deliberate manager choice rather than an unsafe guess.
create or replace function attach_participant_to_unambiguous_node()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_node_id uuid;
begin
  if new.status <> 'active' or new.role not in ('seller', 'buyer') then
    return new;
  end if;

  if new.role = 'seller' then
    select min(n.id::text)::uuid into target_node_id
    from chain_nodes n
    where n.chain_id = new.chain_id
      and n.seller_participant_id is null
    having count(*) = 1;

    if target_node_id is not null then
      update chain_nodes set seller_participant_id = new.id where id = target_node_id;
    end if;
  else
    select min(n.id::text)::uuid into target_node_id
    from chain_nodes n
    where n.chain_id = new.chain_id
      and n.buyer_participant_id is null
    having count(*) = 1;

    if target_node_id is not null then
      update chain_nodes set buyer_participant_id = new.id where id = target_node_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists chain_participants_attach_to_node on chain_participants;
create trigger chain_participants_attach_to_node
  after insert on chain_participants
  for each row execute function attach_participant_to_unambiguous_node();

-- Chain creators are administrators, not ordinary guest collaborators. Keep
-- the narrow guest-confirmation trigger for every other guest.
create or replace function enforce_guest_milestone_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if my_access_mode(new.chain_id) <> 'guest' or can_manage_chain(new.chain_id) then
    return new;
  end if;

  if old.guest_confirmable is not true or old.visibility <> 'shared' then
    raise exception 'Guests may only confirm milestones marked guest_confirmable';
  end if;

  if new.status <> 'completed' then
    raise exception 'Guests may only confirm (complete) a milestone, not set other statuses';
  end if;

  if new.title is distinct from old.title
    or new.chain_id is distinct from old.chain_id
    or new.chain_node_id is distinct from old.chain_node_id
    or new.template_id is distinct from old.template_id
    or new.due_date is distinct from old.due_date
    or new.visibility is distinct from old.visibility
    or new.organisation_id is distinct from old.organisation_id
    or new.guest_confirmable is distinct from old.guest_confirmable
    or new.on_behalf_of_participant_id is distinct from old.on_behalf_of_participant_id
  then
    raise exception 'Guests may only update a milestone''s status';
  end if;

  return new;
end;
$$;

-- Prevent duplicate copies of the same standard stage on one transaction.
create unique index if not exists milestones_node_template_unique_idx
  on milestones(chain_node_id, template_id)
  where chain_node_id is not null and template_id is not null;

-- Repair accepted seller/buyer participants that pre-date automatic node
-- attachment, but only where the mapping is unambiguous.
with unambiguous_chain as (
  select
    n.chain_id,
    min(n.id::text)::uuid as node_id,
    min(cp.id::text)::uuid as participant_id
  from chain_nodes n
  join chain_participants cp
    on cp.chain_id = n.chain_id
    and cp.role = 'seller'
    and cp.status = 'active'
  where n.seller_participant_id is null
  group by n.chain_id
  having count(distinct n.id) = 1 and count(distinct cp.id) = 1
)
update chain_nodes n
set seller_participant_id = candidate.participant_id
from unambiguous_chain candidate
where n.id = candidate.node_id;

with unambiguous_chain as (
  select
    n.chain_id,
    min(n.id::text)::uuid as node_id,
    min(cp.id::text)::uuid as participant_id
  from chain_nodes n
  join chain_participants cp
    on cp.chain_id = n.chain_id
    and cp.role = 'buyer'
    and cp.status = 'active'
  where n.buyer_participant_id is null
  group by n.chain_id
  having count(distinct n.id) = 1 and count(distinct cp.id) = 1
)
update chain_nodes n
set buyer_participant_id = candidate.participant_id
from unambiguous_chain candidate
where n.id = candidate.node_id;

-- Canonical UK residential conveyancing stage set. Names remain stable keys
-- for the visual board; inserting is idempotent so existing installations keep
-- their template IDs and organisation-specific templates remain untouched.
insert into milestone_templates (
  name,
  description,
  default_sequence_index,
  guest_confirmable
)
select stage.name, stage.description, stage.sequence_index, stage.guest_confirmable
from (values
  ('ID verification submitted', 'Identity and AML evidence supplied.', 0, true),
  ('Offer accepted', 'The seller has accepted the buyer''s offer.', 1, false),
  ('Memorandum of sale issued', 'The estate agent has issued the memorandum of sale.', 2, false),
  ('Conveyancer instructed', 'The legal representative has opened the file.', 3, false),
  ('Draft contract pack issued', 'The seller''s conveyancer has issued the draft contract pack.', 4, false),
  ('Searches ordered', 'The buyer''s conveyancer has ordered property searches.', 5, false),
  ('Mortgage offer received', 'The buyer has received their formal mortgage offer.', 6, false),
  ('Enquiries raised', 'The buyer''s conveyancer has raised legal enquiries.', 7, false),
  ('Enquiries resolved', 'All material legal enquiries have been answered.', 8, false),
  ('Ready to exchange', 'All parties are ready to agree exchange and completion dates.', 9, false),
  ('Exchange of contracts', 'Contracts have been exchanged and the transaction is binding.', 10, false),
  ('Completion', 'Funds and legal title have transferred.', 11, false)
) as stage(name, description, sequence_index, guest_confirmable)
where not exists (
  select 1 from milestone_templates existing
  where existing.organisation_id is null
    and lower(trim(existing.name)) = lower(trim(stage.name))
);

update milestone_templates template
set default_sequence_index = stage.sequence_index
from (values
  ('ID verification submitted', 0),
  ('Offer accepted', 1),
  ('Memorandum of sale issued', 2),
  ('Conveyancer instructed', 3),
  ('Draft contract pack issued', 4),
  ('Searches ordered', 5),
  ('Mortgage offer received', 6),
  ('Enquiries raised', 7),
  ('Enquiries resolved', 8),
  ('Ready to exchange', 9),
  ('Exchange of contracts', 10),
  ('Completion', 11)
) as stage(name, sequence_index)
where template.organisation_id is null
  and lower(trim(template.name)) = lower(trim(stage.name));

-- Every transaction receives every global standard stage. Existing rows are
-- preserved; only genuinely missing template/node pairs are inserted.
insert into milestones (
  chain_id,
  chain_node_id,
  template_id,
  title,
  guest_confirmable,
  status,
  completed_at,
  source
)
select
  n.chain_id,
  n.id,
  t.id,
  t.name,
  t.guest_confirmable,
  case when lower(trim(t.name)) = 'offer accepted' then 'completed' else 'pending' end,
  case when lower(trim(t.name)) = 'offer accepted' then coalesce(n.created_at, now()) else null end,
  'system'
from chain_nodes n
join milestone_templates t on t.organisation_id is null
where not exists (
  select 1
  from milestones m
  where m.chain_node_id = n.id and m.template_id = t.id
)
on conflict do nothing;

-- A previous application version completed whichever template sorted first.
-- Repair only the recognisable generated pattern: ID completed immediately at
-- node creation while Offer accepted from the same generated set is pending.
with affected as (
  select id_m.id as id_milestone_id, offer_m.id as offer_milestone_id
  from milestones id_m
  join milestones offer_m
    on offer_m.chain_id = id_m.chain_id
    and offer_m.chain_node_id = id_m.chain_node_id
  where lower(trim(id_m.title)) = 'id verification submitted'
    and id_m.status = 'completed'
    and id_m.completed_at is not null
    and abs(extract(epoch from (id_m.completed_at - id_m.created_at))) < 120
    and lower(trim(offer_m.title)) = 'offer accepted'
    and offer_m.status = 'pending'
    and abs(extract(epoch from (offer_m.created_at - id_m.created_at))) < 5
), repaired_offer as (
  update milestones m
  set status = 'completed', completed_at = m.created_at, source = 'system'
  from affected a
  where m.id = a.offer_milestone_id
  returning a.id_milestone_id
)
update milestones m
set status = 'pending', completed_at = null, recorded_by_participant_id = null, source = 'system'
from repaired_offer r
where m.id = r.id_milestone_id;
