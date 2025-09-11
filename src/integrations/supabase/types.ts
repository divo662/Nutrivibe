export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type subscription_plan = 'free' | 'pro_monthly' | 'pro_annual'
export type subscription_status = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          allergies: string[] | null
          caloric_needs: number | null
          created_at: string
          dietary_preference: string | null
          fitness_goal: string | null
          full_name: string | null
          id: string
          location: string | null
          updated_at: string
          user_id: string
          subscription_plan: subscription_plan | null
          subscription_status: subscription_status | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          trial_end: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          usage_ai_generations: number | null
          usage_ai_generations_reset_date: string | null
        }
        Insert: {
          allergies?: string[] | null
          caloric_needs?: number | null
          created_at?: string
          dietary_preference?: string | null
          fitness_goal?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          updated_at?: string
          user_id: string
          subscription_plan?: subscription_plan | null
          subscription_status?: subscription_status | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          usage_ai_generations?: number | null
          usage_ai_generations_reset_date?: string | null
        }
        Update: {
          allergies?: string[] | null
          caloric_needs?: number | null
          created_at?: string
          dietary_preference?: string | null
          fitness_goal?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          updated_at?: string
          user_id?: string
          subscription_plan?: subscription_plan | null
          subscription_status?: subscription_status | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          usage_ai_generations?: number | null
          usage_ai_generations_reset_date?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          plan: subscription_plan
          status: subscription_status
          current_period_start: string
          current_period_end: string
          trial_start: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          plan: subscription_plan
          status: subscription_status
          current_period_start: string
          current_period_end: string
          trial_start?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          stripe_customer_id?: string
          plan?: subscription_plan
          status?: subscription_status
          current_period_start?: string
          current_period_end?: string
          trial_start?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscription_usage: {
        Row: {
          id: string
          user_id: string
          date: string
          ai_generations_used: number
          ai_generations_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          ai_generations_used?: number
          ai_generations_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          ai_generations_used?: number
          ai_generations_limit?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      billing_history: {
        Row: {
          id: string
          user_id: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          amount: number
          currency: string
          status: string
          description: string | null
          billing_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          amount: number
          currency?: string
          description?: string | null
          billing_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          amount?: number
          currency?: string
          description?: string | null
          billing_reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      feature_flags: {
        Row: {
          id: string
          feature_name: string
          free_tier_enabled: boolean
          pro_tier_enabled: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feature_name: string
          free_tier_enabled?: boolean
          pro_tier_enabled?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          feature_name?: string
          free_tier_enabled?: boolean
          pro_tier_enabled?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_limits: {
        Row: {
          id: string
          plan: subscription_plan
          feature_name: string
          daily_limit: number | null
          monthly_limit: number | null
          unlimited: boolean
          created_at: string
        }
        Insert: {
          id?: string
          plan: subscription_plan
          feature_name: string
          daily_limit?: number | null
          monthly_limit?: number | null
          unlimited?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          plan?: subscription_plan
          feature_name?: string
          daily_limit?: number | null
          monthly_limit?: number | null
          unlimited?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_limits_feature_name_fkey"
            columns: ["feature_name"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["feature_name"]
          }
        ]
      }
      ,
      recipes: {
        Row: { id: string; user_id: string; title: string; description: string | null; calories: number | null; image_url: string | null; data: Json | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; title: string; description?: string | null; calories?: number | null; image_url?: string | null; data?: Json | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; title?: string; description?: string | null; calories?: number | null; image_url?: string | null; data?: Json | null; created_at?: string; updated_at?: string }
        Relationships: [ { foreignKeyName: "recipes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] } ]
      }
      ,
      meal_plans: {
        Row: { id: string; user_id: string; title: string; plan_date: string | null; summary: string | null; data: Json | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; title: string; plan_date?: string | null; summary?: string | null; data?: Json | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; title?: string; plan_date?: string | null; summary?: string | null; data?: Json | null; created_at?: string; updated_at?: string }
        Relationships: [ { foreignKeyName: "meal_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] } ]
      }
      ,
      meal_plan_items: {
        Row: { id: string; meal_plan_id: string; user_id: string; day_of_week: number | null; meal_type: string | null; recipe_id: string | null; notes: string | null; data: Json | null; created_at: string; updated_at: string }
        Insert: { id?: string; meal_plan_id: string; user_id: string; day_of_week?: number | null; meal_type?: string | null; recipe_id?: string | null; notes?: string | null; data?: Json | null; created_at?: string; updated_at?: string }
        Update: { id?: string; meal_plan_id?: string; user_id?: string; day_of_week?: number | null; meal_type?: string | null; recipe_id?: string | null; notes?: string | null; data?: Json | null; created_at?: string; updated_at?: string }
        Relationships: [ { foreignKeyName: "meal_plan_items_meal_plan_id_fkey"; columns: ["meal_plan_id"]; isOneToOne: false; referencedRelation: "meal_plans"; referencedColumns: ["id"] } ]
      }
      ,
      shopping_lists: {
        Row: { id: string; user_id: string; title: string; status: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; title?: string; status?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; title?: string; status?: string | null; created_at?: string; updated_at?: string }
        Relationships: [ { foreignKeyName: "shopping_lists_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] } ]
      }
      ,
      shopping_list_items: {
        Row: { id: string; list_id: string; user_id: string; name: string; quantity: string | null; checked: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; list_id: string; user_id: string; name: string; quantity?: string | null; checked?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; list_id?: string; user_id?: string; name?: string; quantity?: string | null; checked?: boolean; created_at?: string; updated_at?: string }
        Relationships: [ { foreignKeyName: "shopping_list_items_list_id_fkey"; columns: ["list_id"]; isOneToOne: false; referencedRelation: "shopping_lists"; referencedColumns: ["id"] } ]
      }
      ,
      tasks: {
        Row: { id: string; user_id: string; title: string; calories: number | null; ingredients_summary: string | null; time_minutes: number | null; state: 'to_do' | 'in_progress' | 'cancelled' | 'done'; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; title: string; calories?: number | null; ingredients_summary?: string | null; time_minutes?: number | null; state?: 'to_do' | 'in_progress' | 'cancelled' | 'done'; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; title?: string; calories?: number | null; ingredients_summary?: string | null; time_minutes?: number | null; state?: 'to_do' | 'in_progress' | 'cancelled' | 'done'; created_at?: string; updated_at?: string }
        Relationships: [ { foreignKeyName: "tasks_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] } ]
      }
      ,
      sticky_notes: {
        Row: { id: string; user_id: string; content: string; sort_order: number | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; content: string; sort_order?: number | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; content?: string; sort_order?: number | null; created_at?: string; updated_at?: string }
        Relationships: [ { foreignKeyName: "sticky_notes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] } ]
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
    Enums: {
      subscription_plan: ['free', 'pro_monthly', 'pro_annual'] as const,
      subscription_status: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'] as const,
    },
  },
} as const
