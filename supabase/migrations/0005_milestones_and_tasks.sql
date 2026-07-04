-- ChainLink schema: 0005 — milestone_templates, milestones, tasks
--
-- Introduces the two cross-cutting columns used by every content table from
-- here on:
--   visibility: 'shared' | 'internal' — the two-tier model from
--     docs/OPERATING_MODEL.md ("Internal vs Shared Visibility"). No third
--     tier — guests simply see 'shared' content on the one chain they're on,
--     same as any other participant.
--   source + recorded_by/on_behalf_of: attribution for proxy-mode updates
--     (docs/PRODUCT_BRIEF.md "Proxy Mode") — lets the UI show "entered by
--     [agent] on behalf of [seller]" rather than attributing it to the
--     represented party directly.

-- Templates let a firm (or ChainLink itself, organisation_id null) define
-- a standard milestone set to apply to new chains, rather than every agent
-- re-typing "mortgage offer received" from scratch each time.
create table milestone_templates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id) on delete cascade, -- null = global/system template
  name text not null,
  description text,
  default_sequence_index int not null default 0,
  created_at timestamptz not null default now()
);

create index milestone_templates_organisation_id_idx on milestone_templates(organisation_id);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  -- Nullable: some milestones are chain-wide (e.g. "chain complete"); others
  -- apply to one transaction within the chain (e.g. "mortgage offer" for a
  -- specific buyer).
  chain_node_id uuid references chain_nodes(id) on delete cascade,
  template_id uuid references milestone_templates(id) on delete set null,

  title text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'blocked')),
  due_date date,
  completed_at timestamptz,

  visibility text not null default 'shared' check (visibility in ('shared', 'internal')),
  -- Required when visibility = 'internal', scoping it to one firm.
  organisation_id uuid references organisations(id) on delete cascade,

  source text not null default 'manual' check (source in ('manual', 'proxy', 'system')),
  recorded_by_participant_id uuid references chain_participants(id) on delete set null,
  on_behalf_of_participant_id uuid references chain_participants(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint internal_milestone_requires_org
    check (visibility <> 'internal' or organisation_id is not null)
);

create trigger milestones_set_updated_at
  before update on milestones
  for each row execute function set_updated_at();

create index milestones_chain_id_idx on milestones(chain_id);
create index milestones_chain_node_id_idx on milestones(chain_node_id);
create index milestones_organisation_id_idx on milestones(organisation_id);

-- Tasks default to 'internal' (opposite of milestones) because most tasks
-- are a firm's own working items ("chase searches"), not something the
-- other side of the transaction needs to see. They can be marked 'shared'
-- when relevant (e.g. a task assigned across firms).
create table tasks (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  milestone_id uuid references milestones(id) on delete set null,

  title text not null,
  description text,
  assigned_to_participant_id uuid references chain_participants(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  due_date date,

  visibility text not null default 'internal' check (visibility in ('shared', 'internal')),
  organisation_id uuid references organisations(id) on delete cascade,

  source text not null default 'manual' check (source in ('manual', 'proxy', 'system')),
  created_by_participant_id uuid references chain_participants(id) on delete set null,
  on_behalf_of_participant_id uuid references chain_participants(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint internal_task_requires_org
    check (visibility <> 'internal' or organisation_id is not null)
);

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

create index tasks_chain_id_idx on tasks(chain_id);
create index tasks_assigned_to_participant_id_idx on tasks(assigned_to_participant_id);
create index tasks_organisation_id_idx on tasks(organisation_id);
