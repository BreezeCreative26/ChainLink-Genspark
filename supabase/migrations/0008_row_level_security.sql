-- ChainLink schema: 0008 — Row Level Security
--
-- Implements the permission principles from docs/ARCHITECTURE.md:
--   "RLS as the primary enforcement mechanism, application-layer checks as
--   a second layer." This migration covers the core read/write rules that
--   make the three access modes (proxy/guest/connected) and the
--   shared/internal visibility split actually hold at the database level.
--
-- Scope note: this is the MVP baseline — enough that no query can leak data
-- across chains or across firms. A full security review/hardening pass is
-- scheduled for Phase 3 ("Reporting + Hardening") per docs/ROADMAP.md, e.g.
-- tightening who can change access_mode/organisation_id on a participant.

-- ── Helper functions ─────────────────────────────────────────────────────
-- security definer + stable: safe to call inside RLS policies without
-- triggering recursive policy evaluation on the tables they query.

create or replace function is_chain_member(target_chain_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from chain_participants
    where chain_id = target_chain_id
      and profile_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from memberships
    where organisation_id = target_org_id
      and profile_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function shares_chain_with(target_profile_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from chain_participants a
    join chain_participants b on a.chain_id = b.chain_id
    where a.profile_id = auth.uid()
      and b.profile_id = target_profile_id
      and a.status = 'active'
      and b.status = 'active'
  );
$$;

-- ── Enable RLS everywhere ────────────────────────────────────────────────

alter table organisations enable row level security;
alter table branches enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;
alter table chains enable row level security;
alter table properties enable row level security;
alter table chain_nodes enable row level security;
alter table chain_participants enable row level security;
alter table invitations enable row level security;
alter table milestone_templates enable row level security;
alter table milestones enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;
alter table documents enable row level security;
alter table activity_logs enable row level security;
alter table notifications enable row level security;

-- ── organisations / branches / memberships ──────────────────────────────

create policy organisations_select on organisations
  for select using (is_org_member(id));

create policy branches_select on branches
  for select using (is_org_member(organisation_id));

create policy memberships_select on memberships
  for select using (profile_id = auth.uid() or is_org_member(organisation_id));

-- ── profiles ─────────────────────────────────────────────────────────────

create policy profiles_select_self on profiles
  for select using (id = auth.uid());

create policy profiles_select_shared_chain on profiles
  for select using (shares_chain_with(id));

create policy profiles_update_self on profiles
  for update using (id = auth.uid());

-- ── chains / properties / chain_nodes / chain_participants ──────────────

create policy chains_select on chains
  for select using (is_chain_member(id));

create policy properties_select on properties
  for select using (is_chain_member(chain_id));

create policy chain_nodes_select on chain_nodes
  for select using (is_chain_member(chain_id));

create policy chain_participants_select on chain_participants
  for select using (is_chain_member(chain_id));

create policy invitations_select on invitations
  for select using (is_chain_member(chain_id));

-- ── content tables: shared rows visible to any chain member,
--    internal rows visible only within the owning organisation ───────────

create policy milestone_templates_select on milestone_templates
  for select using (organisation_id is null or is_org_member(organisation_id));

create policy milestones_select on milestones
  for select using (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create policy tasks_select on tasks
  for select using (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create policy notes_select on notes
  for select using (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create policy documents_select on documents
  for select using (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create policy activity_logs_select on activity_logs
  for select using (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

-- ── notifications: strictly self-scoped ─────────────────────────────────

create policy notifications_select on notifications
  for select using (profile_id = auth.uid());

create policy notifications_update_self on notifications
  for update using (profile_id = auth.uid());

-- ── baseline write policies ──────────────────────────────────────────────
-- MVP-level: any active chain member can write shared content; internal
-- content requires org membership matching the row's organisation_id.
-- Finer-grained role checks (e.g. only conveyancers can mark legal
-- milestones complete) are a Phase 2/3 refinement, not a Phase 1 blocker.

create policy milestones_insert on milestones
  for insert with check (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create policy tasks_insert on tasks
  for insert with check (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

create policy notes_insert on notes
  for insert with check (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

-- ── core chain-workspace write policies ─────────────────────────────────
-- These exist so the client can actually create a chain end-to-end (chain
-- creation is not restricted to a service-role-only server action). Note
-- the bootstrapping case: the very first chain_participants row on a new
-- chain is inserted by someone who is not yet "a member" of that chain by
-- the is_chain_member() definition — so that policy also allows the
-- chain's creator to insert participant rows directly.

create policy profiles_insert_self on profiles
  for insert with check (id = auth.uid());

create policy chains_insert on chains
  for insert with check (created_by_profile_id = auth.uid());

create policy chain_participants_insert on chain_participants
  for insert with check (
    profile_id = auth.uid()
    or is_chain_member(chain_id)
    or exists (
      select 1 from chains
      where id = chain_id and created_by_profile_id = auth.uid()
    )
  );

create policy invitations_insert on invitations
  for insert with check (is_chain_member(chain_id));

create policy properties_insert on properties
  for insert with check (is_chain_member(chain_id));

create policy chain_nodes_insert on chain_nodes
  for insert with check (is_chain_member(chain_id));

create policy documents_insert on documents
  for insert with check (
    is_chain_member(chain_id)
    and (visibility = 'shared' or is_org_member(organisation_id))
  );

-- organisations, branches, and memberships intentionally have no insert
-- policy yet — creating a business account is a privileged operation
-- expected to go through a server action using the service role for now.
-- This is a deliberate MVP scope cut, not an oversight: see
-- docs/ROADMAP.md Phase 2 for organisation onboarding.
