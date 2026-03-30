export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          auth0_user_sub: string
          created_at: string
          display_name: string | null
          email: string | null
          last_seen_at: string | null
        }
        Insert: {
          auth0_user_sub: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          last_seen_at?: string | null
        }
        Update: {
          auth0_user_sub?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          last_seen_at?: string | null
        }
        Relationships: []
      }
      companion_heartbeats: {
        Row: {
          auth0_user_sub: string
          companion_id: string
          last_seen_at: string
          origin_type: string
          sandboxed: boolean | null
          version: string | null
        }
        Insert: {
          auth0_user_sub: string
          companion_id: string
          last_seen_at: string
          origin_type: string
          sandboxed?: boolean | null
          version?: string | null
        }
        Update: {
          auth0_user_sub?: string
          companion_id?: string
          last_seen_at?: string
          origin_type?: string
          sandboxed?: boolean | null
          version?: string | null
        }
        Relationships: []
      }
      crossing_events: {
        Row: {
          actor_id: string | null
          actor_type: string
          auth0_user_sub: string
          created_at: string
          crossing_id: string
          details_json: Json | null
          event_type: string
          id: string
          message: string
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          auth0_user_sub: string
          created_at?: string
          crossing_id: string
          details_json?: Json | null
          event_type: string
          id?: string
          message: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          auth0_user_sub?: string
          created_at?: string
          crossing_id?: string
          details_json?: Json | null
          event_type?: string
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "crossing_events_crossing_id_fkey"
            columns: ["crossing_id"]
            isOneToOne: false
            referencedRelation: "crossings"
            referencedColumns: ["id"]
          },
        ]
      }
      crossings: {
        Row: {
          approved_at: string | null
          approved_by_sub: string | null
          approved_payload_hash: string | null
          auth0_user_sub: string
          companion_id: string | null
          created_at: string
          demo_scenario_key: string | null
          destination_channel_id: string
          destination_channel_label: string
          destination_kind: string
          execution_error_code: string | null
          execution_error_text: string | null
          id: string
          idempotency_key: string
          origin_type: string
          policy_reason_code: string | null
          policy_reason_text: string | null
          policy_result: string
          proposed_payload_hash: string
          proposed_text: string
          rationale: string | null
          read_check_status: string
          slack_message_ts: string | null
          slack_response_json: Json | null
          source_excerpt: string | null
          source_issue_number: number
          source_issue_url: string | null
          source_kind: string
          source_labels: Json | null
          source_repo_name: string
          source_repo_owner: string
          source_title: string | null
          source_verified_at: string | null
          status: string
          updated_at: string
          write_check_status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_sub?: string | null
          approved_payload_hash?: string | null
          auth0_user_sub: string
          companion_id?: string | null
          created_at?: string
          demo_scenario_key?: string | null
          destination_channel_id: string
          destination_channel_label: string
          destination_kind: string
          execution_error_code?: string | null
          execution_error_text?: string | null
          id?: string
          idempotency_key: string
          origin_type: string
          policy_reason_code?: string | null
          policy_reason_text?: string | null
          policy_result?: string
          proposed_payload_hash: string
          proposed_text: string
          rationale?: string | null
          read_check_status?: string
          slack_message_ts?: string | null
          slack_response_json?: Json | null
          source_excerpt?: string | null
          source_issue_number: number
          source_issue_url?: string | null
          source_kind: string
          source_labels?: Json | null
          source_repo_name: string
          source_repo_owner: string
          source_title?: string | null
          source_verified_at?: string | null
          status?: string
          updated_at?: string
          write_check_status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_sub?: string | null
          approved_payload_hash?: string | null
          auth0_user_sub?: string
          companion_id?: string | null
          created_at?: string
          demo_scenario_key?: string | null
          destination_channel_id?: string
          destination_channel_label?: string
          destination_kind?: string
          execution_error_code?: string | null
          execution_error_text?: string | null
          id?: string
          idempotency_key?: string
          origin_type?: string
          policy_reason_code?: string | null
          policy_reason_text?: string | null
          policy_result?: string
          proposed_payload_hash?: string
          proposed_text?: string
          rationale?: string | null
          read_check_status?: string
          slack_message_ts?: string | null
          slack_response_json?: Json | null
          source_excerpt?: string | null
          source_issue_number?: number
          source_issue_url?: string | null
          source_kind?: string
          source_labels?: Json | null
          source_repo_name?: string
          source_repo_owner?: string
          source_title?: string | null
          source_verified_at?: string | null
          status?: string
          updated_at?: string
          write_check_status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
