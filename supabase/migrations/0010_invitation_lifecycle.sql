-- ChainLink schema: 0010 — invitation lifecycle
--
-- Expands invitations.status from the original 4 values
-- (pending/accepted/expired/revoked) to the full lifecycle used by the
-- invitation UI:
--
--   invited  -> viewed  -> accepted  (guest/proxy-side outcome)
--                       -> linked    (matched into an existing firm workspace)
--            -> declined
--   (any of the above) -> inactive   (revoked by inviter, or superseded)
--
-- See docs/DECISIONS.md ("Invitation lifecycle lives on invitations, not
-- chain_participants") for why this is modelled here rather than as new
-- chain_participants states.

alter table invitations drop constraint invitations_status_check;

alter table invitations
  alter column status set default 'invited';

update invitations set status = 'invited' where status = 'pending';
update invitations set status = 'inactive' where status in ('expired', 'revoked');

alter table invitations
  add constraint invitations_status_check
  check (status in ('invited', 'viewed', 'accepted', 'linked', 'declined', 'inactive'));

alter table invitations
  add column viewed_at timestamptz,
  add column declined_at timestamptz,
  -- Set when the invitation resolves into a real participant (accepted or
  -- linked). Lets the UI go straight from an invitation record to "who did
  -- this become", and prevents accidentally creating a second participant
  -- row if the accept action is somehow triggered twice.
  add column resulting_participant_id uuid references chain_participants(id) on delete set null;

-- Recipients act on their own invitations directly (accept/decline), scoped
-- by their *authenticated* email matching the invitation's email — never by
-- the token alone once a session exists. The pre-login "view" transition
-- (invited -> viewed) is handled separately via a narrow service-role
-- lookup (see src/lib/supabase/admin.ts) since there is no session yet at
-- that point to check against.
--
-- SELECT must be granted here too, not just UPDATE: the existing
-- invitations_select policy (0008) only covers chain members, but an
-- invitee checking their own invitation is by definition not a chain
-- member yet — without this, the accept/decline flow would silently see
-- zero rows for a perfectly valid invitation.
create policy invitations_select_by_recipient on invitations
  for select using (
    lower(email) = lower((select email from profiles where id = auth.uid()))
  );

create policy invitations_update_by_recipient on invitations
  for update using (
    lower(email) = lower((select email from profiles where id = auth.uid()))
  );

-- Inviters (any active member of the chain) can revoke a pending invitation.
create policy invitations_update_by_chain_member on invitations
  for update using (is_chain_member(chain_id));
