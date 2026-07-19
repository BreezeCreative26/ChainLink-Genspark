-- ChainLink schema: 0023 — standard, atomic chain lifecycle
--
-- Makes the canonical 12-stage journey a database invariant for every
-- transaction, validates topology at the database boundary, narrows management
-- mutations, and provides one atomic RPC for adding linked transactions.

-- Standard stages are created in the same transaction as every chain node.
-- This applies to the initial node created by create_chain_workspace and to
-- every future insertion path, including integrations that do not use the web UI.
create or replace function create_standard_milestones_for_chain_node()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_participant_id uuid;
begin
  select cp.id into creator_participant_id
  from chains c
  join chain_participants cp
    on cp.chain_id = c.id
   and cp.profile_id = c.created_by_profile_id
   and cp.status = 'active'
  where c.id = new.chain_id
  order by cp.created_at
  limit 1;

  insert into milestones (
    chain_id,
    chain_node_id,
    template_id,
    title,
    guest_confirmable,
    status,
    completed_at,
    source,
    recorded_by_participant_id
  )
  select
    new.chain_id,
    new.id,
    template.id,
    template.name,
    template.guest_confirmable,
    case when lower(trim(template.name)) = 'offer accepted' then 'completed' else 'pending' end,
    case when lower(trim(template.name)) = 'offer accepted' then new.created_at else null end,
    'system',
    case when lower(trim(template.name)) = 'offer accepted' then creator_participant_id else null end
  from milestone_templates template
  where template.organisation_id is null
    and lower(trim(template.name)) in (
      'id verification submitted', 'offer accepted', 'memorandum of sale issued',
      'conveyancer instructed', 'draft contract pack issued', 'searches ordered',
      'mortgage offer received', 'enquiries raised', 'enquiries resolved',
      'ready to exchange', 'exchange of contracts', 'completion'
    )
  on conflict (chain_node_id, template_id) do nothing;

  return new;
end;
$$;

-- Use a non-partial unique index so INSERT ... ON CONFLICT can target the
-- invariant directly. PostgreSQL still permits multiple manual rows because
-- NULL template IDs are distinct under a normal unique index.
drop index if exists milestones_node_template_unique_idx;
create unique index milestones_node_template_unique_idx
  on milestones(chain_node_id, template_id);

drop trigger if exists chain_nodes_create_standard_milestones on chain_nodes;
create trigger chain_nodes_create_standard_milestones
  after insert on chain_nodes
  for each row execute function create_standard_milestones_for_chain_node();

-- A transaction's property and dependency must belong to its own chain. The
-- recursive check also prevents cycles if a dependency is changed later.
create or replace function validate_chain_node_topology()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from properties property
    where property.id = new.property_id
      and property.chain_id = new.chain_id
  ) then
    raise exception 'Transaction property must belong to the same chain';
  end if;

  if new.depends_on_node_id is not null then
    if new.depends_on_node_id = new.id then
      raise exception 'A transaction cannot depend on itself';
    end if;

    if not exists (
      select 1 from chain_nodes dependency
      where dependency.id = new.depends_on_node_id
        and dependency.chain_id = new.chain_id
    ) then
      raise exception 'Transaction dependency must belong to the same chain';
    end if;

    if tg_op = 'UPDATE' and exists (
      with recursive ancestors as (
        select dependency.id, dependency.depends_on_node_id
        from chain_nodes dependency
        where dependency.id = new.depends_on_node_id
        union all
        select parent.id, parent.depends_on_node_id
        from chain_nodes parent
        join ancestors child on parent.id = child.depends_on_node_id
      )
      select 1 from ancestors where id = new.id
    ) then
      raise exception 'Transaction dependencies cannot form a cycle';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists chain_nodes_validate_topology on chain_nodes;
create trigger chain_nodes_validate_topology
  before insert or update of chain_id, property_id, depends_on_node_id on chain_nodes
  for each row execute function validate_chain_node_topology();

-- Invitations and proxy participants are management actions. Recipients retain
-- the separate email-scoped invitation policies used to accept or decline.
drop policy if exists invitations_insert on invitations;
create policy invitations_insert_by_manager on invitations
  for insert with check (
    can_manage_chain(chain_id)
    and exists (
      select 1 from chain_participants inviter
      where inviter.id = invited_by_participant_id
        and inviter.chain_id = invitations.chain_id
        and inviter.profile_id = auth.uid()
        and inviter.status = 'active'
    )
  );

drop policy if exists invitations_update_by_chain_member on invitations;
create policy invitations_update_by_manager on invitations
  for update
  using (can_manage_chain(chain_id))
  with check (can_manage_chain(chain_id));

drop policy if exists chain_participants_insert on chain_participants;
create policy chain_participants_insert_standard on chain_participants
  for insert with check (
    profile_id = auth.uid()
    or (
      can_manage_chain(chain_id)
      and access_mode = 'proxy'
      and organisation_id is null
      and exists (
        select 1 from chain_participants manager
        where manager.id = proxy_manager_participant_id
          and manager.chain_id = chain_participants.chain_id
          and manager.profile_id = auth.uid()
          and manager.status = 'active'
      )
    )
  );

