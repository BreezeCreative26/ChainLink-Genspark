-- ChainLink seed data
--
-- Purpose: give local development a realistic, small dataset that exercises
-- every access mode and visibility rule described in docs/OPERATING_MODEL.md,
-- so the three modes can be sanity-checked against the UI without needing to
-- manually create a whole chain first.
--
-- Scenario seeded:
--   - "Blake & Co." estate agency, connected professional mode
--   - one chain (2 linked transactions: a first-time buyer purchasing from
--     a seller who is simultaneously buying their own onward property)
--   - the seller is proxy-managed by their agent (no email/login of their own)
--   - the buyer is a guest (no business account)
--   - the buyer's conveyancer is a connected professional at a second firm,
--     demonstrating two firms connected to the same chain simultaneously

-- ── Auth users (local/dev only — Supabase Auth normally creates these) ───

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'jordan.blake@blakeco.example', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email"}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'priya.shah@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email"}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'sam.ridley@fenwickconveyancing.example', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email"}', '{}')
on conflict (id) do nothing;

-- ── Profiles ──────────────────────────────────────────────────────────────

insert into profiles (id, full_name, email) values
  ('11111111-1111-1111-1111-111111111111', 'Jordan Blake', 'jordan.blake@blakeco.example'), -- agent, connected
  ('22222222-2222-2222-2222-222222222222', 'Priya Shah', 'priya.shah@example.com'),          -- buyer, guest
  ('33333333-3333-3333-3333-333333333333', 'Sam Ridley', 'sam.ridley@fenwickconveyancing.example') -- conveyancer, connected (2nd firm)
on conflict (id) do nothing;

-- Note: the seller in this scenario ("Margaret Whitfield") is intentionally
-- given NO auth.users/profiles row of her own — proxy mode exists precisely
-- for participants who never create an account. Her chain_participants row
-- below still needs *some* profile_id (schema requires it, per
-- docs/ARCHITECTURE.md "single identity" model), so in practice a
-- lightweight profile is created for her at proxy-invite time without a
-- corresponding auth.users login. We do that here too, for realism.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'margaret.whitfield@example.com', crypt(encode(gen_random_bytes(18), 'hex'), gen_salt('bf')), null, now(), now(), '{"provider":"email"}', '{}')
on conflict (id) do nothing;

insert into profiles (id, full_name, email) values
  ('44444444-4444-4444-4444-444444444444', 'Margaret Whitfield', 'margaret.whitfield@example.com')
on conflict (id) do nothing;

-- ── Organisations, branches, memberships ─────────────────────────────────

insert into organisations (id, name, org_type) values
  ('a1111111-1111-1111-1111-111111111111', 'Blake & Co. Estate Agents', 'estate_agency'),
  ('a2222222-2222-2222-2222-222222222222', 'Fenwick Conveyancing', 'conveyancing_firm')
on conflict (id) do nothing;

insert into branches (id, organisation_id, name) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Chester Branch')
on conflict (id) do nothing;

insert into memberships (organisation_id, branch_id, profile_id, role) values
  ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'agent'),
  ('a2222222-2222-2222-2222-222222222222', null, '33333333-3333-3333-3333-333333333333', 'conveyancer')
on conflict do nothing;

-- ── The chain ─────────────────────────────────────────────────────────────

