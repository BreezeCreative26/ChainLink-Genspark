-- ChainLink schema: 0015 — document categories, role-based upload rules,
-- storage limits
--
-- Supersedes the guest-oriented category list from 0012 with the full
-- conveyancing-workflow taxonomy. See docs/DECISIONS.md ("Document
-- handling") for the reasoning and the explicit legal-review flag on the
-- category/role mapping below.

-- ── Migrate existing data before changing the constraint ─────────────────

update documents set category = 'id_docs' where category = 'id_verification';
update documents set category = 'other' where category in ('proof_of_funds', 'proof_of_address');
-- 'mortgage_offer' and 'other' are unchanged; nothing else existed under
-- the old taxonomy.

alter table documents drop constraint documents_category_check;

alter table documents
  add constraint documents_category_check
  check (category in (
    'memorandum_of_sale', 'id_docs', 'sales_forms', 'epc',
    'contract_pack', 'search_results', 'mortgage_offer', 'other'
  ));

-- ── Role-based upload rules ───────────────────────────────────────────────
--
-- COMPLIANCE NOTE: this specific category/role mapping is a product
-- default, not a compliance ruling — it has not been reviewed against
-- CQS/Law Society or AML regulatory requirements for who may validly
-- handle which document types. Treat as subject to legal review before
-- relying on it in a regulated context.

drop policy if exists documents_guest_requires_category on documents;

-- Guests may only supply the categories a personal party would plausibly
-- have themselves — never a professionally-produced legal document.
create policy documents_guest_category_restricted
  on documents
  as restrictive
  for insert
  with check (
    my_access_mode(chain_id) <> 'guest'
    or category in ('id_docs', 'sales_forms', 'other')
  );

create or replace function my_role_on_chain(target_chain_id uuid)
returns text
language sql
security definer
stable
as $$
  select role from chain_participants
  where chain_id = target_chain_id
    and profile_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

-- The two most legally sensitive categories are restricted to conveyancer
-- roles specifically — an agent or guest cannot upload a contract pack or
-- search results, even though both may be able to upload other categories.
create policy documents_conveyancer_only_categories
  on documents
  as restrictive
  for insert
  with check (
    category not in ('contract_pack', 'search_results')
    or my_role_on_chain(chain_id) in ('sellers_conveyancer', 'buyers_conveyancer')
  );

-- ── Storage limits ("secure sensible defaults") ──────────────────────────
-- 20MB covers scanned document packs generously without allowing
-- arbitrarily large uploads. Mime types cover the realistic set for this
-- workflow: PDF (the overwhelming majority), common image formats (photos
-- of ID/EPC certificates), and Word docs (some sales forms still
-- circulate as .docx).

update storage.buckets
set
  file_size_limit = 20 * 1024 * 1024,
  allowed_mime_types = array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
where id = 'chain-documents';