-- Adds property + transaction atomically. The node trigger above inserts the
-- canonical milestones before this function can commit.
create or replace function create_linked_chain_transaction(
  p_chain_id uuid,
  p_address_line1 text,
  p_city text default null,
  p_postcode text default null,
  p_depends_on_node_id uuid default null,
  p_seller_participant_id uuid default null,
  p_buyer_participant_id uuid default null
)
returns table(property_id uuid, chain_node_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  created_property_id uuid;
  created_node_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not can_manage_chain(p_chain_id) then
    raise exception 'Chain management permission required';
  end if;

  if nullif(trim(p_address_line1), '') is null then
    raise exception 'Address is required';
  end if;

  if p_depends_on_node_id is not null and not exists (
    select 1 from chain_nodes parent
    where parent.id = p_depends_on_node_id
      and parent.chain_id = p_chain_id
  ) then
    raise exception 'Transaction dependency must belong to the same chain';
  end if;

  insert into properties (chain_id, address_line1, city, postcode)
  values (p_chain_id, trim(p_address_line1), nullif(trim(p_city), ''), nullif(trim(p_postcode), ''))
  returning id into created_property_id;

  insert into chain_nodes (
    chain_id,
    property_id,
    depends_on_node_id,
    seller_participant_id,
    buyer_participant_id,
    sequence_index
  ) values (
    p_chain_id,
    created_property_id,
    p_depends_on_node_id,
    p_seller_participant_id,
    p_buyer_participant_id,
    (select coalesce(max(existing.sequence_index), -1) + 1 from chain_nodes existing where existing.chain_id = p_chain_id)
  ) returning id into created_node_id;

  return query select created_property_id, created_node_id;
end;
$$;

revoke all on function create_linked_chain_transaction(uuid, text, text, text, uuid, uuid, uuid) from public;
grant execute on function create_linked_chain_transaction(uuid, text, text, text, uuid, uuid, uuid) to authenticated;

-- Invitation acceptance is one transaction: the participant grant and terminal
-- invitation state can no longer diverge if either write fails. Email identity
-- and optional organisation membership are rechecked inside the database.
create or replace function accept_chain_invitation(
  p_token text,
  p_link_organisation_id uuid default null
)
returns table(chain_id uuid, participant_id uuid, invitation_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation invitations%rowtype;
  created_participant_id uuid;
  resolved_status text;
  expected_membership_roles text[];
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select candidate.* into invitation
  from invitations candidate
  where candidate.token = p_token
  for update;

  if invitation.id is null
     or invitation.status not in ('invited', 'viewed')
     or invitation.expires_at < now() then
    raise exception 'Invitation is no longer available';
  end if;

  if lower(invitation.email) is distinct from lower((select profile.email from profiles profile where profile.id = auth.uid())) then
    raise exception 'Invitation email does not match the authenticated account';
  end if;

  if p_link_organisation_id is not null then
    expected_membership_roles := case
      when invitation.role in ('sellers_agent', 'buyers_agent') then array['agent', 'admin', 'owner']
      when invitation.role in ('sellers_conveyancer', 'buyers_conveyancer') then array['conveyancer', 'admin', 'owner']
      else array['admin', 'owner', 'staff']
    end;

    if not exists (
      select 1 from memberships membership
      where membership.profile_id = auth.uid()
        and membership.organisation_id = p_link_organisation_id
        and membership.status = 'active'
        and membership.role = any(expected_membership_roles)
    ) then
      raise exception 'No matching active organisation membership';
    end if;
    resolved_status := 'linked';
  else
    resolved_status := 'accepted';
  end if;

  insert into chain_participants (
    chain_id,
    profile_id,
    role,
    access_mode,
    organisation_id
  ) values (
    invitation.chain_id,
    auth.uid(),
    invitation.role,
    case when p_link_organisation_id is null then 'guest' else 'connected' end,
    p_link_organisation_id
  )
  on conflict (chain_id, profile_id, role) do update
    set status = 'active',
        access_mode = excluded.access_mode,
        organisation_id = excluded.organisation_id,
        proxy_manager_participant_id = null
  returning id into created_participant_id;

  update invitations
  set status = resolved_status,
      accepted_at = now(),
      resulting_participant_id = created_participant_id
  where id = invitation.id;

  return query select invitation.chain_id, created_participant_id, resolved_status;
end;
$$;

revoke all on function accept_chain_invitation(text, uuid) from public;
grant execute on function accept_chain_invitation(text, uuid) to authenticated;

-- Repair any incomplete transaction created before this invariant existed.
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
  node.chain_id,
  node.id,
  template.id,
  template.name,
  template.guest_confirmable,
  case when lower(trim(template.name)) = 'offer accepted' then 'completed' else 'pending' end,
  case when lower(trim(template.name)) = 'offer accepted' then node.created_at else null end,
  'system'
from chain_nodes node
join milestone_templates template
  on template.organisation_id is null
 and lower(trim(template.name)) in (
   'id verification submitted', 'offer accepted', 'memorandum of sale issued',
   'conveyancer instructed', 'draft contract pack issued', 'searches ordered',
   'mortgage offer received', 'enquiries raised', 'enquiries resolved',
   'ready to exchange', 'exchange of contracts', 'completion'
 )
on conflict (chain_node_id, template_id) do nothing;
