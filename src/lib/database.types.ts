// Hand-written types mirroring supabase/schema.sql.
// (You can later regenerate these with `supabase gen types typescript`.)

export type HealthStatus = "thriving" | "healthy" | "struggling" | "dead";

export type CareAction =
  | "watered"
  | "checked"
  | "flagged_attention"
  | "resolved_attention"
  | "status_change"
  | "note";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; created_at: string };
        Insert: { id: string; display_name: string; created_at?: string };
        Update: { id?: string; display_name?: string; created_at?: string };
        Relationships: [];
      };
      trees: {
        Row: {
          id: string;
          species: string;
          planted_on: string | null;
          planted_by_name: string;
          notes: string | null;
          latitude: number;
          longitude: number;
          health_status: HealthStatus;
          needs_attention: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          species: string;
          planted_on?: string | null;
          planted_by_name: string;
          notes?: string | null;
          latitude: number;
          longitude: number;
          health_status?: HealthStatus;
          needs_attention?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trees"]["Insert"]>;
        Relationships: [];
      };
      care_logs: {
        Row: {
          id: string;
          tree_id: string;
          user_id: string;
          author_name: string;
          action: CareAction;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tree_id: string;
          user_id: string;
          author_name: string;
          action: CareAction;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["care_logs"]["Insert"]>;
        Relationships: [];
      };
      tree_photos: {
        Row: {
          id: string;
          tree_id: string;
          user_id: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tree_id: string;
          user_id: string;
          storage_path: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tree_photos"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases used across the app.
export type Tree = Database["public"]["Tables"]["trees"]["Row"];
export type CareLog = Database["public"]["Tables"]["care_logs"]["Row"];
export type TreePhoto = Database["public"]["Tables"]["tree_photos"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
