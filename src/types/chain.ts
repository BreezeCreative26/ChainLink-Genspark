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
