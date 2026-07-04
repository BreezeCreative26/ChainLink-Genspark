-- ChainLink schema: 0012 — guest capabilities
--
-- Implements the guest one-chain experience's safety boundaries:
--   - a guest may confirm ONLY milestones explicitly flagged
--     guest_confirmable, and only their status — nothing else about the
--     row, enforced by a trigger (not just application code)
--   - a guest document upload must carry one of a fixed set of approved
--     categories — enforced by a check constraint, so "approved" is a
--     structural property of the data
--
-- See docs/DECISIONS.md ("Guest experience") for the reasoning.

create or replace function my_access_mode(target_chain_id uuid)
returns text
language sql
security definer
stable
as $$
  select access_mode from chain_participants
  where chain_id = target_chain_id
    and profile_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

-- ── Guest-confirmable milestones ──────────────────────────────────────

alter table milestones
  add column guest_confirmable boolean not null default false;

alter table milestone_templates
  add column guest_confirmable boolean not null default false;

-- There was previously no UPDATE policy on milestones at all (only select
-- and insert) — nobody could mark a milestone complete via the client.
-- This adds the general case; the trigger below narrows it further for
-- guests specifically.
create policy milestones_update on milestones
  for update using (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create or replace function enforce_guest_milestone_confirmation()
returns trigger
language plpgsql
security definer
as $$
begin
  if my_access_mode(new.chain_id) <> 'guest' then
    return new; -- non-guests are governed by the policy above only
  end if;

  if old.guest_confirmable is not true or old.visibility <> 'shared' then
    raise exception 'Guests may only confirm milestones marked guest_confirmable';
  end if;

  if new.status <> 'completed' then
    raise exception 'Guests may only confirm (complete) a milestone, not set other statuses';
  end if;

  -- Everything except status/completed_at/source/recorded_by_participant_id
  -- must be byte-for-byte unchanged. This is the actual safety guarantee —
  -- without it, a guest with a guest_confirmable row to update could in
  -- principle also smuggle in changes to the title, due date, or
  -- visibility of that same row.
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

create trigger milestones_guest_confirmation_guard
  before update on milestones
  for each row execute function enforce_guest_milestone_confirmation();

-- ── Approved document categories ──────────────────────────────────────

alter table documents
  add column category text
    check (category in (
      'id_verification', 'proof_of_funds', 'proof_of_address',
      'mortgage_offer', 'other'
    ));

-- Guests must categorize what they upload — professionals may still upload
-- without a category (e.g. internal working documents), so this is scoped
-- to guests specifically via a restrictive policy rather than a blanket
-- NOT NULL constraint.
create policy documents_guest_requires_category
  on documents
  as restrictive
  for insert
  with check (
    my_access_mode(chain_id) <> 'guest' or category is not null
  );
