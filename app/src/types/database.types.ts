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
      beta_requests: {
        Row: {
          approved: boolean | null
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          message: string | null
          name: string | null
          processed: boolean | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          message?: string | null
          name?: string | null
          processed?: boolean | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          message?: string | null
          name?: string | null
          processed?: boolean | null
        }
        Relationships: []
      }
      card_history: {
        Row: {
          card_id: string | null
          changed_at: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          card_id?: string | null
          changed_at?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          card_id?: string | null
          changed_at?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
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
          is_active: boolean | null
          last_scraped_at: string | null
          min_income: number | null
          name: string
          network: string | null
          notes: string | null
          points_currency: string | null
          raw_data: Json | null
          scrape_source: string | null
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
          is_active?: boolean | null
          last_scraped_at?: string | null
          min_income?: number | null
          name: string
          network?: string | null
          notes?: string | null
          points_currency?: string | null
          raw_data?: Json | null
          scrape_source?: string | null
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
          is_active?: boolean | null
          last_scraped_at?: string | null
          min_income?: number | null
          name?: string
          network?: string | null
          notes?: string | null
          points_currency?: string | null
          raw_data?: Json | null
          scrape_source?: string | null
          welcome_bonus_points?: number | null
        }
        Relationships: []
      }
      daily_insights: {
        Row: {
          card_id: string | null
          clicked_at: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          id: string
          insight_date: string
          tip_type: string
          title: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          card_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          insight_date: string
          tip_type: string
          title: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          card_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          insight_date?: string
          tip_type?: string
          title?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_insights_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_insights_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          card_network: string | null
          click_count: number | null
          created_at: string | null
          deal_url: string
          description: string | null
          id: string
          is_active: boolean | null
          merchant: string
          source: string | null
          source_url: string | null
          specific_issuer: string | null
          title: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          view_count: number | null
        }
        Insert: {
          card_network?: string | null
          click_count?: number | null
          created_at?: string | null
          deal_url: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          merchant: string
          source?: string | null
          source_url?: string | null
          specific_issuer?: string | null
          title: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          view_count?: number | null
        }
        Update: {
          card_network?: string | null
          click_count?: number | null
          created_at?: string | null
          deal_url?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          merchant?: string
          source?: string | null
          source_url?: string | null
          specific_issuer?: string | null
          title?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      email_reminders: {
        Row: {
          created_at: string | null
          email_to: string
          id: string
          reminder_type: string
          sent_at: string | null
          user_card_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_to: string
          id?: string
          reminder_type: string
          sent_at?: string | null
          user_card_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_to?: string
          id?: string
          reminder_type?: string
          sent_at?: string | null
          user_card_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_reminders_user_card_id_fkey"
            columns: ["user_card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_logs: {
        Row: {
          cards_updated: number | null
          created_at: string | null
          error_message: string | null
          id: string
          source: string
          status: string
        }
        Insert: {
          cards_updated?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          source: string
          status: string
        }
        Update: {
          cards_updated?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          source?: string
          status?: string
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
      spending_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          transaction_date: string
          updated_at: string | null
          user_card_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_date?: string
          updated_at?: string | null
          user_card_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_date?: string
          updated_at?: string | null
          user_card_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spending_transactions_user_card_id_fkey"
            columns: ["user_card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
        ]
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
          current_spend: number | null
          id: string
          name: string | null
          notes: string | null
          spend_updated_at: string | null
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
          current_spend?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          spend_updated_at?: string | null
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
          current_spend?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          spend_updated_at?: string | null
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
      user_points: {
        Row: {
          created_at: string
          id: string
          last_updated_at: string
          qantas_ff_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated_at?: string
          qantas_ff_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_updated_at?: string
          qantas_ff_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          churning_goal: string | null
          created_at: string | null
          current_streak_days: number | null
          free_days_earned: number | null
          id: string
          last_active_date: string | null
          longest_streak_days: number | null
          onboarding_completed_at: string | null
          optimization_goal: string | null
          spending_category: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          churning_goal?: string | null
          created_at?: string | null
          current_streak_days?: number | null
          free_days_earned?: number | null
          id?: string
          last_active_date?: string | null
          longest_streak_days?: number | null
          onboarding_completed_at?: string | null
          optimization_goal?: string | null
          spending_category?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          churning_goal?: string | null
          created_at?: string | null
          current_streak_days?: number | null
          free_days_earned?: number | null
          id?: string
          last_active_date?: string | null
          longest_streak_days?: number | null
          onboarding_completed_at?: string | null
          optimization_goal?: string | null
          spending_category?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_streak: { Args: { p_user_id: string }; Returns: undefined }
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
