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
      agent_learnings: {
        Row: {
          active: boolean
          context: string | null
          created_at: string
          created_by: string | null
          feedback: string
          id: string
          kind: string
          learning: string | null
          skill: string
          topic: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          active?: boolean
          context?: string | null
          created_at?: string
          created_by?: string | null
          feedback: string
          id?: string
          kind?: string
          learning?: string | null
          skill?: string
          topic?: string | null
          updated_at?: string
          weight?: number
        }
        Update: {
          active?: boolean
          context?: string | null
          created_at?: string
          created_by?: string | null
          feedback?: string
          id?: string
          kind?: string
          learning?: string | null
          skill?: string
          topic?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
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
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_reviews: {
        Row: {
          author_email: string | null
          author_location: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          photo_url: string | null
          rating: number
          status: string
          title: string | null
          verified_purchase: boolean
          video_url: string | null
        }
        Insert: {
          author_email?: string | null
          author_location?: string | null
          author_name: string
          body: string
          created_at?: string
          id?: string
          photo_url?: string | null
          rating: number
          status?: string
          title?: string | null
          verified_purchase?: boolean
          video_url?: string | null
        }
        Update: {
          author_email?: string | null
          author_location?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          photo_url?: string | null
          rating?: number
          status?: string
          title?: string | null
          verified_purchase?: boolean
          video_url?: string | null
        }
        Relationships: []
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
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          read: boolean
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          read?: boolean
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          read?: boolean
          subject?: string
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          amount: number
          created_at: string
          credits: number
          currency: string
          environment: string
          id: string
          price_id: string
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits: number
          currency: string
          environment?: string
          id?: string
          price_id: string
          stripe_session_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits?: number
          currency?: string
          environment?: string
          id?: string
          price_id?: string
          stripe_session_id?: string
          user_id?: string
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
      design_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_urls: Json
          metadata: Json
          role: string
          session_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_urls?: Json
          metadata?: Json
          role: string
          session_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_urls?: Json
          metadata?: Json
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "design_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      design_sessions: {
        Row: {
          active_image_url: string | null
          category: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_image_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_image_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      designer_bank_details: {
        Row: {
          bank_account_holder_name: string | null
          bank_account_number: string | null
          bank_country: string | null
          bank_details_verified: boolean | null
          bank_iban: string | null
          bank_ifsc_code: string | null
          bank_routing_number: string | null
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
          bank_routing_number?: string | null
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
          bank_routing_number?: string | null
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
          country: string | null
          created_at: string
          currency: string | null
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
          country?: string | null
          created_at?: string
          currency?: string | null
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
          country?: string | null
          created_at?: string
          currency?: string | null
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
          dimensions_verified: boolean
          id: string
          image_url: string | null
          lead_time_days: number | null
          manufacturing_method: string
          materials_description: string | null
          model_url: string | null
          name: string
          original_designer_price: number | null
          price_reduction_date: string | null
          pricing_calculated_at: string | null
          pricing_complexity: string | null
          pricing_per_cubic_foot: number | null
          pricing_reasoning: string | null
          print_file_url: string | null
          production_region: string
          rejection_reason: string | null
          shopify_product_id: string | null
          shopify_sync_error: string | null
          shopify_synced_at: string | null
          shopify_variant_id: string | null
          slant3d_filament: string
          slant3d_price_usd: number | null
          slant3d_quote_error: string | null
          slant3d_quoted_at: string | null
          slug: string | null
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
          dimensions_verified?: boolean
          id?: string
          image_url?: string | null
          lead_time_days?: number | null
          manufacturing_method?: string
          materials_description?: string | null
          model_url?: string | null
          name: string
          original_designer_price?: number | null
          price_reduction_date?: string | null
          pricing_calculated_at?: string | null
          pricing_complexity?: string | null
          pricing_per_cubic_foot?: number | null
          pricing_reasoning?: string | null
          print_file_url?: string | null
          production_region?: string
          rejection_reason?: string | null
          shopify_product_id?: string | null
          shopify_sync_error?: string | null
          shopify_synced_at?: string | null
          shopify_variant_id?: string | null
          slant3d_filament?: string
          slant3d_price_usd?: number | null
          slant3d_quote_error?: string | null
          slant3d_quoted_at?: string | null
          slug?: string | null
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
          dimensions_verified?: boolean
          id?: string
          image_url?: string | null
          lead_time_days?: number | null
          manufacturing_method?: string
          materials_description?: string | null
          model_url?: string | null
          name?: string
          original_designer_price?: number | null
          price_reduction_date?: string | null
          pricing_calculated_at?: string | null
          pricing_complexity?: string | null
          pricing_per_cubic_foot?: number | null
          pricing_reasoning?: string | null
          print_file_url?: string | null
          production_region?: string
          rejection_reason?: string | null
          shopify_product_id?: string | null
          shopify_sync_error?: string | null
          shopify_synced_at?: string | null
          shopify_variant_id?: string | null
          slant3d_filament?: string
          slant3d_price_usd?: number | null
          slant3d_quote_error?: string | null
          slant3d_quoted_at?: string | null
          slug?: string | null
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
          is_house: boolean
          name: string
          phone_number: string | null
          plan_tier: string
          portfolio_url: string | null
          profile_picture_url: string | null
          slug: string | null
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
          is_house?: boolean
          name: string
          phone_number?: string | null
          plan_tier?: string
          portfolio_url?: string | null
          profile_picture_url?: string | null
          slug?: string | null
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
          is_house?: boolean
          name?: string
          phone_number?: string | null
          plan_tier?: string
          portfolio_url?: string | null
          profile_picture_url?: string | null
          slug?: string | null
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      early_access_signups: {
        Row: {
          category: string
          created_at: string
          email: string | null
          id: string
          whatsapp: string | null
        }
        Insert: {
          category: string
          created_at?: string
          email?: string | null
          id?: string
          whatsapp?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      experiment_events: {
        Row: {
          created_at: string
          event: string
          experiment: string
          id: string
          metadata: Json
          session_id: string
          sku_slug: string | null
          variant: string
        }
        Insert: {
          created_at?: string
          event: string
          experiment: string
          id?: string
          metadata?: Json
          session_id: string
          sku_slug?: string | null
          variant: string
        }
        Update: {
          created_at?: string
          event?: string
          experiment?: string
          id?: string
          metadata?: Json
          session_id?: string
          sku_slug?: string | null
          variant?: string
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
      manufacturing_intelligence: {
        Row: {
          captured_at: string
          category: string | null
          confidence: number
          created_at: string
          creator_name: string | null
          id: string
          learning: string | null
          maker: string
          metadata: Json | null
          order_ref: string | null
          process: string
          product_id: string | null
          product_name: string
          signal: string
          source: string
          stage: string
          value: string
        }
        Insert: {
          captured_at?: string
          category?: string | null
          confidence?: number
          created_at?: string
          creator_name?: string | null
          id?: string
          learning?: string | null
          maker: string
          metadata?: Json | null
          order_ref?: string | null
          process: string
          product_id?: string | null
          product_name: string
          signal: string
          source?: string
          stage: string
          value: string
        }
        Update: {
          captured_at?: string
          category?: string | null
          confidence?: number
          created_at?: string
          creator_name?: string | null
          id?: string
          learning?: string | null
          maker?: string
          metadata?: Json | null
          order_ref?: string | null
          process?: string
          product_id?: string | null
          product_name?: string
          signal?: string
          source?: string
          stage?: string
          value?: string
        }
        Relationships: []
      }
      manufacturing_tiers: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          example_products: string | null
          id: string
          manufacturing_method: string
          max_depth_mm: number
          max_height_mm: number
          max_overhang_deg: number
          max_width_mm: number
          min_wall_mm: number
          modular_allowed: boolean
          price_max_usd: number
          price_min_usd: number
          sort_order: number
          tier_key: string
          tier_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          example_products?: string | null
          id?: string
          manufacturing_method?: string
          max_depth_mm: number
          max_height_mm: number
          max_overhang_deg?: number
          max_width_mm: number
          min_wall_mm?: number
          modular_allowed?: boolean
          price_max_usd: number
          price_min_usd: number
          sort_order?: number
          tier_key: string
          tier_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          example_products?: string | null
          id?: string
          manufacturing_method?: string
          max_depth_mm?: number
          max_height_mm?: number
          max_overhang_deg?: number
          max_width_mm?: number
          min_wall_mm?: number
          modular_allowed?: boolean
          price_max_usd?: number
          price_min_usd?: number
          sort_order?: number
          tier_key?: string
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
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
          currency: string
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
          shopify_order_id: string | null
          status: string
          subtotal: number | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cgst_amount?: number | null
          created_at?: string
          currency?: string
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
          shopify_order_id?: string | null
          status?: string
          subtotal?: number | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cgst_amount?: number | null
          created_at?: string
          currency?: string
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
          shopify_order_id?: string | null
          status?: string
          subtotal?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      originals_orders: {
        Row: {
          amount_usd: number
          carrier: string | null
          created_at: string
          customer_email: string | null
          delivered_at: string | null
          discount_usd: number
          fulfillment_error: string | null
          group_id: string | null
          id: string
          model_status: string | null
          model_task_id: string | null
          partner_cost_usd: number | null
          partner_order_id: string | null
          payment_provider: string
          personalization: Json
          preview_id: string | null
          preview_image_url: string | null
          print_file_url: string | null
          production_status: string
          promo_code: string | null
          provider_order_id: string | null
          provider_payment_id: string | null
          quantity: number
          quote_source: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_notified_at: string | null
          size_key: string
          size_label: string | null
          sku_slug: string
          status: string
          stripe_session_id: string | null
          tracking_numbers: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_usd: number
          carrier?: string | null
          created_at?: string
          customer_email?: string | null
          delivered_at?: string | null
          discount_usd?: number
          fulfillment_error?: string | null
          group_id?: string | null
          id?: string
          model_status?: string | null
          model_task_id?: string | null
          partner_cost_usd?: number | null
          partner_order_id?: string | null
          payment_provider?: string
          personalization?: Json
          preview_id?: string | null
          preview_image_url?: string | null
          print_file_url?: string | null
          production_status?: string
          promo_code?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          quantity?: number
          quote_source?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_notified_at?: string | null
          size_key: string
          size_label?: string | null
          sku_slug: string
          status?: string
          stripe_session_id?: string | null
          tracking_numbers?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_usd?: number
          carrier?: string | null
          created_at?: string
          customer_email?: string | null
          delivered_at?: string | null
          discount_usd?: number
          fulfillment_error?: string | null
          group_id?: string | null
          id?: string
          model_status?: string | null
          model_task_id?: string | null
          partner_cost_usd?: number | null
          partner_order_id?: string | null
          payment_provider?: string
          personalization?: Json
          preview_id?: string | null
          preview_image_url?: string | null
          print_file_url?: string | null
          production_status?: string
          promo_code?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          quantity?: number
          quote_source?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_notified_at?: string | null
          size_key?: string
          size_label?: string | null
          sku_slug?: string
          status?: string
          stripe_session_id?: string | null
          tracking_numbers?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "originals_orders_preview_id_fkey"
            columns: ["preview_id"]
            isOneToOne: false
            referencedRelation: "originals_previews"
            referencedColumns: ["id"]
          },
        ]
      }
      originals_previews: {
        Row: {
          created_at: string
          engineering: Json | null
          id: string
          ip_hash: string | null
          model_error: string | null
          model_status: string | null
          model_task_id: string | null
          personalization: Json
          preview_image_url: string | null
          print_file_url: string | null
          sku_slug: string
          source_image_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          engineering?: Json | null
          id?: string
          ip_hash?: string | null
          model_error?: string | null
          model_status?: string | null
          model_task_id?: string | null
          personalization?: Json
          preview_image_url?: string | null
          print_file_url?: string | null
          sku_slug: string
          source_image_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          engineering?: Json | null
          id?: string
          ip_hash?: string | null
          model_error?: string | null
          model_status?: string | null
          model_task_id?: string | null
          personalization?: Json
          preview_image_url?: string | null
          print_file_url?: string | null
          sku_slug?: string
          source_image_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      originals_print_models: {
        Row: {
          active: boolean
          created_at: string
          filament: string | null
          id: string
          notes: string | null
          size_key: string
          sku_slug: string
          stl_url: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          filament?: string | null
          id?: string
          notes?: string | null
          size_key: string
          sku_slug: string
          stl_url: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          filament?: string | null
          id?: string
          notes?: string | null
          size_key?: string
          sku_slug?: string
          stl_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      originals_promo_codes: {
        Row: {
          active: boolean
          amount_off_usd: number | null
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          max_redemptions: number | null
          min_subtotal_usd: number
          percent_off: number | null
          starts_at: string | null
          times_redeemed: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_off_usd?: number | null
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          max_redemptions?: number | null
          min_subtotal_usd?: number
          percent_off?: number | null
          starts_at?: string | null
          times_redeemed?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_off_usd?: number | null
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          max_redemptions?: number | null
          min_subtotal_usd?: number
          percent_off?: number | null
          starts_at?: string | null
          times_redeemed?: number
          updated_at?: string
        }
        Relationships: []
      }
      originals_quotes: {
        Row: {
          created_at: string
          error: string | null
          feasible: boolean
          id: string
          landed_usd: number | null
          mbp_usd: number | null
          print_file_url: string
          print_usd: number | null
          retail_usd: number | null
          shipping_usd: number | null
          size_key: string
          sku_slug: string
          source: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          feasible?: boolean
          id?: string
          landed_usd?: number | null
          mbp_usd?: number | null
          print_file_url: string
          print_usd?: number | null
          retail_usd?: number | null
          shipping_usd?: number | null
          size_key: string
          sku_slug: string
          source?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          feasible?: boolean
          id?: string
          landed_usd?: number | null
          mbp_usd?: number | null
          print_file_url?: string
          print_usd?: number | null
          retail_usd?: number | null
          shipping_usd?: number | null
          size_key?: string
          sku_slug?: string
          source?: string
        }
        Relationships: []
      }
      originals_reviews: {
        Row: {
          author_location: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          photo_url: string | null
          rating: number
          sku_slug: string
          status: string
          title: string | null
          verified_purchase: boolean
        }
        Insert: {
          author_location?: string | null
          author_name: string
          body: string
          created_at?: string
          id?: string
          photo_url?: string | null
          rating: number
          sku_slug: string
          status?: string
          title?: string | null
          verified_purchase?: boolean
        }
        Update: {
          author_location?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          photo_url?: string | null
          rating?: number
          sku_slug?: string
          status?: string
          title?: string | null
          verified_purchase?: boolean
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          bank_account_holder_name: string
          bank_account_number: string
          bank_country: string | null
          bank_iban: string | null
          bank_ifsc_code: string | null
          bank_routing_number: string | null
          bank_swift_code: string | null
          created_at: string
          designer_id: string
          id: string
          payout_currency: string | null
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
          bank_country?: string | null
          bank_iban?: string | null
          bank_ifsc_code?: string | null
          bank_routing_number?: string | null
          bank_swift_code?: string | null
          created_at?: string
          designer_id: string
          id?: string
          payout_currency?: string | null
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
          bank_country?: string | null
          bank_iban?: string | null
          bank_ifsc_code?: string | null
          bank_routing_number?: string | null
          bank_swift_code?: string | null
          created_at?: string
          designer_id?: string
          id?: string
          payout_currency?: string | null
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
      product_finish_images: {
        Row: {
          created_at: string
          finish_name: string
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          finish_name: string
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          finish_name?: string
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_finish_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
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
      referrals: {
        Row: {
          activated_at: string | null
          created_at: string
          credits_awarded: number
          id: string
          referred_user_id: string
          referrer_designer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          credits_awarded?: number
          id?: string
          referred_user_id: string
          referrer_designer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          credits_awarded?: number
          id?: string
          referred_user_id?: string
          referrer_designer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      slant3d_fulfillments: {
        Row: {
          created_at: string
          designer_id: string | null
          error: string | null
          id: string
          last_synced_at: string | null
          order_id: string | null
          order_item_id: string | null
          order_number: string | null
          product_id: string | null
          quantity: number
          quoted_price_usd: number | null
          request_payload: Json | null
          response_payload: Json | null
          slant_order_id: string | null
          status: string
          tracking_numbers: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          designer_id?: string | null
          error?: string | null
          id?: string
          last_synced_at?: string | null
          order_id?: string | null
          order_item_id?: string | null
          order_number?: string | null
          product_id?: string | null
          quantity?: number
          quoted_price_usd?: number | null
          request_payload?: Json | null
          response_payload?: Json | null
          slant_order_id?: string | null
          status?: string
          tracking_numbers?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          designer_id?: string | null
          error?: string | null
          id?: string
          last_synced_at?: string | null
          order_id?: string | null
          order_item_id?: string | null
          order_number?: string | null
          product_id?: string | null
          quantity?: number
          quoted_price_usd?: number | null
          request_payload?: Json | null
          response_payload?: Json | null
          slant_order_id?: string | null
          status?: string
          tracking_numbers?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slant3d_fulfillments_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slant3d_fulfillments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slant3d_fulfillments_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slant3d_fulfillments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "designer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      social_scheduled_posts: {
        Row: {
          attempts: number
          caption: string
          created_at: string
          day_index: number
          engineering: Json | null
          engineering_status: string
          id: string
          ig_media_id: string | null
          image_prompt: string
          image_url: string | null
          is_render: boolean
          last_error: string | null
          published_at: string | null
          scheduled_at: string
          slot_type: string
          status: string
          theme: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          caption: string
          created_at?: string
          day_index?: number
          engineering?: Json | null
          engineering_status?: string
          id?: string
          ig_media_id?: string | null
          image_prompt: string
          image_url?: string | null
          is_render?: boolean
          last_error?: string | null
          published_at?: string | null
          scheduled_at: string
          slot_type?: string
          status?: string
          theme?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          caption?: string
          created_at?: string
          day_index?: number
          engineering?: Json | null
          engineering_status?: string
          id?: string
          ig_media_id?: string | null
          image_prompt?: string
          image_url?: string | null
          is_render?: boolean
          last_error?: string | null
          published_at?: string | null
          scheduled_at?: string
          slot_type?: string
          status?: string
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_scheduler_state: {
        Row: {
          id: string
          last_error: string | null
          last_run_at: string | null
          lease_until: string | null
          pause_reason: string | null
          paused: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          lease_until?: string | null
          pause_reason?: string | null
          paused?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          lease_until?: string | null
          pause_reason?: string | null
          paused?: boolean
          updated_at?: string
        }
        Relationships: []
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
          credits_refilled_at: string | null
          current_period_end: string
          current_period_start: string
          environment: string
          id: string
          listings_limit: number | null
          listings_used: number | null
          monthly_credits: number
          plan_type: string
          price_id: string | null
          razorpay_subscription_id: string | null
          status: string
          stripe_customer_id: string | null
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
          credits_refilled_at?: string | null
          current_period_end: string
          current_period_start: string
          environment?: string
          id?: string
          listings_limit?: number | null
          listings_used?: number | null
          monthly_credits?: number
          plan_type: string
          price_id?: string | null
          razorpay_subscription_id?: string | null
          status: string
          stripe_customer_id?: string | null
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
          credits_refilled_at?: string | null
          current_period_end?: string
          current_period_start?: string
          environment?: string
          id?: string
          listings_limit?: number | null
          listings_used?: number | null
          monthly_credits?: number
          plan_type?: string
          price_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          three_d_models_limit?: number | null
          three_d_models_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      user_connector_tokens: {
        Row: {
          created_at: string
          id: string
          meta_defaults: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta_defaults?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_defaults?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      admin_get_all_products: {
        Args: never
        Returns: {
          base_price: number
          category: string
          created_at: string
          description: string
          designer_email: string
          designer_id: string
          designer_name: string
          designer_phone: string
          designer_price: number
          id: string
          image_url: string
          name: string
          status: string
        }[]
      }
      admin_get_designer_contacts: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          phone_number: string
          profile_picture_url: string
          status: string
          user_id: string
        }[]
      }
      claim_social_scheduler_lease: {
        Args: { p_lease_seconds?: number }
        Returns: boolean
      }
      cleanup_old_design_sessions: { Args: never; Returns: undefined }
      create_sales_milestone_post: {
        Args: {
          p_designer_id: string
          p_milestone: number
          p_product_name?: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_designer_sales_counts: {
        Args: never
        Returns: {
          designer_id: string
          sales_count: number
        }[]
      }
      get_flywheel_stats: {
        Args: never
        Returns: {
          orders: number
          signals: number
        }[]
      }
      get_my_designer_profile: {
        Args: never
        Returns: {
          cover_image_url: string | null
          created_at: string
          design_background: string | null
          email: string
          furniture_interests: string | null
          id: string
          is_house: boolean
          name: string
          phone_number: string | null
          plan_tier: string
          portfolio_url: string | null
          profile_picture_url: string | null
          slug: string | null
          status: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "designer_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      redeem_originals_promo: { Args: { _code: string }; Returns: undefined }
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
