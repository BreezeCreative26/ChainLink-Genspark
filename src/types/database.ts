/**
 * Hand-written subset of the Supabase generated database types, covering
 * only the tables touched by application code so far.
 *
 * TODO: once a real Supabase project exists, replace this file with the
 * output of `supabase gen types typescript --local > src/types/database.ts`
 * and keep it regenerated after every migration. Hand-maintaining this is
 * an acceptable MVP shortcut, not a long-term plan — it WILL drift from
 * supabase/migrations/ if not kept in sync manually.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      organisations: {
        Row: {
          id: string;
          name: string;
          org_type: "estate_agency" | "conveyancing_firm" | "other";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organisations"]["Row"]> & {
          name: string;
          org_type: "estate_agency" | "conveyancing_firm" | "other";
        };
        Update: Partial<Database["public"]["Tables"]["organisations"]["Row"]>;
      };
      memberships: {
        Row: {
          id: string;
          organisation_id: string;
          branch_id: string | null;
          profile_id: string;
          role: "owner" | "admin" | "agent" | "conveyancer" | "staff";
          status: "active" | "invited" | "removed";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["memberships"]["Row"]> & {
          organisation_id: string;
          profile_id: string;
          role: "owner" | "admin" | "agent" | "conveyancer" | "staff";
        };
        Update: Partial<Database["public"]["Tables"]["memberships"]["Row"]>;
      };
      chains: {
        Row: {
          id: string;
          chain_ref: string;
          status: "active" | "stalled" | "completed" | "fallen_through";
          created_by_profile_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chains"]["Row"]> & {
          created_by_profile_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["chains"]["Row"]>;
      };
      properties: {
        Row: {
          id: string;
          chain_id: string;
          address_line1: string;
          address_line2: string | null;
          city: string | null;
          postcode: string | null;
          country: string;
          listing_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["properties"]["Row"]> & {
          chain_id: string;
          address_line1: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Row"]>;
      };
      chain_nodes: {
        Row: {
          id: string;
          chain_id: string;
          property_id: string;
          depends_on_node_id: string | null;
          sequence_index: number | null;
          status: "active" | "exchanged" | "completed" | "fallen_through";
          seller_participant_id: string | null;
          buyer_participant_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chain_nodes"]["Row"]> & {
          chain_id: string;
          property_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["chain_nodes"]["Row"]>;
      };
      chain_participants: {
        Row: {
          id: string;
          chain_id: string;
          profile_id: string;
          role:
            | "seller"
            | "buyer"
            | "sellers_agent"
            | "buyers_agent"
            | "sellers_conveyancer"
            | "buyers_conveyancer"
            | "broker";
          access_mode: "proxy" | "guest" | "connected";
          organisation_id: string | null;
          proxy_manager_participant_id: string | null;
          status: "active" | "removed";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chain_participants"]["Row"]> & {
          chain_id: string;
          profile_id: string;
          role: Database["public"]["Tables"]["chain_participants"]["Row"]["role"];
          access_mode: Database["public"]["Tables"]["chain_participants"]["Row"]["access_mode"];
        };
        Update: Partial<Database["public"]["Tables"]["chain_participants"]["Row"]>;
      };
      invitations: {
        Row: {
          id: string;
          chain_id: string;
          email: string;
          role: Database["public"]["Tables"]["chain_participants"]["Row"]["role"];
          invited_by_participant_id: string;
          token: string;
          status: "invited" | "viewed" | "accepted" | "linked" | "declined" | "inactive";
          expires_at: string;
          accepted_at: string | null;
          declined_at: string | null;
          viewed_at: string | null;
          matched_profile_id: string | null;
          resulting_participant_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invitations"]["Row"]> & {
          chain_id: string;
          email: string;
          role: Database["public"]["Tables"]["chain_participants"]["Row"]["role"];
          invited_by_participant_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["invitations"]["Row"]>;
      };
      activity_logs: {
        Row: {
          id: string;
          chain_id: string;
          actor_participant_id: string | null;
          on_behalf_of_participant_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          source: "manual" | "proxy" | "system";
          visibility: "shared" | "internal";
          organisation_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]> & {
          chain_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]>;
      };
      milestone_templates: {
        Row: {
          id: string;
          organisation_id: string | null;
          name: string;
          description: string | null;
          default_sequence_index: number;
          guest_confirmable: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["milestone_templates"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["milestone_templates"]["Row"]>;
      };
      milestones: {
        Row: {
          id: string;
          chain_id: string;
          chain_node_id: string | null;
          template_id: string | null;
          title: string;
          status: "pending" | "in_progress" | "completed" | "blocked";
          due_date: string | null;
          completed_at: string | null;
          visibility: "shared" | "internal";
          organisation_id: string | null;
          guest_confirmable: boolean;
          source: "manual" | "proxy" | "system";
          recorded_by_participant_id: string | null;
          on_behalf_of_participant_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["milestones"]["Row"]> & {
          chain_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["milestones"]["Row"]>;
      };
      documents: {
        Row: {
          id: string;
          chain_id: string;
          chain_node_id: string | null;
          title: string;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          visibility: "shared" | "internal";
          organisation_id: string | null;
          category:
            | "memorandum_of_sale"
            | "id_docs"
            | "sales_forms"
            | "epc"
            | "contract_pack"
            | "search_results"
            | "mortgage_offer"
            | "other"
            | null;
          uploaded_by_participant_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          chain_id: string;
          title: string;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
      };
      notes: {
        Row: {
          id: string;
          chain_id: string;
          chain_node_id: string | null;
          body: string;
          visibility: "shared" | "internal";
          organisation_id: string | null;
          source: "manual" | "proxy";
          created_by_participant_id: string | null;
          on_behalf_of_participant_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notes"]["Row"]> & {
          chain_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Row"]>;
      };
      tasks: {
        Row: {
          id: string;
          chain_id: string;
          milestone_id: string | null;
          title: string;
          description: string | null;
          assigned_to_participant_id: string | null;
          status: "open" | "in_progress" | "done";
          due_date: string | null;
          visibility: "shared" | "internal";
          organisation_id: string | null;
          source: "manual" | "proxy" | "system";
          created_by_participant_id: string | null;
          on_behalf_of_participant_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tasks"]["Row"]> & {
          chain_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          chain_id: string | null;
          title: string;
          body: string | null;
          link_path: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          profile_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
  };
}
