-- ChainLink schema: 0004 — chain_participants, invitations
--
-- This is the core of the access model described in docs/ARCHITECTURE.md
-- and docs/OPERATING_MODEL.md: access is scoped per participant record, not
-- per user, and access_mode (proxy / guest / connected) lives here.

create table chain_participants (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,

  role text not null check (role in (
    'seller', 'buyer',
    'sellers_agent', 'buyers_agent',
    'sellers_conveyancer', 'buyers_conveyancer',
    'broker'
  )),

  -- proxy: someone else (proxy_manager_participant_id) enters updates on
  --   this participant's behalf — e.g. a non-technical seller.
  -- guest: this participant manages their own single-chain access, with no
  --   business account behind it.
  -- connected: this participant is acting under a firm-linked account;
  --   organisation_id must be set when access_mode = 'connected'.
  access_mode text not null check (access_mode in ('proxy', 'guest', 'connected')),

  -- Set only when access_mode = 'connected'. This is what makes the chain
  -- appear in a firm's business workspace (docs/OPERATING_MODEL.md, "How a
  -- Chain Links Into a Firm Workspace"). Because this lives on the
  -- participant, not the chain, multiple firms can independently be
  -- connected to the same chain (docs/DECISIONS.md — now resolved).
  organisation_id uuid references organisations(id) on delete set null,

  -- Set only when access_mode = 'proxy'. Points at the participant entering
  -- updates on this participant's behalf (typically their agent).
  proxy_manager_participant_id uuid references chain_participants(id) on delete set null,

  status text not null default 'active' check (status in ('active', 'removed')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (chain_id, profile_id, role),

  constraint connected_requires_organisation
    check (access_mode <> 'connected' or organisation_id is not null),
  constraint proxy_requires_manager
    check (access_mode <> 'proxy' or proxy_manager_participant_id is not null)
);

create trigger chain_participants_set_updated_at
  before update on chain_participants
  for each row execute function set_updated_at();

create index chain_participants_chain_id_idx on chain_participants(chain_id);
create index chain_participants_profile_id_idx on chain_participants(profile_id);
create index chain_participants_organisation_id_idx on chain_participants(organisation_id);

-- Now that chain_participants exists, attach seller/buyer sides to each
-- transaction node. Nullable because a node may be created before both
-- sides have joined (e.g. a chain started before the buyer is known).
alter table chain_nodes
  add column seller_participant_id uuid references chain_participants(id) on delete set null,
  add column buyer_participant_id uuid references chain_participants(id) on delete set null;

create index chain_nodes_seller_participant_id_idx on chain_nodes(seller_participant_id);
create index chain_nodes_buyer_participant_id_idx on chain_nodes(buyer_participant_id);

-- invitations represent the pre-acceptance state. A chain_participants row
-- is only created on acceptance — see docs/OPERATING_MODEL.md ("Invitation
-- Flow"). Keeping these separate avoids half-formed participant rows for
-- people who never accept.
create table invitations (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  email text not null,
  role text not null check (role in (
    'seller', 'buyer',
    'sellers_agent', 'buyers_agent',
    'sellers_conveyancer', 'buyers_conveyancer',
    'broker'
  )),
  invited_by_participant_id uuid not null references chain_participants(id),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  -- Set on acceptance. If a profile with this email already exists, this is
  -- filled immediately — this is the mechanism behind "if the invited
  -- professional already has a ChainLink account" in docs/OPERATING_MODEL.md.
  matched_profile_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index invitations_chain_id_idx on invitations(chain_id);
create index invitations_email_idx on invitations(email);
create unique index invitations_token_idx on invitations(token);
