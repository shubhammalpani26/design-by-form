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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ar_sessions: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          room_image_url: string | null
          session_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          room_image_url?: string | null
          session_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          room_image_url?: string | null
          session_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ar_sessions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart: {
        Row: {
          created_at: string
          customizations: Json | null
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customizations?: Json | null
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customizations?: Json | null
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tiers: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          max_sales: number | null
          min_sales: number
          tier_name: string
        }
        Insert: {
          commission_rate: number
          created_at?: string
          id?: string
          max_sales?: number | null
          min_sales: number
          tier_name: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          max_sales?: number | null
          min_sales?: number
          tier_name?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      design_hashes: {
        Row: {
          created_at: string
          id: string
          image_hash: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_hash: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_hash?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_hashes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      design_listings: {
        Row: {
          created_at: string
          featured_fee_amount: number | null
          featured_until: string | null
          id: string
          is_featured: boolean
          listing_fee_amount: number | null
          listing_fee_paid: boolean
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          featured_fee_amount?: number | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          listing_fee_amount?: number | null
          listing_fee_paid?: boolean
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          featured_fee_amount?: number | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          listing_fee_amount?: number | null
          listing_fee_paid?: boolean
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_earnings: {
        Row: {
          commission_amount: number
          created_at: string
          designer_id: string
          id: string
          order_id: string | null
          paid_at: string | null
          product_id: string
          royalty_amount: number
          royalty_percentage: number
          sale_amount: number
          status: string
        }
        Insert: {
          commission_amount: number
          created_at?: string
          designer_id: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          product_id: string
          royalty_amount: number
          royalty_percentage?: number
          sale_amount: number
          status?: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          designer_id?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          product_id?: string
          royalty_amount?: number
          royalty_percentage?: number
          sale_amount?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "designer_earnings_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designer_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designer_earnings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_products: {
        Row: {
          auto_pricing_enabled: boolean | null
          available_finishes: Json | null
          available_sizes: Json | null
          base_price: number
          category: string
          created_at: string
          current_discount_level: number | null
          description: string | null
          designer_id: string
          designer_price: number
          dimensions: Json | null
          id: string
          image_url: string | null
          lead_time_days: number | null
          materials_description: string | null
          model_url: string | null
          name: string
          original_designer_price: number | null
          price_reduction_date: string | null
          pricing_calculated_at: string | null
          pricing_complexity: string | null
          pricing_per_cubic_foot: number | null
          pricing_reasoning: string | null
          rejection_reason: string | null
          status: string
          total_sales: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          auto_pricing_enabled?: boolean | null
          available_finishes?: Json | null
          available_sizes?: Json | null
          base_price: number
          category: string
          created_at?: string
          current_discount_level?: number | null
          description?: string | null
          designer_id: string
          designer_price: number
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          lead_time_days?: number | null
          materials_description?: string | null
          model_url?: string | null
          name: string
          original_designer_price?: number | null
          price_reduction_date?: string | null
          pricing_calculated_at?: string | null
          pricing_complexity?: string | null
          pricing_per_cubic_foot?: number | null
          pricing_reasoning?: string | null
          rejection_reason?: string | null
          status?: string
          total_sales?: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          auto_pricing_enabled?: boolean | null
          available_finishes?: Json | null
          available_sizes?: Json | null
          base_price?: number
          category?: string
          created_at?: string
          current_discount_level?: number | null
          description?: string | null
          designer_id?: string
          designer_price?: number
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          lead_time_days?: number | null
          materials_description?: string | null
          model_url?: string | null
          name?: string
          original_designer_price?: number | null
          price_reduction_date?: string | null
          pricing_calculated_at?: string | null
          pricing_complexity?: string | null
          pricing_per_cubic_foot?: number | null
          pricing_reasoning?: string | null
          rejection_reason?: string | null
          status?: string
          total_sales?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "designer_products_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_profiles: {
        Row: {
          bank_account_holder_name: string | null
          bank_account_number: string | null
          bank_country: string | null
          bank_details_verified: boolean | null
          bank_iban: string | null
          bank_ifsc_code: string | null
          bank_swift_code: string | null
          created_at: string
          design_background: string | null
          email: string
          furniture_interests: string | null
          id: string
          name: string
          phone_number: string | null
          portfolio_url: string | null
          status: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_country?: string | null
          bank_details_verified?: boolean | null
          bank_iban?: string | null
          bank_ifsc_code?: string | null
          bank_swift_code?: string | null
          created_at?: string
          design_background?: string | null
          email: string
          furniture_interests?: string | null
          id?: string
          name: string
          phone_number?: string | null
          portfolio_url?: string | null
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_country?: string | null
          bank_details_verified?: boolean | null
          bank_iban?: string | null
          bank_ifsc_code?: string | null
          bank_swift_code?: string | null
          created_at?: string
          design_background?: string | null
          email?: string
          furniture_interests?: string | null
          id?: string
          name?: string
          phone_number?: string | null
          portfolio_url?: string | null
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          customizations: Json | null
          designer_earnings: number
          designer_id: string | null
          designer_price: number
          id: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
        }
        Insert: {
          commission_amount: number
          commission_rate: number
          created_at?: string
          customizations?: Json | null
          designer_earnings: number
          designer_id?: string | null
          designer_price: number
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          quantity: number
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          customizations?: Json | null
          designer_earnings?: number
          designer_id?: string | null
          designer_price?: number
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          payment_details: Json | null
          shipping_address: Json | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_details?: Json | null
          shipping_address?: Json | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_details?: Json | null
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          config_key: string
          config_value: Json
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_pricing_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_price: number
          old_price: number
          product_id: string
          reason: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_price: number
          old_price: number
          product_id: string
          reason: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_price?: number
          old_price?: number
          product_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_pricing_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sales: {
        Row: {
          base_price: number
          commission_amount: number
          commission_rate: number
          designer_earnings: number
          designer_id: string
          designer_markup: number
          id: string
          product_id: string
          sale_date: string
          sale_price: number
        }
        Insert: {
          base_price: number
          commission_amount: number
          commission_rate: number
          designer_earnings: number
          designer_id: string
          designer_markup: number
          id?: string
          product_id: string
          sale_date?: string
          sale_price: number
        }
        Update: {
          base_price?: number
          commission_amount?: number
          commission_rate?: number
          designer_earnings?: number
          designer_id?: string
          designer_markup?: number
          id?: string
          product_id?: string
          sale_date?: string
          sale_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_type: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_type: string
          status: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_type?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          free_credits_reset_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          free_credits_reset_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          free_credits_reset_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reduce_stale_product_prices: { Args: never; Returns: undefined }
      reset_monthly_credits: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "designer" | "customer"
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
      app_role: ["admin", "designer", "customer"],
    },
  },
} as const
