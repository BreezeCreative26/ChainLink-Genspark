-- Resolve the PL/pgSQL output-variable/column ambiguity in the participant
-- upsert used by atomic invitation acceptance. Migration 0023 is already live,
-- so production receives this correction through a new migration version.
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
  on conflict on constraint chain_participants_chain_id_profile_id_role_key do update
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