insert into chains (id, created_by_profile_id) values
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into properties (id, chain_id, address_line1, city, postcode, listing_price) values
  ('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '14 Mill Lane', 'Chester', 'CH1 2AB', 285000.00),
  ('d2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', '2 Orchard Grove', 'Chester', 'CH2 3CD', 340000.00)
on conflict (id) do nothing;

-- ── Chain participants (all three access modes, on one chain) ────────────

-- Agent: connected professional (Blake & Co.)
insert into chain_participants (id, chain_id, profile_id, role, access_mode, organisation_id) values
  ('e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'sellers_agent', 'connected', 'a1111111-1111-1111-1111-111111111111')
on conflict do nothing;

-- Seller: proxy-managed by the agent above (no login of her own)
insert into chain_participants (id, chain_id, profile_id, role, access_mode, proxy_manager_participant_id) values
  ('e2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'seller', 'proxy', 'e1111111-1111-1111-1111-111111111111')
on conflict do nothing;

-- Buyer: guest (no business account)
insert into chain_participants (id, chain_id, profile_id, role, access_mode) values
  ('e3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'buyer', 'guest')
on conflict do nothing;

-- Buyer's conveyancer: connected professional at a second firm (Fenwick),
-- demonstrating two firms connected to the same chain simultaneously.
insert into chain_participants (id, chain_id, profile_id, role, access_mode, organisation_id) values
  ('e4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'buyers_conveyancer', 'connected', 'a2222222-2222-2222-2222-222222222222')
on conflict do nothing;

-- ── Chain nodes: two linked transactions ─────────────────────────────────
-- Node 1: Margaret (seller) selling 14 Mill Lane to Priya (buyer).
-- Node 2: Margaret's own onward purchase of 2 Orchard Grove, which depends
--         on Node 1 completing first — the branching case this schema is
--         built to support (docs/DECISIONS.md, "Chain topology").

insert into chain_nodes (id, chain_id, property_id, seller_participant_id, buyer_participant_id, sequence_index) values
  ('f1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333', 1)
on conflict (id) do nothing;

insert into chain_nodes (id, chain_id, property_id, seller_participant_id, depends_on_node_id, sequence_index) values
  ('f2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', null, 'f1111111-1111-1111-1111-111111111111', 2)
on conflict (id) do nothing;

-- ── Milestone template + milestones ───────────────────────────────────────

insert into milestone_templates (id, organisation_id, name, description, default_sequence_index, guest_confirmable) values
  ('11111111-aaaa-1111-aaaa-111111111111', null, 'Offer accepted', 'Seller has accepted an offer from the buyer.', 1, false),
  ('22222222-aaaa-2222-aaaa-222222222222', null, 'Mortgage offer received', 'Buyer''s lender has issued a formal mortgage offer.', 2, false),
  ('33333333-aaaa-3333-aaaa-333333333333', null, 'Exchange of contracts', 'Contracts exchanged; the transaction is legally binding.', 3, false),
  ('44444444-aaaa-4444-aaaa-444444444444', null, 'Completion', 'Funds transferred and keys released.', 4, false),
  ('55555555-aaaa-5555-aaaa-555555555555', null, 'ID verification submitted', 'Buyer/seller has submitted ID documents for AML checks.', 0, true)
on conflict (id) do nothing;

-- Shared milestone: visible to everyone on the chain.
insert into milestones (chain_id, chain_node_id, template_id, title, status, source, recorded_by_participant_id) values
  ('c1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-111111111111', 'Offer accepted', 'completed', 'proxy', 'e1111111-1111-1111-1111-111111111111');

-- Shared milestone entered on behalf of the proxy-managed seller by her agent.
update milestones
  set on_behalf_of_participant_id = 'e2222222-2222-2222-2222-222222222222'
  where title = 'Offer accepted';

insert into milestones (chain_id, chain_node_id, template_id, title, status) values
  ('c1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', '22222222-aaaa-2222-aaaa-222222222222', 'Mortgage offer received', 'pending');

-- Guest-confirmable milestone, for exercising the guest confirm action.
insert into milestones (chain_id, chain_node_id, template_id, title, status, guest_confirmable) values
  ('c1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', '55555555-aaaa-5555-aaaa-555555555555', 'ID verification submitted', 'pending', true);

-- ── Internal task: visible only within Blake & Co. ────────────────────────

insert into tasks (chain_id, title, description, assigned_to_participant_id, visibility, organisation_id, created_by_participant_id) values
  ('c1111111-1111-1111-1111-111111111111', 'Chase EPC for 14 Mill Lane', 'Needed before listing paperwork is complete.', 'e1111111-1111-1111-1111-111111111111', 'internal', 'a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111');

-- ── Internal note: Fenwick's own working note, not visible to Blake & Co. ─

insert into notes (chain_id, body, visibility, organisation_id, created_by_participant_id) values
  ('c1111111-1111-1111-1111-111111111111', 'Awaiting signed ID verification from buyer before search order.', 'internal', 'a2222222-2222-2222-2222-222222222222', 'e4444444-4444-4444-4444-444444444444');

-- A guest comment, visible to everyone on the chain (shared, no organisation).
insert into notes (chain_id, body, visibility, created_by_participant_id) values
  ('c1111111-1111-1111-1111-111111111111', 'Looking forward to moving in — let me know if you need anything else from me!', 'shared', 'e3333333-3333-3333-3333-333333333333');

-- ── Shared activity log entries ────────────────────────────────────────────

insert into activity_logs (chain_id, actor_participant_id, on_behalf_of_participant_id, action, entity_type, entity_id, source) values
  ('c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'milestone.completed', 'milestone', (select id from milestones where title = 'Offer accepted'), 'proxy');

-- ── A pending invitation, for exercising the "pending invites" UI ────────

insert into invitations (chain_id, email, role, invited_by_participant_id) values
  ('c1111111-1111-1111-1111-111111111111', 'new.broker@progressionpartners.example', 'broker', 'e1111111-1111-1111-1111-111111111111');

-- ── A notification for the guest buyer ────────────────────────────────────

insert into notifications (profile_id, chain_id, title, body, link_path) values
  ('22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Offer accepted', 'The seller has accepted the offer on 14 Mill Lane.', '/chains/c1111111-1111-1111-1111-111111111111');

-- ── A second chain, for the dashboard to actually have something to
--    aggregate across (docs/DECISIONS.md, "Business dashboard") ─────────
-- Same agent (Jordan, Blake & Co.) connected on a second chain, with an
-- overdue milestone (exercises the at-risk widget and overdue actions
-- widget) and an upcoming completion (exercises that widget).

insert into chains (id, created_by_profile_id) values
  ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into properties (id, chain_id, address_line1, city, postcode, listing_price) values
  ('d3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', '9 Riverside Court', 'Chester', 'CH3 5EF', 210000.00)
on conflict (id) do nothing;

insert into chain_participants (id, chain_id, profile_id, role, access_mode, organisation_id) values
  ('e6666666-6666-6666-6666-666666666666', 'c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'sellers_agent', 'connected', 'a1111111-1111-1111-1111-111111111111')
on conflict do nothing;

insert into chain_nodes (id, chain_id, property_id, seller_participant_id, sequence_index) values
  ('f3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333', 'e6666666-6666-6666-6666-666666666666', 1)
on conflict (id) do nothing;

-- Overdue: due_date in the past, still pending — this is what makes the
-- chain show up in "At risk" and "Overdue actions".
insert into milestones (chain_id, chain_node_id, template_id, title, status, due_date) values
  ('c2222222-2222-2222-2222-222222222222', 'f3333333-3333-3333-3333-333333333333', '22222222-aaaa-2222-aaaa-222222222222', 'Mortgage offer received', 'pending', (current_date - interval '5 days'));

-- Upcoming: due in the future — exercises "Upcoming completions".
insert into milestones (chain_id, chain_node_id, template_id, title, status, due_date) values
  ('c2222222-2222-2222-2222-222222222222', 'f3333333-3333-3333-3333-333333333333', '44444444-aaaa-4444-aaaa-444444444444', 'Completion', 'pending', (current_date + interval '10 days'));

insert into activity_logs (chain_id, actor_participant_id, action, entity_type, entity_id, source) values
  ('c2222222-2222-2222-2222-222222222222', 'e6666666-6666-6666-6666-666666666666', 'chain.created', 'chain', 'c2222222-2222-2222-2222-222222222222', 'manual');
