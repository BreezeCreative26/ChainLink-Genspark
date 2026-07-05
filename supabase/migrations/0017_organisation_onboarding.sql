-- ChainLink schema: 0017 — organisation onboarding + tasks_update gap
--
-- Two real gaps found in the commercial-grade audit:
--   1. No INSERT policy existed for organisations or memberships at all —
--      there was no way for a user to ever create a firm. This adds a
--      carefully-scoped bootstrap path, not an open one.
--   2. No UPDATE policy existed for tasks — a task could be created but
--      never marked done.

-- ── Organisations: anyone can create an inert org shell ─────────────────
-- A bare organisations row (name, org_type) grants no access to anything
-- by itself — it only becomes meaningful once someone is a member of it,
-- which the memberships policies below control carefully.
create policy organisations_insert on organisations
  for insert with check (true);

-- ── Memberships: the actual privilege boundary ──────────────────────────

-- Bootstrap case: claim ownership of a brand-new organisation that has no
-- members yet. This is what makes organisation creation possible at all,
-- and it's safe specifically because it requires zero existing members —
-- you cannot use this to insert yourself into an existing firm.
create policy memberships_insert_first_owner on memberships
  for insert
  with check (
    profile_id = auth.uid()
    and role = 'owner'
    and not exists (
      select 1 from memberships m2 where m2.organisation_id = memberships.organisation_id
    )
  );

-- Ongoing case: an existing active owner/admin can add a teammate.
create policy memberships_insert_by_admin on memberships
  for insert
  with check (
    exists (
      select 1 from memberships actor
      where actor.organisation_id = memberships.organisation_id
        and actor.profile_id = auth.uid()
        and actor.status = 'active'
        and actor.role in ('owner', 'admin')
    )
  );

-- Safety net combining with both policies above: 'owner' can ONLY ever be
-- granted via the bootstrap path (i.e. the founding owner of a brand-new
-- org). Adding co-owners later isn't built yet — deliberately out of
-- scope for now, see docs/DECISIONS.md.
create policy memberships_owner_role_bootstrap_only
  on memberships
  as restrictive
  for insert
  with check (
    role <> 'owner'
    or not exists (
      select 1 from memberships m2 where m2.organisation_id = memberships.organisation_id
    )
  );

-- Managing existing memberships (e.g. removing a teammate via
-- status = 'removed', or changing their branch) — owner/admin only.
create policy memberships_update_by_admin on memberships
  for update
  using (
    exists (
      select 1 from memberships actor
      where actor.organisation_id = memberships.organisation_id
        and actor.profile_id = auth.uid()
        and actor.status = 'active'
        and actor.role in ('owner', 'admin')
    )
  );

-- Same owner-role safety net for updates: an admin cannot promote anyone
-- (including themselves) to owner. Only an existing owner can.
create policy memberships_owner_role_requires_owner_actor_update
  on memberships
  as restrictive
  for update
  with check (
    role <> 'owner'
    or exists (
      select 1 from memberships actor
      where actor.organisation_id = memberships.organisation_id
        and actor.profile_id = auth.uid()
        and actor.status = 'active'
        and actor.role = 'owner'
    )
  );

-- ── Tasks: the missing update policy ─────────────────────────────────────
create policy tasks_update on tasks
  for update using (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );
