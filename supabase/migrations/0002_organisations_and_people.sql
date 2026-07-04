-- ChainLink schema: 0002 — organisations, branches, profiles, memberships
--
-- This is the business-workspace side of the tenancy model described in
-- docs/ARCHITECTURE.md. Organisations and branches exist independently of
-- any chain; the link between them and chains is made later, indirectly,
-- via chain_participants.organisation_id (see 0004).

create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- 'estate_agency' | 'conveyancing_firm' | 'other'
  org_type text not null check (org_type in ('estate_agency', 'conveyancing_firm', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organisations_set_updated_at
  before update on organisations
  for each row execute function set_updated_at();

-- Branches are optional sub-tenancy within an organisation. A firm can stay
-- flat (no branches created) and adopt them later — see docs/DECISIONS.md
-- ("Branch structure necessity for v1").
create table branches (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger branches_set_updated_at
  before update on branches
  for each row execute function set_updated_at();

create index branches_organisation_id_idx on branches(organisation_id);

-- profiles extends Supabase's auth.users with the application-level identity.
-- Per docs/ARCHITECTURE.md ("Auth Model"), there is exactly one identity type
-- — guest vs professional is never encoded here, only on participant records.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create unique index profiles_email_idx on profiles(email);

-- memberships link a profile to an organisation (and optionally a branch),
-- with a role governing what they can do inside the business workspace.
-- This is entirely separate from a person's role on any given chain
-- (see chain_participants in 0004) — a conveyancer is "a solicitor at Firm X"
-- here, and "buyer's conveyancer on Chain Y" there.
create table memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'agent', 'conveyancer', 'staff')),
  status text not null default 'active' check (status in ('active', 'invited', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, profile_id)
);

create trigger memberships_set_updated_at
  before update on memberships
  for each row execute function set_updated_at();

create index memberships_profile_id_idx on memberships(profile_id);
create index memberships_organisation_id_idx on memberships(organisation_id);
create index memberships_branch_id_idx on memberships(branch_id);
