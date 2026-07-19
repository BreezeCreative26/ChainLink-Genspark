import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  try {
    for (const rawLine of readFileSync(path, "utf8").split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      process.env[key] ??= value;
    }
  } catch {
    // CI and Vercel can provide variables directly.
  }
}

loadEnvFile(new URL("../.env.local", import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("Supabase URL, anon key and service-role key are required.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `ChainLink-${crypto.randomUUID()}!aA1`;
const users = [];
const chains = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function createUser(label) {
  const email = `chain-lifecycle-${label}-${runId}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Lifecycle ${label}` },
  });
  if (error || !data.user) throw error ?? new Error("User creation returned no user");
  users.push(data.user.id);
  return { id: data.user.id, email };
}

async function sessionFor(email) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function createWorkspace(client, address, role = "seller") {
  const { data, error } = await client.rpc("create_chain_workspace", {
    p_creator_role: role,
    p_address_line1: address,
    p_address_line2: null,
    p_city: "Lifecycle Test",
    p_postcode: "TE5 7AA",
    p_listing_price: 250000,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Workspace RPC returned no row");
  chains.push(row.chain_id);
  return row;
}

async function milestoneCount(nodeId) {
  const { count, error } = await admin
    .from("milestones")
    .select("id", { count: "exact", head: true })
    .eq("chain_node_id", nodeId)
    .not("template_id", "is", null);
  if (error) throw error;
  return count ?? 0;
}

try {
  const creator = await createUser("creator");
  const buyer = await createUser("buyer");
  const creatorClient = await sessionFor(creator.email);
  const buyerClient = await sessionFor(buyer.email);

  const first = await createWorkspace(creatorClient, `1 System Standard Road ${runId}`);
  assert(await milestoneCount(first.chain_node_id) === 12, "initial transaction receives all 12 canonical stages atomically");

  const { data: offer, error: offerError } = await admin
    .from("milestones")
    .select("status")
    .eq("chain_node_id", first.chain_node_id)
    .eq("title", "Offer accepted")
    .single();
  if (offerError) throw offerError;
  assert(offer.status === "completed", "Offer accepted is the initial completed stage");

  const { data: invitation, error: invitationError } = await creatorClient
    .from("invitations")
    .insert({
      chain_id: first.chain_id,
      email: buyer.email,
      role: "buyer",
      invited_by_participant_id: first.participant_id,
    })
    .select("token")
    .single();
  if (invitationError) throw invitationError;

  const { data: acceptedRows, error: acceptError } = await buyerClient.rpc(
    "accept_chain_invitation",
    { p_token: invitation.token, p_link_organisation_id: null }
  );
  if (acceptError) throw acceptError;
  const accepted = Array.isArray(acceptedRows) ? acceptedRows[0] : acceptedRows;
  assert(Boolean(accepted?.participant_id), "invitation acceptance atomically creates an active participant");

  const { data: assignedNode, error: assignmentError } = await admin
    .from("chain_nodes")
    .select("buyer_participant_id")
    .eq("id", first.chain_node_id)
    .single();
  if (assignmentError) throw assignmentError;
  assert(assignedNode.buyer_participant_id === accepted.participant_id, "an unambiguous accepted buyer is assigned to the vacant transaction side");

  const { data: linkedRows, error: linkedError } = await creatorClient.rpc(
    "create_linked_chain_transaction",
    {
      p_chain_id: first.chain_id,
      p_address_line1: `2 Linked Transaction Avenue ${runId}`,
      p_city: "Lifecycle Test",
      p_postcode: "TE5 7BB",
      p_depends_on_node_id: first.chain_node_id,
      p_seller_participant_id: null,
      p_buyer_participant_id: null,
    }
  );
  if (linkedError) throw linkedError;
  const linked = Array.isArray(linkedRows) ? linkedRows[0] : linkedRows;
  assert(await milestoneCount(linked.chain_node_id) === 12, "every linked transaction receives its own 12-stage journey");

  const second = await createWorkspace(creatorClient, `3 Separate Chain Close ${runId}`, "buyer");
  const { count: propertiesBefore, error: beforeError } = await admin
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("chain_id", first.chain_id);
  if (beforeError) throw beforeError;

  const { error: crossChainError } = await creatorClient.rpc(
    "create_linked_chain_transaction",
    {
      p_chain_id: first.chain_id,
      p_address_line1: "Must Not Persist",
      p_city: null,
      p_postcode: null,
      p_depends_on_node_id: second.chain_node_id,
      p_seller_participant_id: null,
      p_buyer_participant_id: null,
    }
  );
  assert(Boolean(crossChainError), "cross-chain transaction dependencies are rejected");

  const { count: propertiesAfter, error: afterError } = await admin
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("chain_id", first.chain_id);
  if (afterError) throw afterError;
  assert(propertiesAfter === propertiesBefore, "a rejected linked transaction leaves no orphan property");

  const { error: guestInviteError } = await buyerClient.from("invitations").insert({
    chain_id: first.chain_id,
    email: `unauthorised-${runId}@example.invalid`,
    role: "broker",
    invited_by_participant_id: accepted.participant_id,
  });
  assert(Boolean(guestInviteError), "ordinary invited guests cannot invite additional participants");

  console.log("\nStandard chain lifecycle verification completed successfully.");
} finally {
  for (const chainId of chains) {
    const { error } = await admin.from("chains").delete().eq("id", chainId);
    if (error) console.error(`Cleanup warning for chain ${chainId}: ${error.message}`);
  }
  for (const userId of users) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) console.error(`Cleanup warning for user ${userId}: ${error.message}`);
  }
}
