export type UserType = "user" | "admin" | "soignant";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          child_first_name: string | null;
          child_birth_date: string | null;
          user_type: UserType;
          target_ml_24h: number;
          timezone: string;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          child_first_name?: string | null;
          child_birth_date?: string | null;
          user_type?: UserType;
          target_ml_24h?: number;
          timezone?: string;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          child_first_name?: string | null;
          child_birth_date?: string | null;
          user_type?: UserType;
          target_ml_24h?: number;
          timezone?: string;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tirages: {
        Row: {
          id: string;
          user_id: string;
          datetime: string;
          quantity_ml: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          datetime: string;
          quantity_ml: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          datetime?: string;
          quantity_ml?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          datetime: string;
          text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          datetime: string;
          text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          datetime?: string;
          text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
