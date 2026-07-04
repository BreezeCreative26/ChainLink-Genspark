-- ChainLink schema: 0011 — DB-level safeguard on 'connected' participants
--
-- The invitation-acceptance service (src/server/services/invitations.ts)
-- only sets access_mode = 'connected' when it has independently verified
-- an active membership for the current user. But per docs/ARCHITECTURE.md
-- ("RLS as the primary enforcement mechanism, application-layer checks as
-- a second layer"), that check must not be the ONLY thing standing between
-- a user and linking a chain into an organisation they don't belong to — a
-- direct API call bypassing the application code entirely must not be able
-- to do this either.
--
-- A RESTRICTIVE policy is used here (rather than adding to the existing
-- permissive chain_participants_insert policy from 0008) because the
-- requirement is a hard AND condition — "connected must correspond to a
-- real membership, no exceptions" — not another way to gain permission.
-- Restrictive and permissive policies combine with AND, so this narrows
-- what 0008's policy allows rather than widening it.

alter table chain_participants enable row level security; -- no-op if already enabled, kept for clarity

create policy chain_participants_connected_requires_real_membership
  on chain_participants
  as restrictive
  for insert
  with check (
    access_mode <> 'connected' or is_org_member(organisation_id)
  );

-- Same restriction applies to updates (e.g. a later feature that lets
-- someone switch their own access_mode) — added now while the gap is fresh,
-- even though no update path exists yet.
create policy chain_participants_connected_requires_real_membership_update
  on chain_participants
  as restrictive
  for update
  with check (
    access_mode <> 'connected' or is_org_member(organisation_id)
  );
