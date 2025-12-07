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
      company_config: {
        Row: {
          address: string
          city: string
          created_at: string
          email: string
          gstin: string
          id: string
          legal_name: string
          logo_url: string | null
          phone: string
          pincode: string
          state: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          email: string
          gstin: string
          id?: string
          legal_name: string
          logo_url?: string | null
          phone: string
          pincode: string
          state: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          email?: string
          gstin?: string
          id?: string
          legal_name?: string
          logo_url?: string | null
          phone?: string
          pincode?: string
          state?: string
          trade_name?: string | null
          updated_at?: string
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
      currency_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          last_updated: string
          rate: number
          target_currency: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          last_updated?: string
          rate: number
          target_currency: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          last_updated?: string
          rate?: number
          target_currency?: string
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
          three_d_fee_amount: number | null
          three_d_fee_paid: boolean
          three_d_generated_at: string | null
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
          three_d_fee_amount?: number | null
          three_d_fee_paid?: boolean
          three_d_generated_at?: string | null
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
          three_d_fee_amount?: number | null
          three_d_fee_paid?: boolean
          three_d_generated_at?: string | null
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
      designer_bank_details: {
        Row: {
          bank_account_holder_name: string | null
          bank_account_number: string | null
          bank_country: string | null
          bank_details_verified: boolean | null
          bank_iban: string | null
          bank_ifsc_code: string | null
          bank_swift_code: string | null
          created_at: string
          designer_id: string
          id: string
          updated_at: string
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
          designer_id: string
          id?: string
          updated_at?: string
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
          designer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "designer_bank_details_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: true
            referencedRelation: "designer_profiles"
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
      designer_follows: {
        Row: {
          created_at: string
          designer_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          designer_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          designer_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "designer_follows_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_products: {
        Row: {
          angle_views: Json | null
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
          angle_views?: Json | null
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
          angle_views?: Json | null
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
          cover_image_url: string | null
          created_at: string
          design_background: string | null
          email: string
          furniture_interests: string | null
          id: string
          name: string
          phone_number: string | null
          portfolio_url: string | null
          profile_picture_url: string | null
          status: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          design_background?: string | null
          email: string
          furniture_interests?: string | null
          id?: string
          name: string
          phone_number?: string | null
          portfolio_url?: string | null
          profile_picture_url?: string | null
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          design_background?: string | null
          email?: string
          furniture_interests?: string | null
          id?: string
          name?: string
          phone_number?: string | null
          portfolio_url?: string | null
          profile_picture_url?: string | null
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_post_saves: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          comments_count: number
          content: string | null
          created_at: string
          designer_id: string
          id: string
          image_url: string | null
          image_urls: Json | null
          likes_count: number
          metadata: Json | null
          post_type: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          comments_count?: number
          content?: string | null
          created_at?: string
          designer_id: string
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          likes_count?: number
          metadata?: Json | null
          post_type: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          comments_count?: number
          content?: string | null
          created_at?: string
          designer_id?: string
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          likes_count?: number
          metadata?: Json | null
          post_type?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
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
          cgst_amount: number | null
          created_at: string
          customer_gstin: string | null
          customer_state: string | null
          gst_rate: number | null
          id: string
          igst_amount: number | null
          invoice_date: string | null
          invoice_number: string | null
          payment_details: Json | null
          sgst_amount: number | null
          shipping_address: Json | null
          status: string
          subtotal: number | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cgst_amount?: number | null
          created_at?: string
          customer_gstin?: string | null
          customer_state?: string | null
          gst_rate?: number | null
          id?: string
          igst_amount?: number | null
          invoice_date?: string | null
          invoice_number?: string | null
          payment_details?: Json | null
          sgst_amount?: number | null
          shipping_address?: Json | null
          status?: string
          subtotal?: number | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cgst_amount?: number | null
          created_at?: string
          customer_gstin?: string | null
          customer_state?: string | null
          gst_rate?: number | null
          id?: string
          igst_amount?: number | null
          invoice_date?: string | null
          invoice_number?: string | null
          payment_details?: Json | null
          sgst_amount?: number | null
          shipping_address?: Json | null
          status?: string
          subtotal?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          bank_account_holder_name: string
          bank_account_number: string
          bank_ifsc_code: string | null
          created_at: string
          designer_id: string
          id: string
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_holder_name: string
          bank_account_number: string
          bank_ifsc_code?: string | null
          created_at?: string
          designer_id: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_holder_name?: string
          bank_account_number?: string
          bank_ifsc_code?: string | null
          created_at?: string
          designer_id?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      subscription_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          listings_limit: number | null
          listings_used: number | null
          plan_type: string
          razorpay_subscription_id: string | null
          status: string
          stripe_subscription_id: string | null
          three_d_models_limit: number | null
          three_d_models_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          listings_limit?: number | null
          listings_used?: number | null
          plan_type: string
          razorpay_subscription_id?: string | null
          status: string
          stripe_subscription_id?: string | null
          three_d_models_limit?: number | null
          three_d_models_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          listings_limit?: number | null
          listings_used?: number | null
          plan_type?: string
          razorpay_subscription_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          three_d_models_limit?: number | null
          three_d_models_used?: number | null
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
      create_sales_milestone_post: {
        Args: {
          p_designer_id: string
          p_milestone: number
          p_product_name?: string
        }
        Returns: undefined
      }
      generate_invoice_number: { Args: never; Returns: string }
      get_public_designer_profile: {
        Args: { profile_id: string }
        Returns: {
          cover_image_url: string
          created_at: string
          design_background: string
          furniture_interests: string
          id: string
          name: string
          portfolio_url: string
          profile_picture_url: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reduce_stale_product_prices: { Args: never; Returns: undefined }
      reset_monthly_credits: { Args: never; Returns: undefined }
      reset_monthly_subscription_usage: { Args: never; Returns: undefined }
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
