-- ChainLink schema: 0006 — notes, documents

create table notes (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  chain_node_id uuid references chain_nodes(id) on delete cascade,

  body text not null,

  visibility text not null default 'internal' check (visibility in ('shared', 'internal')),
  organisation_id uuid references organisations(id) on delete cascade,

  source text not null default 'manual' check (source in ('manual', 'proxy')),
  created_by_participant_id uuid references chain_participants(id) on delete set null,
  on_behalf_of_participant_id uuid references chain_participants(id) on delete set null,

  created_at timestamptz not null default now(),

  constraint internal_note_requires_org
    check (visibility <> 'internal' or organisation_id is not null)
);

create index notes_chain_id_idx on notes(chain_id);
create index notes_organisation_id_idx on notes(organisation_id);

-- Documents store metadata only; binary content lives in Supabase Storage
-- at `storage_path`, with bucket policies mirroring this table's visibility
-- rules (see docs/ARCHITECTURE.md, "Supabase provides ... storage with
-- policy-based access control that mirrors the DB permission model").
create table documents (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  chain_node_id uuid references chain_nodes(id) on delete cascade,

  title text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,

  visibility text not null default 'shared' check (visibility in ('shared', 'internal')),
  organisation_id uuid references organisations(id) on delete cascade,

  uploaded_by_participant_id uuid references chain_participants(id) on delete set null,

  created_at timestamptz not null default now(),

  constraint internal_document_requires_org
    check (visibility <> 'internal' or organisation_id is not null)
);

create index documents_chain_id_idx on documents(chain_id);
create index documents_organisation_id_idx on documents(organisation_id);
