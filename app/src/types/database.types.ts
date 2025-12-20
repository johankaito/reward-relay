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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          annual_fee: number | null
          application_link: string | null
          bank: string
          bonus_spend_currency: string | null
          bonus_spend_requirement: number | null
          bonus_spend_window_months: number | null
          created_at: string | null
          earn_rate_primary: number | null
          earn_rate_secondary: number | null
          id: string
          min_income: number | null
          name: string
          network: string | null
          notes: string | null
          points_currency: string | null
          welcome_bonus_points: number | null
        }
        Insert: {
          annual_fee?: number | null
          application_link?: string | null
          bank: string
          bonus_spend_currency?: string | null
          bonus_spend_requirement?: number | null
          bonus_spend_window_months?: number | null
          created_at?: string | null
          earn_rate_primary?: number | null
          earn_rate_secondary?: number | null
          id?: string
          min_income?: number | null
          name: string
          network?: string | null
          notes?: string | null
          points_currency?: string | null
          welcome_bonus_points?: number | null
        }
        Update: {
          annual_fee?: number | null
          application_link?: string | null
          bank?: string
          bonus_spend_currency?: string | null
          bonus_spend_requirement?: number | null
          bonus_spend_window_months?: number | null
          created_at?: string | null
          earn_rate_primary?: number | null
          earn_rate_secondary?: number | null
          id?: string
          min_income?: number | null
          name?: string
          network?: string | null
          notes?: string | null
          points_currency?: string | null
          welcome_bonus_points?: number | null
        }
        Relationships: []
      }
      spending_profiles: {
        Row: {
          created_at: string | null
          dining_pct: number | null
          groceries_pct: number | null
          id: string
          monthly_spend: number | null
          other_pct: number | null
          travel_pct: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dining_pct?: number | null
          groceries_pct?: number | null
          id?: string
          monthly_spend?: number | null
          other_pct?: number | null
          travel_pct?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dining_pct?: number | null
          groceries_pct?: number | null
          id?: string
          monthly_spend?: number | null
          other_pct?: number | null
          travel_pct?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_cards: {
        Row: {
          annual_fee: number | null
          application_date: string | null
          approval_date: string | null
          bank: string | null
          cancellation_date: string | null
          card_id: string | null
          created_at: string | null
          id: string
          name: string | null
          notes: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          annual_fee?: number | null
          application_date?: string | null
          approval_date?: string | null
          bank?: string | null
          cancellation_date?: string | null
          card_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          annual_fee?: number | null
          application_date?: string | null
          approval_date?: string | null
          bank?: string | null
          cancellation_date?: string | null
          card_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
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
