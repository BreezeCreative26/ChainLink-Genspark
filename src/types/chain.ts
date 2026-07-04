import type { Database } from "@/types/database";

export type ChainParticipantRole =
  Database["public"]["Tables"]["chain_participants"]["Row"]["role"];

export type AccessMode =
  Database["public"]["Tables"]["chain_participants"]["Row"]["access_mode"];

/**
 * Roles allowed to create a chain, per docs/OPERATING_MODEL.md
 * ("Who Can Create a Chain"). A subset of the full ChainParticipantRole
 * union — conveyancers and brokers join a chain, they don't originate one.
 */
export type ChainCreatorRole = "sellers_agent" | "buyer" | "seller";

export type InvitationStatus =
  Database["public"]["Tables"]["invitations"]["Row"]["status"];

/**
 * The decision an invitee makes when a matching firm membership is found.
 * 'link' connects the chain into their firm's business workspace
 * (access_mode = 'connected'); 'guest' keeps their access purely personal
 * even though a firm match exists. Never inferred automatically — see
 * docs/DECISIONS.md ("Confirmation required for professional linking").
 */
export type AcceptDecision = "link" | "guest";

export interface InvitationForDisplay {
  chainRef: string;
  propertyAddress: string | null;
  role: ChainParticipantRole;
  status: InvitationStatus;
  expiresAt: string;
  inviterName: string | null;
}

export interface AccountMatch {
  organisationId: string;
  organisationName: string;
}

export interface InitialInvitationInput {
  email: string;
  role: ChainParticipantRole;
}

export interface CreateChainInput {
  creatorRole: ChainCreatorRole;
  property: {
    addressLine1: string;
    addressLine2?: string;
    city?: string;
    postcode?: string;
    listingPrice?: number;
  };
  initialInvitations: InitialInvitationInput[];
}

export interface ChainSummary {
  id: string;
  chainRef: string;
  status: Database["public"]["Tables"]["chains"]["Row"]["status"];
  addressLine1: string | null;
  city: string | null;
  myRole: ChainParticipantRole;
  myAccessMode: AccessMode;
  createdAt: string;
}
