export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ResourceType =
  | "pdf"
  | "youtube"
  | "spotify"
  | "image"
  | "file"
  | "spreadsheet"
  | "document"
  | "other";

type UserRole = "owner" | "admin" | "patient";

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          whatsapp: string | null;
          phone: string | null;
          instagram: string | null;
          site: string | null;
          address: string | null;
          city_state: string | null;
          business_hours: string | null;
          specialty: string | null;
          domain: string | null;
          plan: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          whatsapp?: string | null;
          phone?: string | null;
          instagram?: string | null;
          site?: string | null;
          address?: string | null;
          city_state?: string | null;
          business_hours?: string | null;
          specialty?: string | null;
          domain?: string | null;
          plan?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          workspace_id: string | null;
          name: string;
          email: string;
          role: UserRole;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          workspace_id?: string | null;
          name: string;
          email: string;
          role: UserRole;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          workspace_id: string | null;
          profile_id: string | null;
          professional_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          birth_date: string | null;
          active: boolean;
          public_access_token_hash: string | null;
          public_access_token_created_at: string | null;
          public_access_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          profile_id?: string | null;
          professional_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          active?: boolean;
          public_access_token_hash?: string | null;
          public_access_token_created_at?: string | null;
          public_access_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          workspace_id: string | null;
          patient_id: string | null;
          professional_id: string | null;
          scheduled_at: string | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          patient_id?: string | null;
          professional_id?: string | null;
          scheduled_at?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      patient_notes: {
        Row: {
          id: string;
          workspace_id: string | null;
          patient_id: string | null;
          professional_id: string | null;
          title: string | null;
          content: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          patient_id?: string | null;
          professional_id?: string | null;
          title?: string | null;
          content?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["patient_notes"]["Insert"]>;
        Relationships: [];
      };
      patient_resources: {
        Row: {
          id: string;
          workspace_id: string | null;
          patient_id: string | null;
          professional_id: string | null;
          type: ResourceType;
          title: string;
          description: string | null;
          url: string | null;
          storage_path: string | null;
          filename: string | null;
          mime_type: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          patient_id?: string | null;
          professional_id?: string | null;
          type: ResourceType;
          title: string;
          description?: string | null;
          url?: string | null;
          storage_path?: string | null;
          filename?: string | null;
          mime_type?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["patient_resources"]["Insert"]
        >;
        Relationships: [];
      };
      patient_access_tokens: {
        Row: {
          id: string;
          workspace_id: string;
          patient_id: string;
          token_hash: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          patient_id: string;
          token_hash: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["patient_access_tokens"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
