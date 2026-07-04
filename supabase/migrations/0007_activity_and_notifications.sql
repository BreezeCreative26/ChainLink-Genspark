-- ChainLink schema: 0007 — activity_logs, notifications

-- activity_logs is the immutable audit trail referenced throughout
-- docs/PRODUCT_BRIEF.md and docs/OPERATING_MODEL.md. It is intentionally
-- generic (entity_type/entity_id) rather than one row type per action, so
-- new event types don't require schema changes.
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,

  actor_participant_id uuid references chain_participants(id) on delete set null, -- null = system-generated
  on_behalf_of_participant_id uuid references chain_participants(id) on delete set null,

  action text not null, -- e.g. 'milestone.completed', 'document.uploaded'
  entity_type text not null,
  entity_id uuid not null,

  source text not null default 'manual' check (source in ('manual', 'proxy', 'system')),
  visibility text not null default 'shared' check (visibility in ('shared', 'internal')),
  organisation_id uuid references organisations(id) on delete cascade,

  metadata jsonb,

  created_at timestamptz not null default now(),

  constraint internal_activity_requires_org
    check (visibility <> 'internal' or organisation_id is not null)
);

create index activity_logs_chain_id_idx on activity_logs(chain_id);
create index activity_logs_created_at_idx on activity_logs(created_at);
create index activity_logs_organisation_id_idx on activity_logs(organisation_id);

-- notifications are per-profile (not per-participant), since a person should
-- receive notifications as themselves regardless of which chain or
-- organisation triggered them.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  chain_id uuid references chains(id) on delete cascade,

  title text not null,
  body text,
  link_path text,

  read_at timestamptz,

  created_at timestamptz not null default now()
);

create index notifications_profile_id_idx on notifications(profile_id);
create index notifications_unread_idx on notifications(profile_id) where read_at is null;
