-- ChainLink schema: 0019 — atomic initial chain workspace creation
-- Creates the chain, creator participant, first property and first transaction
-- in one transaction while preserving the documented access-mode rules.

create or replace function create_chain_workspace(
  p_creator_role text,
  p_address_line1 text,
  p_address_line2 text default null,
  p_city text default null,
  p_postcode text default null,
  p_listing_price numeric default null
)
returns table(
  chain_id uuid,
  chain_ref text,
  chain_status text,
  chain_created_at timestamptz,
  participant_id uuid,
  participant_role text,
  access_mode text,
  organisation_id uuid,
  property_id uuid,
  chain_node_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_profile_id uuid := auth.uid();
  creator_access_mode text := 'guest';
  creator_organisation_id uuid;
  created_chain chains%rowtype;
  created_participant chain_participants%rowtype;
  created_property properties%rowtype;
  created_node chain_nodes%rowtype;
begin
  if creator_profile_id is null then
    raise exception 'Authentication required';
  end if;

  if p_creator_role not in (
    'seller', 'buyer', 'sellers_agent', 'buyers_agent',
    'sellers_conveyancer', 'buyers_conveyancer', 'broker'
  ) then
    raise exception 'Invalid chain participant role';
  end if;

  if nullif(trim(p_address_line1), '') is null then
    raise exception 'Property address is required';
  end if;

  if p_creator_role not in ('seller', 'buyer') then
    select membership.organisation_id into creator_organisation_id
    from memberships membership
    where membership.profile_id = creator_profile_id
      and membership.status = 'active'
      and membership.role in ('owner', 'admin', 'agent', 'conveyancer')
    order by membership.created_at
    limit 1;

    if creator_organisation_id is not null then
      creator_access_mode := 'connected';
    end if;
  end if;

  insert into chains (created_by_profile_id)
  values (creator_profile_id)
  returning * into created_chain;

  insert into chain_participants (
    chain_id, profile_id, role, access_mode, organisation_id
  ) values (
    created_chain.id,
    creator_profile_id,
    p_creator_role,
    creator_access_mode,
    creator_organisation_id
  ) returning * into created_participant;

  insert into properties (
    chain_id, address_line1, address_line2, city, postcode, listing_price
  ) values (
    created_chain.id,
    trim(p_address_line1),
    nullif(trim(p_address_line2), ''),
    nullif(trim(p_city), ''),
    nullif(trim(p_postcode), ''),
    p_listing_price
  ) returning * into created_property;

  insert into chain_nodes (
    chain_id, property_id, sequence_index, seller_participant_id, buyer_participant_id
  ) values (
    created_chain.id,
    created_property.id,
    0,
    case when p_creator_role = 'seller' then created_participant.id else null end,
    case when p_creator_role = 'buyer' then created_participant.id else null end
  ) returning * into created_node;

  return query select
    created_chain.id,
    created_chain.chain_ref,
    created_chain.status,
    created_chain.created_at,
    created_participant.id,
    created_participant.role,
    created_participant.access_mode,
    created_participant.organisation_id,
    created_property.id,
    created_node.id;
end;
$$;

revoke all on function create_chain_workspace(text, text, text, text, text, numeric) from public;
grant execute on function create_chain_workspace(text, text, text, text, text, numeric) to authenticated;
