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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_type: string
          agent_id: string | null
          completed: boolean | null
          contact_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          metadata: Json | null
          next_action: string | null
          next_action_type: string | null
          next_date: string | null
          outcome: string | null
          source: string | null
          summary: string | null
          workspace_id: string
        }
        Insert: {
          activity_type: string
          agent_id?: string | null
          completed?: boolean | null
          contact_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          next_action?: string | null
          next_action_type?: string | null
          next_date?: string | null
          outcome?: string | null
          source?: string | null
          summary?: string | null
          workspace_id: string
        }
        Update: {
          activity_type?: string
          agent_id?: string | null
          completed?: boolean | null
          contact_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          next_action?: string | null
          next_action_type?: string | null
          next_date?: string | null
          outcome?: string | null
          source?: string | null
          summary?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          active_hours_json: Json | null
          awards: string | null
          bio_text: string | null
          cell_phone: string | null
          created_at: string
          email: string | null
          full_name: string
          headshot_url: string | null
          id: string
          languages: string[] | null
          license_number: string | null
          preferred_name: string | null
          role: string | null
          specialties: string[] | null
          title: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          active_hours_json?: Json | null
          awards?: string | null
          bio_text?: string | null
          cell_phone?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          headshot_url?: string | null
          id?: string
          languages?: string[] | null
          license_number?: string | null
          preferred_name?: string | null
          role?: string | null
          specialties?: string[] | null
          title?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          active_hours_json?: Json | null
          awards?: string | null
          bio_text?: string | null
          cell_phone?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          headshot_url?: string | null
          id?: string
          languages?: string[] | null
          license_number?: string | null
          preferred_name?: string | null
          role?: string | null
          specialties?: string[] | null
          title?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_capabilities: {
        Row: {
          capability_key: string
          category: string
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          is_custom: boolean
          is_master_kill: boolean
          is_v2: boolean
          label: string
          metadata: Json | null
          persona: string
          sort_order: number
          updated_at: string
          warns_when_off: string | null
          workspace_id: string
        }
        Insert: {
          capability_key: string
          category: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          is_custom?: boolean
          is_master_kill?: boolean
          is_v2?: boolean
          label: string
          metadata?: Json | null
          persona: string
          sort_order?: number
          updated_at?: string
          warns_when_off?: string | null
          workspace_id: string
        }
        Update: {
          capability_key?: string
          category?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          is_custom?: boolean
          is_master_kill?: boolean
          is_v2?: boolean
          label?: string
          metadata?: Json | null
          persona?: string
          sort_order?: number
          updated_at?: string
          warns_when_off?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_capabilities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_custom_rules: {
        Row: {
          body: string
          category: string
          created_at: string
          enabled: boolean
          id: string
          persona: string
          scope: string | null
          scope_value: string | null
          sort_order: number
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          enabled?: boolean
          id?: string
          persona: string
          scope?: string | null
          scope_value?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          enabled?: boolean
          id?: string
          persona?: string
          scope?: string | null
          scope_value?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_custom_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_disclosures_logged: {
        Row: {
          conversation_id: string | null
          delivered_at: string
          disclosure_text: string | null
          id: string
        }
        Insert: {
          conversation_id?: string | null
          delivered_at?: string
          disclosure_text?: string | null
          id?: string
        }
        Update: {
          conversation_id?: string | null
          delivered_at?: string
          disclosure_text?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_disclosures_logged_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "sofia_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          cost_cents: number | null
          created_at: string
          id: string
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          route: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          route?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          route?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          cancel_at: string | null
          created_at: string | null
          current_period_end: string | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          plan_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end_at: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          cancel_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end_at?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          cancel_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end_at?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_customers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_assets: {
        Row: {
          consent_for_avatar_training: boolean | null
          created_at: string
          id: string
          metadata: Json | null
          type: string
          url: string | null
          workspace_id: string
        }
        Insert: {
          consent_for_avatar_training?: boolean | null
          created_at?: string
          id?: string
          metadata?: Json | null
          type: string
          url?: string | null
          workspace_id: string
        }
        Update: {
          consent_for_avatar_training?: boolean | null
          created_at?: string
          id?: string
          metadata?: Json | null
          type?: string
          url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          accent_color: string | null
          body_font: string | null
          created_at: string
          display_font: string | null
          id: string
          ink_color: string | null
          logo_url: string | null
          photography_style: string | null
          primary_color: string | null
          prohibit_stock: boolean | null
          secondary_color: string | null
          surface_color: string | null
          tagline: string | null
          updated_at: string
          voice_preset: string | null
          wordmark_text: string | null
        }
        Insert: {
          accent_color?: string | null
          body_font?: string | null
          created_at?: string
          display_font?: string | null
          id?: string
          ink_color?: string | null
          logo_url?: string | null
          photography_style?: string | null
          primary_color?: string | null
          prohibit_stock?: boolean | null
          secondary_color?: string | null
          surface_color?: string | null
          tagline?: string | null
          updated_at?: string
          voice_preset?: string | null
          wordmark_text?: string | null
        }
        Update: {
          accent_color?: string | null
          body_font?: string | null
          created_at?: string
          display_font?: string | null
          id?: string
          ink_color?: string | null
          logo_url?: string | null
          photography_style?: string | null
          primary_color?: string | null
          prohibit_stock?: boolean | null
          secondary_color?: string | null
          surface_color?: string | null
          tagline?: string | null
          updated_at?: string
          voice_preset?: string | null
          wordmark_text?: string | null
        }
        Relationships: []
      }
      brokerage_kpi_snapshots: {
        Row: {
          active_buyers: number | null
          active_listings: number | null
          agent_id: string | null
          closed_ytd: number | null
          grid_signals_blazing: number | null
          id: string
          pipeline_total: number | null
          snapshot_date: string
          sofia_calls: number | null
          sofia_qualified: number | null
          vesper_published: number | null
          workspace_id: string
        }
        Insert: {
          active_buyers?: number | null
          active_listings?: number | null
          agent_id?: string | null
          closed_ytd?: number | null
          grid_signals_blazing?: number | null
          id?: string
          pipeline_total?: number | null
          snapshot_date: string
          sofia_calls?: number | null
          sofia_qualified?: number | null
          vesper_published?: number | null
          workspace_id: string
        }
        Update: {
          active_buyers?: number | null
          active_listings?: number | null
          agent_id?: string | null
          closed_ytd?: number | null
          grid_signals_blazing?: number | null
          id?: string
          pipeline_total?: number | null
          snapshot_date?: string
          sofia_calls?: number | null
          sofia_qualified?: number | null
          vesper_published?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokerage_kpi_snapshots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerage_kpi_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brokerages: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          license_state: string | null
          logo_url: string | null
          mls_memberships: string[] | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_state?: string | null
          logo_url?: string | null
          mls_memberships?: string[] | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_state?: string | null
          logo_url?: string | null
          mls_memberships?: string[] | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      buyers: {
        Row: {
          agent_id: string | null
          bba_signed_at: string | null
          budget_max: number | null
          budget_min: number | null
          contact_id: string
          created_at: string
          criteria_json: Json | null
          id: string
          investor_flags_json: Json | null
          preapproval_amount: number | null
          preapproval_lender: string | null
          preapproval_status: string | null
          stage: string | null
          timeline: string | null
          type: string | null
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          bba_signed_at?: string | null
          budget_max?: number | null
          budget_min?: number | null
          contact_id: string
          created_at?: string
          criteria_json?: Json | null
          id?: string
          investor_flags_json?: Json | null
          preapproval_amount?: number | null
          preapproval_lender?: string | null
          preapproval_status?: string | null
          stage?: string | null
          timeline?: string | null
          type?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          bba_signed_at?: string | null
          budget_max?: number | null
          budget_min?: number | null
          contact_id?: string
          created_at?: string
          criteria_json?: Json | null
          id?: string
          investor_flags_json?: Json | null
          preapproval_amount?: number | null
          preapproval_lender?: string | null
          preapproval_status?: string | null
          stage?: string | null
          timeline?: string | null
          type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_acknowledgments: {
        Row: {
          acknowledged_at: string
          id: string
          ip_address: string | null
          type: string
          user_agent: string | null
          user_id: string | null
          version: string | null
          workspace_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          ip_address?: string | null
          type: string
          user_agent?: string | null
          user_id?: string | null
          version?: string | null
          workspace_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          ip_address?: string | null
          type?: string
          user_agent?: string | null
          user_id?: string | null
          version?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_acknowledgments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_type: string
          contact_id: string
          evidence: Json | null
          granted_at: string
          granted_via: string | null
          id: string
          revoke_reason: string | null
          revoked_at: string | null
          scope: string
          workspace_id: string
        }
        Insert: {
          consent_type: string
          contact_id: string
          evidence?: Json | null
          granted_at?: string
          granted_via?: string | null
          id?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          scope: string
          workspace_id: string
        }
        Update: {
          consent_type?: string
          contact_id?: string
          evidence?: Json | null
          granted_at?: string
          granted_via?: string | null
          id?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          scope?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_activities: {
        Row: {
          body: string | null
          channel: string | null
          contact_id: string
          created_at: string
          direction: string | null
          duration_seconds: number | null
          external_id: string | null
          id: string
          kind: string
          logged_by: string | null
          logged_by_system: string | null
          metadata: Json | null
          occurred_at: string
          opportunity_id: string | null
          outcome: string | null
          subject: string | null
          workspace_id: string
        }
        Insert: {
          body?: string | null
          channel?: string | null
          contact_id: string
          created_at?: string
          direction?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          id?: string
          kind: string
          logged_by?: string | null
          logged_by_system?: string | null
          metadata?: Json | null
          occurred_at?: string
          opportunity_id?: string | null
          outcome?: string | null
          subject?: string | null
          workspace_id: string
        }
        Update: {
          body?: string | null
          channel?: string | null
          contact_id?: string
          created_at?: string
          direction?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          id?: string
          kind?: string
          logged_by?: string | null
          logged_by_system?: string | null
          metadata?: Json | null
          occurred_at?: string
          opportunity_id?: string | null
          outcome?: string | null
          subject?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_enrichment: {
        Row: {
          ai_brief: string | null
          ai_opening_line: string | null
          ai_signals: string[] | null
          apollo_email: string | null
          apollo_phone: string | null
          apollo_seniority: string | null
          contact_id: string
          current_company: string | null
          current_title: string | null
          fetched_at: string
          headline: string | null
          id: string
          linkedin_url: string | null
          location_text: string | null
          photo_url: string | null
          raw_apollo: Json | null
          raw_perplexity: Json | null
          raw_proxycurl: Json | null
          vendors_used: string[] | null
          workspace_id: string
        }
        Insert: {
          ai_brief?: string | null
          ai_opening_line?: string | null
          ai_signals?: string[] | null
          apollo_email?: string | null
          apollo_phone?: string | null
          apollo_seniority?: string | null
          contact_id: string
          current_company?: string | null
          current_title?: string | null
          fetched_at?: string
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location_text?: string | null
          photo_url?: string | null
          raw_apollo?: Json | null
          raw_perplexity?: Json | null
          raw_proxycurl?: Json | null
          vendors_used?: string[] | null
          workspace_id: string
        }
        Update: {
          ai_brief?: string | null
          ai_opening_line?: string | null
          ai_signals?: string[] | null
          apollo_email?: string | null
          apollo_phone?: string | null
          apollo_seniority?: string | null
          contact_id?: string
          current_company?: string | null
          current_title?: string | null
          fetched_at?: string
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location_text?: string | null
          photo_url?: string | null
          raw_apollo?: Json | null
          raw_perplexity?: Json | null
          raw_proxycurl?: Json | null
          vendors_used?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_enrichment_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_enrichment_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_enrichment_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          category: string | null
          created_at: string
          emails: string[] | null
          full_name: string | null
          id: string
          language: string | null
          last_activity_at: string | null
          last_touch_at: string | null
          lifecycle_stage: string | null
          metadata: Json | null
          notes: string | null
          phones: string[] | null
          priority: string | null
          prospect_source: string | null
          relationship_score: number | null
          source: string | null
          tags: string[] | null
          temperature: string | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          emails?: string[] | null
          full_name?: string | null
          id?: string
          language?: string | null
          last_activity_at?: string | null
          last_touch_at?: string | null
          lifecycle_stage?: string | null
          metadata?: Json | null
          notes?: string | null
          phones?: string[] | null
          priority?: string | null
          prospect_source?: string | null
          relationship_score?: number | null
          source?: string | null
          tags?: string[] | null
          temperature?: string | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          emails?: string[] | null
          full_name?: string | null
          id?: string
          language?: string | null
          last_activity_at?: string | null
          last_touch_at?: string | null
          lifecycle_stage?: string | null
          metadata?: Json | null
          notes?: string | null
          phones?: string[] | null
          priority?: string | null
          prospect_source?: string | null
          relationship_score?: number | null
          source?: string | null
          tags?: string[] | null
          temperature?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          agent_count: number | null
          brokerage: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          notes: string | null
          preferred_time: string | null
          status: string | null
        }
        Insert: {
          agent_count?: number | null
          brokerage?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          notes?: string | null
          preferred_time?: string | null
          status?: string | null
        }
        Update: {
          agent_count?: number | null
          brokerage?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          preferred_time?: string | null
          status?: string | null
        }
        Relationships: []
      }
      dmf_records: {
        Row: {
          date_of_birth: string | null
          date_of_death: string
          fetched_at: string
          full_name: string
          id: string
          source: string | null
          state_of_residence: string | null
        }
        Insert: {
          date_of_birth?: string | null
          date_of_death: string
          fetched_at?: string
          full_name: string
          id?: string
          source?: string | null
          state_of_residence?: string | null
        }
        Update: {
          date_of_birth?: string | null
          date_of_death?: string
          fetched_at?: string
          full_name?: string
          id?: string
          source?: string | null
          state_of_residence?: string | null
        }
        Relationships: []
      }
      fair_housing_lint_log: {
        Row: {
          asset_id: string | null
          created_at: string
          findings: Json | null
          flagged_terms: string[] | null
          id: string
          original_text: string | null
          passed: boolean | null
          workspace_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          findings?: Json | null
          flagged_terms?: string[] | null
          id?: string
          original_text?: string | null
          passed?: boolean | null
          workspace_id: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          findings?: Json | null
          flagged_terms?: string[] | null
          id?: string
          original_text?: string | null
          passed?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fair_housing_lint_log_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "vesper_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fair_housing_lint_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fairness_test_attributes: {
        Row: {
          id: string
          inference_confidence: number | null
          inference_method: string | null
          inferred_at: string
          inferred_familial_status: string | null
          inferred_race_ethnicity: string | null
          inferred_sex: string | null
          signal_id: string | null
        }
        Insert: {
          id?: string
          inference_confidence?: number | null
          inference_method?: string | null
          inferred_at?: string
          inferred_familial_status?: string | null
          inferred_race_ethnicity?: string | null
          inferred_sex?: string | null
          signal_id?: string | null
        }
        Update: {
          id?: string
          inference_confidence?: number | null
          inference_method?: string | null
          inferred_at?: string
          inferred_familial_status?: string | null
          inferred_race_ethnicity?: string | null
          inferred_sex?: string | null
          signal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fairness_test_attributes_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "grid_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fairness_test_attributes_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "vw_grid_actionable"
            referencedColumns: ["id"]
          },
        ]
      }
      florida_business_filings: {
        Row: {
          dissolution_date: string | null
          document_number: string
          entity_name: string
          entity_type: string | null
          fetched_at: string
          filing_date: string | null
          id: string
          officer_addresses: string[] | null
          principal_address: string | null
          registered_agent_name: string | null
          source_url: string | null
          status: string | null
        }
        Insert: {
          dissolution_date?: string | null
          document_number: string
          entity_name: string
          entity_type?: string | null
          fetched_at?: string
          filing_date?: string | null
          id?: string
          officer_addresses?: string[] | null
          principal_address?: string | null
          registered_agent_name?: string | null
          source_url?: string | null
          status?: string | null
        }
        Update: {
          dissolution_date?: string | null
          document_number?: string
          entity_name?: string
          entity_type?: string | null
          fetched_at?: string
          filing_date?: string | null
          id?: string
          officer_addresses?: string[] | null
          principal_address?: string | null
          registered_agent_name?: string | null
          source_url?: string | null
          status?: string | null
        }
        Relationships: []
      }
      florida_code_enforcement: {
        Row: {
          case_number: string
          fetched_at: string
          filing_date: string
          id: string
          jurisdiction: string
          property_address: string
          source_url: string | null
          status: string
          violation_type: string | null
        }
        Insert: {
          case_number: string
          fetched_at?: string
          filing_date: string
          id?: string
          jurisdiction: string
          property_address: string
          source_url?: string | null
          status: string
          violation_type?: string | null
        }
        Update: {
          case_number?: string
          fetched_at?: string
          filing_date?: string
          id?: string
          jurisdiction?: string
          property_address?: string
          source_url?: string | null
          status?: string
          violation_type?: string | null
        }
        Relationships: []
      }
      florida_court_filings: {
        Row: {
          case_number: string
          case_type: string
          county: string
          fetched_at: string
          filing_date: string
          id: string
          party_name: string
          property_address: string | null
          raw_payload: Json | null
          source_url: string | null
        }
        Insert: {
          case_number: string
          case_type: string
          county: string
          fetched_at?: string
          filing_date: string
          id?: string
          party_name: string
          property_address?: string | null
          raw_payload?: Json | null
          source_url?: string | null
        }
        Update: {
          case_number?: string
          case_type?: string
          county?: string
          fetched_at?: string
          filing_date?: string
          id?: string
          party_name?: string
          property_address?: string | null
          raw_payload?: Json | null
          source_url?: string | null
        }
        Relationships: []
      }
      florida_permits: {
        Row: {
          declared_value: number | null
          fetched_at: string
          id: string
          issue_date: string | null
          jurisdiction: string
          permit_class: string | null
          permit_number: string
          permit_type: string | null
          property_address: string
          source_url: string | null
          status: string | null
        }
        Insert: {
          declared_value?: number | null
          fetched_at?: string
          id?: string
          issue_date?: string | null
          jurisdiction: string
          permit_class?: string | null
          permit_number: string
          permit_type?: string | null
          property_address: string
          source_url?: string | null
          status?: string | null
        }
        Update: {
          declared_value?: number | null
          fetched_at?: string
          id?: string
          issue_date?: string | null
          jurisdiction?: string
          permit_class?: string | null
          permit_number?: string
          permit_type?: string | null
          property_address?: string
          source_url?: string | null
          status?: string | null
        }
        Relationships: []
      }
      florida_tax_records: {
        Row: {
          county: string
          current_year_tax: number | null
          delinquent_amount: number | null
          delinquent_years: number[] | null
          fetched_at: string
          folio: string
          id: string
          is_delinquent: boolean | null
          source_url: string | null
        }
        Insert: {
          county: string
          current_year_tax?: number | null
          delinquent_amount?: number | null
          delinquent_years?: number[] | null
          fetched_at?: string
          folio: string
          id?: string
          is_delinquent?: boolean | null
          source_url?: string | null
        }
        Update: {
          county?: string
          current_year_tax?: number | null
          delinquent_amount?: number | null
          delinquent_years?: number[] | null
          fetched_at?: string
          folio?: string
          id?: string
          is_delinquent?: boolean | null
          source_url?: string | null
        }
        Relationships: []
      }
      florida_voter_roll_snapshots: {
        Row: {
          active_voter_count: number | null
          county: string
          fetched_at: string
          id: string
          most_recent_registration: string | null
          residence_address: string
          snapshot_date: string
          total_voter_count: number | null
        }
        Insert: {
          active_voter_count?: number | null
          county: string
          fetched_at?: string
          id?: string
          most_recent_registration?: string | null
          residence_address: string
          snapshot_date: string
          total_voter_count?: number | null
        }
        Update: {
          active_voter_count?: number | null
          county?: string
          fetched_at?: string
          id?: string
          most_recent_registration?: string | null
          residence_address?: string
          snapshot_date?: string
          total_voter_count?: number | null
        }
        Relationships: []
      }
      grid_audit_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          input_snapshot: Json | null
          model_name: string | null
          model_version: string | null
          output_snapshot: Json | null
          property_address: string | null
          served_by: string | null
          signal_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          input_snapshot?: Json | null
          model_name?: string | null
          model_version?: string | null
          output_snapshot?: Json | null
          property_address?: string | null
          served_by?: string | null
          signal_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          input_snapshot?: Json | null
          model_name?: string | null
          model_version?: string | null
          output_snapshot?: Json | null
          property_address?: string | null
          served_by?: string | null
          signal_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grid_audit_events_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "grid_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_audit_events_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "vw_grid_actionable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_audit_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_farm_zones: {
        Row: {
          active: boolean | null
          city: string | null
          created_at: string
          id: string
          state: string | null
          weekly_lead_quota: number | null
          workspace_id: string
          zip_codes: string[]
          zone_label: string | null
        }
        Insert: {
          active?: boolean | null
          city?: string | null
          created_at?: string
          id?: string
          state?: string | null
          weekly_lead_quota?: number | null
          workspace_id: string
          zip_codes: string[]
          zone_label?: string | null
        }
        Update: {
          active?: boolean | null
          city?: string | null
          created_at?: string
          id?: string
          state?: string | null
          weekly_lead_quota?: number | null
          workspace_id?: string
          zip_codes?: string[]
          zone_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grid_farm_zones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_model_registry: {
        Row: {
          artifact_uri: string | null
          fairness_audit_json: Json | null
          framework: string | null
          id: string
          metrics_json: Json | null
          model_card_md: string | null
          model_name: string
          notes: string | null
          promoted_at: string | null
          status: string
          trained_at: string | null
          trained_by: string | null
          version: string
        }
        Insert: {
          artifact_uri?: string | null
          fairness_audit_json?: Json | null
          framework?: string | null
          id?: string
          metrics_json?: Json | null
          model_card_md?: string | null
          model_name: string
          notes?: string | null
          promoted_at?: string | null
          status?: string
          trained_at?: string | null
          trained_by?: string | null
          version: string
        }
        Update: {
          artifact_uri?: string | null
          fairness_audit_json?: Json | null
          framework?: string | null
          id?: string
          metrics_json?: Json | null
          model_card_md?: string | null
          model_name?: string
          notes?: string | null
          promoted_at?: string | null
          status?: string
          trained_at?: string | null
          trained_by?: string | null
          version?: string
        }
        Relationships: []
      }
      grid_outcomes: {
        Row: {
          created_at: string
          days_from_signal: number | null
          id: string
          notes: string | null
          outcome_date: string
          outcome_source: string
          outcome_type: string
          outcome_value_usd: number | null
          property_address: string
          signal_engine_version: string | null
          signal_hazard_90d: number | null
          signal_id: string | null
          signal_motivation_score: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          days_from_signal?: number | null
          id?: string
          notes?: string | null
          outcome_date: string
          outcome_source: string
          outcome_type: string
          outcome_value_usd?: number | null
          property_address: string
          signal_engine_version?: string | null
          signal_hazard_90d?: number | null
          signal_id?: string | null
          signal_motivation_score?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          days_from_signal?: number | null
          id?: string
          notes?: string | null
          outcome_date?: string
          outcome_source?: string
          outcome_type?: string
          outcome_value_usd?: number | null
          property_address?: string
          signal_engine_version?: string | null
          signal_hazard_90d?: number | null
          signal_id?: string | null
          signal_motivation_score?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grid_outcomes_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "grid_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_outcomes_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "vw_grid_actionable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_outcomes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_outreach_campaigns: {
        Row: {
          campaign_name: string
          channel: string
          conversions_count: number | null
          created_at: string
          id: string
          responses_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          target_grid_signal_ids: string[] | null
          vesper_asset_id: string | null
          workspace_id: string
        }
        Insert: {
          campaign_name: string
          channel: string
          conversions_count?: number | null
          created_at?: string
          id?: string
          responses_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          target_grid_signal_ids?: string[] | null
          vesper_asset_id?: string | null
          workspace_id: string
        }
        Update: {
          campaign_name?: string
          channel?: string
          conversions_count?: number | null
          created_at?: string
          id?: string
          responses_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          target_grid_signal_ids?: string[] | null
          vesper_asset_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grid_outreach_campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_signals: {
        Row: {
          apn: string | null
          assigned_to: string | null
          code_violation_at: string | null
          contact_id: string | null
          converted_at: string | null
          converted_by: string | null
          county: string | null
          data_sources: string[] | null
          detected_at: string
          distress_score: number | null
          divorce_filing_at: string | null
          dnc_checked_at: string | null
          dnc_reason: string | null
          do_not_contact: boolean | null
          effective_at: string | null
          engine_version: string | null
          equity_score: number | null
          estimated_equity: number | null
          estimated_mortgage_balance: number | null
          estimated_value: number | null
          expires_at: string | null
          has_code_violations: boolean | null
          has_hoa_delinquency: boolean | null
          hazard_180d: number | null
          hazard_365d: number | null
          hazard_90d: number | null
          hazard_90d_ci_hi: number | null
          hazard_90d_ci_lo: number | null
          id: string
          is_absentee_owner: boolean | null
          is_divorce: boolean | null
          is_pre_foreclosure: boolean | null
          is_probate: boolean | null
          is_senior_owner: boolean | null
          is_tax_delinquent: boolean | null
          is_vacant: boolean | null
          life_event_score: number | null
          long_tenure_flag: boolean | null
          market_score: number | null
          mls_last_closed_at: string | null
          mls_last_listed_at: string | null
          mls_status: string | null
          motivation_score: number | null
          neighborhood_absorption_rate: number | null
          on_dnc_registry: boolean | null
          outreach_history: Json | null
          owner_email: string | null
          owner_mailing_address: string | null
          owner_name: string | null
          owner_phone: string | null
          pre_foreclosure_at: string | null
          probate_filing_at: string | null
          property_address: string
          property_city: string | null
          property_state: string | null
          property_zip: string | null
          reasons: string[] | null
          reasons_summary: string | null
          refreshed_at: string | null
          status: string | null
          tax_delinquent_at: string | null
          tenure_score: number | null
          workspace_id: string
          years_owned: number | null
        }
        Insert: {
          apn?: string | null
          assigned_to?: string | null
          code_violation_at?: string | null
          contact_id?: string | null
          converted_at?: string | null
          converted_by?: string | null
          county?: string | null
          data_sources?: string[] | null
          detected_at?: string
          distress_score?: number | null
          divorce_filing_at?: string | null
          dnc_checked_at?: string | null
          dnc_reason?: string | null
          do_not_contact?: boolean | null
          effective_at?: string | null
          engine_version?: string | null
          equity_score?: number | null
          estimated_equity?: number | null
          estimated_mortgage_balance?: number | null
          estimated_value?: number | null
          expires_at?: string | null
          has_code_violations?: boolean | null
          has_hoa_delinquency?: boolean | null
          hazard_180d?: number | null
          hazard_365d?: number | null
          hazard_90d?: number | null
          hazard_90d_ci_hi?: number | null
          hazard_90d_ci_lo?: number | null
          id?: string
          is_absentee_owner?: boolean | null
          is_divorce?: boolean | null
          is_pre_foreclosure?: boolean | null
          is_probate?: boolean | null
          is_senior_owner?: boolean | null
          is_tax_delinquent?: boolean | null
          is_vacant?: boolean | null
          life_event_score?: number | null
          long_tenure_flag?: boolean | null
          market_score?: number | null
          mls_last_closed_at?: string | null
          mls_last_listed_at?: string | null
          mls_status?: string | null
          motivation_score?: number | null
          neighborhood_absorption_rate?: number | null
          on_dnc_registry?: boolean | null
          outreach_history?: Json | null
          owner_email?: string | null
          owner_mailing_address?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          pre_foreclosure_at?: string | null
          probate_filing_at?: string | null
          property_address: string
          property_city?: string | null
          property_state?: string | null
          property_zip?: string | null
          reasons?: string[] | null
          reasons_summary?: string | null
          refreshed_at?: string | null
          status?: string | null
          tax_delinquent_at?: string | null
          tenure_score?: number | null
          workspace_id: string
          years_owned?: number | null
        }
        Update: {
          apn?: string | null
          assigned_to?: string | null
          code_violation_at?: string | null
          contact_id?: string | null
          converted_at?: string | null
          converted_by?: string | null
          county?: string | null
          data_sources?: string[] | null
          detected_at?: string
          distress_score?: number | null
          divorce_filing_at?: string | null
          dnc_checked_at?: string | null
          dnc_reason?: string | null
          do_not_contact?: boolean | null
          effective_at?: string | null
          engine_version?: string | null
          equity_score?: number | null
          estimated_equity?: number | null
          estimated_mortgage_balance?: number | null
          estimated_value?: number | null
          expires_at?: string | null
          has_code_violations?: boolean | null
          has_hoa_delinquency?: boolean | null
          hazard_180d?: number | null
          hazard_365d?: number | null
          hazard_90d?: number | null
          hazard_90d_ci_hi?: number | null
          hazard_90d_ci_lo?: number | null
          id?: string
          is_absentee_owner?: boolean | null
          is_divorce?: boolean | null
          is_pre_foreclosure?: boolean | null
          is_probate?: boolean | null
          is_senior_owner?: boolean | null
          is_tax_delinquent?: boolean | null
          is_vacant?: boolean | null
          life_event_score?: number | null
          long_tenure_flag?: boolean | null
          market_score?: number | null
          mls_last_closed_at?: string | null
          mls_last_listed_at?: string | null
          mls_status?: string | null
          motivation_score?: number | null
          neighborhood_absorption_rate?: number | null
          on_dnc_registry?: boolean | null
          outreach_history?: Json | null
          owner_email?: string | null
          owner_mailing_address?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          pre_foreclosure_at?: string | null
          probate_filing_at?: string | null
          property_address?: string
          property_city?: string | null
          property_state?: string | null
          property_zip?: string | null
          reasons?: string[] | null
          reasons_summary?: string | null
          refreshed_at?: string | null
          status?: string | null
          tax_delinquent_at?: string | null
          tenure_score?: number | null
          workspace_id?: string
          years_owned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grid_signals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_signals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_signals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_deals: {
        Row: {
          agent_id: string | null
          cap_rate_target: number | null
          created_at: string
          deal_type: string | null
          equity_available: number | null
          financing_structure: string | null
          id: string
          investor_id: string | null
          stage: string | null
          subject_property: string | null
          underwriter_output_id: string | null
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          cap_rate_target?: number | null
          created_at?: string
          deal_type?: string | null
          equity_available?: number | null
          financing_structure?: string | null
          id?: string
          investor_id?: string | null
          stage?: string | null
          subject_property?: string | null
          underwriter_output_id?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          cap_rate_target?: number | null
          created_at?: string
          deal_type?: string | null
          equity_available?: number | null
          financing_structure?: string | null
          id?: string
          investor_id?: string | null
          stage?: string | null
          subject_property?: string | null
          underwriter_output_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_deals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_deals_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_deals_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_collections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          persona: string
          sort_order: number | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          persona: string
          sort_order?: number | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          persona?: string
          sort_order?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_collections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_entries: {
        Row: {
          body: string | null
          category: string
          collection_id: string | null
          created_at: string
          embedding: string | null
          id: string
          is_pinned: boolean
          metadata: Json | null
          persona: string
          source: string | null
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body?: string | null
          category: string
          collection_id?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          is_pinned?: boolean
          metadata?: Json | null
          persona: string
          source?: string | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: string | null
          category?: string
          collection_id?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          is_pinned?: boolean
          metadata?: Json | null
          persona?: string
          source?: string | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_entries_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "knowledge_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_files: {
        Row: {
          caption: string | null
          created_at: string
          entry_id: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          id: string
          is_approved: boolean | null
          metadata: Json | null
          mood: string | null
          persona: string
          shot_type: string | null
          storage_path: string
          tags: string[] | null
          time_of_day: string | null
          workspace_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          entry_id?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_approved?: boolean | null
          metadata?: Json | null
          mood?: string | null
          persona: string
          shot_type?: string | null
          storage_path: string
          tags?: string[] | null
          time_of_day?: string | null
          workspace_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          entry_id?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_approved?: boolean | null
          metadata?: Json | null
          mood?: string | null
          persona?: string
          shot_type?: string | null
          storage_path?: string
          tags?: string[] | null
          time_of_day?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_files_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string
          agent_id: string | null
          baths: number | null
          beds: number | null
          city: string | null
          created_at: string
          description: string | null
          expiration_date: string | null
          hoa_monthly: number | null
          id: string
          listing_date: string | null
          lot_sqft: number | null
          marketing_materials: Json | null
          microsite_slug: string | null
          mls_number: string | null
          photos: Json | null
          price: number | null
          property_type: string | null
          seller_contact_id: string | null
          showing_instructions: string | null
          sqft: number | null
          state: string | null
          status: string | null
          taxes_annual: number | null
          updated_at: string
          vesper_campaign_status: string | null
          workspace_id: string
          year_built: number | null
          zip: string | null
        }
        Insert: {
          address: string
          agent_id?: string | null
          baths?: number | null
          beds?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          expiration_date?: string | null
          hoa_monthly?: number | null
          id?: string
          listing_date?: string | null
          lot_sqft?: number | null
          marketing_materials?: Json | null
          microsite_slug?: string | null
          mls_number?: string | null
          photos?: Json | null
          price?: number | null
          property_type?: string | null
          seller_contact_id?: string | null
          showing_instructions?: string | null
          sqft?: number | null
          state?: string | null
          status?: string | null
          taxes_annual?: number | null
          updated_at?: string
          vesper_campaign_status?: string | null
          workspace_id: string
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          address?: string
          agent_id?: string | null
          baths?: number | null
          beds?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          expiration_date?: string | null
          hoa_monthly?: number | null
          id?: string
          listing_date?: string | null
          lot_sqft?: number | null
          marketing_materials?: Json | null
          microsite_slug?: string | null
          mls_number?: string | null
          photos?: Json | null
          price?: number | null
          property_type?: string | null
          seller_contact_id?: string | null
          showing_instructions?: string | null
          sqft?: number | null
          state?: string | null
          status?: string | null
          taxes_annual?: number | null
          updated_at?: string
          vesper_campaign_status?: string | null
          workspace_id?: string
          year_built?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_contact_id_fkey"
            columns: ["seller_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_contact_id_fkey"
            columns: ["seller_contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_waitlist: {
        Row: {
          brokerage: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          intent: string | null
          market: string | null
          metadata: Json | null
          source: string | null
        }
        Insert: {
          brokerage?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          intent?: string | null
          market?: string | null
          metadata?: Json | null
          source?: string | null
        }
        Update: {
          brokerage?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          intent?: string | null
          market?: string | null
          metadata?: Json | null
          source?: string | null
        }
        Relationships: []
      }
      news_alerts: {
        Row: {
          category: string
          dismissed_at: string | null
          fetched_at: string
          id: string
          metadata: Json | null
          related_contact_id: string | null
          related_listing_id: string | null
          related_market: string | null
          related_zip: string | null
          severity: string
          source_name: string | null
          source_url: string | null
          summary: string | null
          surfaced_at: string | null
          title: string
          workspace_id: string
        }
        Insert: {
          category: string
          dismissed_at?: string | null
          fetched_at?: string
          id?: string
          metadata?: Json | null
          related_contact_id?: string | null
          related_listing_id?: string | null
          related_market?: string | null
          related_zip?: string | null
          severity?: string
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          surfaced_at?: string | null
          title: string
          workspace_id: string
        }
        Update: {
          category?: string
          dismissed_at?: string | null
          fetched_at?: string
          id?: string
          metadata?: Json | null
          related_contact_id?: string | null
          related_listing_id?: string | null
          related_market?: string | null
          related_zip?: string | null
          severity?: string
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          surfaced_at?: string | null
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_alerts_related_contact_id_fkey"
            columns: ["related_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_alerts_related_contact_id_fkey"
            columns: ["related_contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_alerts_related_listing_id_fkey"
            columns: ["related_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_alerts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      news_topics: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          id: string
          last_run_at: string | null
          refresh_minutes: number | null
          topic: string
          workspace_id: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          id?: string
          last_run_at?: string | null
          refresh_minutes?: number | null
          topic: string
          workspace_id: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          id?: string
          last_run_at?: string | null
          refresh_minutes?: number | null
          topic?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_topics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          closed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          est_commission_usd: number | null
          est_value_usd: number | null
          expected_close: string | null
          id: string
          loss_reason: string | null
          name: string
          notes: string | null
          opened_at: string
          opp_number: string
          probability: number | null
          property_address: string | null
          property_zip: string | null
          side: string
          source_id: string | null
          source_kind: string | null
          stage: string
          stage_changed_at: string
          updated_at: string
          won_transaction_id: string | null
          workspace_id: string
        }
        Insert: {
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          est_commission_usd?: number | null
          est_value_usd?: number | null
          expected_close?: string | null
          id?: string
          loss_reason?: string | null
          name: string
          notes?: string | null
          opened_at?: string
          opp_number: string
          probability?: number | null
          property_address?: string | null
          property_zip?: string | null
          side: string
          source_id?: string | null
          source_kind?: string | null
          stage: string
          stage_changed_at?: string
          updated_at?: string
          won_transaction_id?: string | null
          workspace_id: string
        }
        Update: {
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          est_commission_usd?: number | null
          est_value_usd?: number | null
          expected_close?: string | null
          id?: string
          loss_reason?: string | null
          name?: string
          notes?: string | null
          opened_at?: string
          opp_number?: string
          probability?: number | null
          property_address?: string | null
          property_zip?: string | null
          side?: string
          source_id?: string | null
          source_kind?: string | null
          stage?: string
          stage_changed_at?: string
          updated_at?: string
          won_transaction_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_stage: string | null
          id: string
          notes: string | null
          opportunity_id: string
          to_stage: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: string | null
          id?: string
          notes?: string | null
          opportunity_id: string
          to_stage: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_snapshots: {
        Row: {
          active_buyers: number | null
          active_investors: number | null
          active_listings: number | null
          active_rentals: number | null
          activity_count: number | null
          cold_count: number | null
          hot_count: number | null
          id: string
          snapshot_date: string
          total_pipeline: number | null
          warm_count: number | null
          weighted_pipeline: number | null
          workspace_id: string
        }
        Insert: {
          active_buyers?: number | null
          active_investors?: number | null
          active_listings?: number | null
          active_rentals?: number | null
          activity_count?: number | null
          cold_count?: number | null
          hot_count?: number | null
          id?: string
          snapshot_date: string
          total_pipeline?: number | null
          warm_count?: number | null
          weighted_pipeline?: number | null
          workspace_id: string
        }
        Update: {
          active_buyers?: number | null
          active_investors?: number | null
          active_listings?: number | null
          active_rentals?: number | null
          activity_count?: number | null
          cold_count?: number | null
          hot_count?: number | null
          id?: string
          snapshot_date?: string
          total_pipeline?: number | null
          warm_count?: number | null
          weighted_pipeline?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean | null
          agent_seats: number | null
          annual_cents: number | null
          display_order: number | null
          features: Json | null
          id: string
          monthly_cents: number
          name: string
          stripe_price_id_month: string | null
          stripe_price_id_year: string | null
        }
        Insert: {
          active?: boolean | null
          agent_seats?: number | null
          annual_cents?: number | null
          display_order?: number | null
          features?: Json | null
          id: string
          monthly_cents: number
          name: string
          stripe_price_id_month?: string | null
          stripe_price_id_year?: string | null
        }
        Update: {
          active?: boolean | null
          agent_seats?: number | null
          annual_cents?: number | null
          display_order?: number | null
          features?: Json | null
          id?: string
          monthly_cents?: number
          name?: string
          stripe_price_id_month?: string | null
          stripe_price_id_year?: string | null
        }
        Relationships: []
      }
      playbook_runs: {
        Row: {
          completed_at: string | null
          contact_id: string
          current_step: number | null
          id: string
          paused_at: string | null
          playbook_id: string
          started_at: string
          status: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id: string
          current_step?: number | null
          id?: string
          paused_at?: string | null
          playbook_id: string
          started_at?: string
          status?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string
          current_step?: number | null
          id?: string
          paused_at?: string | null
          playbook_id?: string
          started_at?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_runs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_runs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_runs_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_step_runs: {
        Row: {
          completed_at: string | null
          contact_id: string
          created_at: string
          due_at: string
          id: string
          notes: string | null
          related_activity_id: string | null
          run_id: string
          snoozed_until: string | null
          state: string
          step_index: number
          step_json: Json
          surfaced_at: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id: string
          created_at?: string
          due_at: string
          id?: string
          notes?: string | null
          related_activity_id?: string | null
          run_id: string
          snoozed_until?: string | null
          state?: string
          step_index: number
          step_json: Json
          surfaced_at?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          due_at?: string
          id?: string
          notes?: string | null
          related_activity_id?: string | null
          run_id?: string
          snoozed_until?: string | null
          state?: string
          step_index?: number
          step_json?: Json
          surfaced_at?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_step_runs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_step_runs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_step_runs_related_activity_id_fkey"
            columns: ["related_activity_id"]
            isOneToOne: false
            referencedRelation: "contact_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_step_runs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "playbook_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_step_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          steps_json: Json
          trigger_lifecycle_stages: string[] | null
          trigger_temperatures: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          steps_json: Json
          trigger_lifecycle_stages?: string[] | null
          trigger_temperatures?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          steps_json?: Json
          trigger_lifecycle_stages?: string[] | null
          trigger_temperatures?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      preconstruction_towers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          current_inventory: Json | null
          delivery_delay_risk: string | null
          deposit_schedule: Json | null
          developer: string | null
          developer_reputation_score: number | null
          expected_delivery: string | null
          id: string
          metadata: Json | null
          name: string
          refreshed_at: string | null
          source_urls: string[] | null
          state: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          current_inventory?: Json | null
          delivery_delay_risk?: string | null
          deposit_schedule?: Json | null
          developer?: string | null
          developer_reputation_score?: number | null
          expected_delivery?: string | null
          id?: string
          metadata?: Json | null
          name: string
          refreshed_at?: string | null
          source_urls?: string[] | null
          state?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          current_inventory?: Json | null
          delivery_delay_risk?: string | null
          deposit_schedule?: Json | null
          developer?: string | null
          developer_reputation_score?: number | null
          expected_delivery?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          refreshed_at?: string | null
          source_urls?: string[] | null
          state?: string | null
        }
        Relationships: []
      }
      preconstruction_watchlist: {
        Row: {
          assigned_investor_ids: string[] | null
          notes: string | null
          tower_id: string
          workspace_id: string
        }
        Insert: {
          assigned_investor_ids?: string[] | null
          notes?: string | null
          tower_id: string
          workspace_id: string
        }
        Update: {
          assigned_investor_ids?: string[] | null
          notes?: string | null
          tower_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preconstruction_watchlist_tower_id_fkey"
            columns: ["tower_id"]
            isOneToOne: false
            referencedRelation: "preconstruction_towers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preconstruction_watchlist_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      press_inquiries: {
        Row: {
          created_at: string | null
          deadline_at: string | null
          email: string | null
          id: string
          notes: string | null
          outlet: string | null
          reporter_name: string | null
          status: string | null
          topic: string | null
        }
        Insert: {
          created_at?: string | null
          deadline_at?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          outlet?: string | null
          reporter_name?: string | null
          status?: string | null
          topic?: string | null
        }
        Update: {
          created_at?: string | null
          deadline_at?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          outlet?: string | null
          reporter_name?: string | null
          status?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      property_visual_diffs: {
        Row: {
          confidence: number | null
          current_image_date: string | null
          fetched_at: string
          id: string
          model_version: string | null
          prior_image_date: string | null
          property_address: string
          property_zip: string | null
          rating: string
          vision_notes: string | null
        }
        Insert: {
          confidence?: number | null
          current_image_date?: string | null
          fetched_at?: string
          id?: string
          model_version?: string | null
          prior_image_date?: string | null
          property_address: string
          property_zip?: string | null
          rating: string
          vision_notes?: string | null
        }
        Update: {
          confidence?: number | null
          current_image_date?: string | null
          fetched_at?: string
          id?: string
          model_version?: string | null
          prior_image_date?: string | null
          property_address?: string
          property_zip?: string | null
          rating?: string
          vision_notes?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          agent_id: string | null
          budget_per_month: number | null
          contact_id: string
          created_at: string
          id: string
          lease_term_months: number | null
          move_in_target: string | null
          occupants_json: Json | null
          pets_json: Json | null
          prequal_status: string | null
          stage: string | null
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          budget_per_month?: number | null
          contact_id: string
          created_at?: string
          id?: string
          lease_term_months?: number | null
          move_in_target?: string | null
          occupants_json?: Json | null
          pets_json?: Json | null
          prequal_status?: string | null
          stage?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          budget_per_month?: number | null
          contact_id?: string
          created_at?: string
          id?: string
          lease_term_months?: number | null
          move_in_target?: string | null
          occupants_json?: Json | null
          pets_json?: Json | null
          prequal_status?: string | null
          stage?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rentals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sofia_configs: {
        Row: {
          agent_live_hours_json: Json | null
          ai_disclosure_enabled: boolean | null
          created_at: string
          disclaimer_script: string | null
          greeting_script: string | null
          handoff_rules_json: Json | null
          hours_json: Json | null
          id: string
          languages_enabled: string[] | null
          name: string | null
          qualification_threshold: number | null
          recording_consent_enabled: boolean | null
          twilio_number: string | null
          voice_id: string | null
        }
        Insert: {
          agent_live_hours_json?: Json | null
          ai_disclosure_enabled?: boolean | null
          created_at?: string
          disclaimer_script?: string | null
          greeting_script?: string | null
          handoff_rules_json?: Json | null
          hours_json?: Json | null
          id?: string
          languages_enabled?: string[] | null
          name?: string | null
          qualification_threshold?: number | null
          recording_consent_enabled?: boolean | null
          twilio_number?: string | null
          voice_id?: string | null
        }
        Update: {
          agent_live_hours_json?: Json | null
          ai_disclosure_enabled?: boolean | null
          created_at?: string
          disclaimer_script?: string | null
          greeting_script?: string | null
          handoff_rules_json?: Json | null
          hours_json?: Json | null
          id?: string
          languages_enabled?: string[] | null
          name?: string | null
          qualification_threshold?: number | null
          recording_consent_enabled?: boolean | null
          twilio_number?: string | null
          voice_id?: string | null
        }
        Relationships: []
      }
      sofia_conversations: {
        Row: {
          caller_name: string | null
          caller_phone: string | null
          channel: string
          classification: Json | null
          consent_metadata: Json | null
          contact_id: string | null
          direction: string
          duration_seconds: number | null
          ended_at: string | null
          escalated_at: string | null
          id: string
          metadata: Json | null
          qualification_score: number | null
          recording_url: string | null
          started_at: string
          status: string | null
          transcript: Json | null
          workspace_id: string
        }
        Insert: {
          caller_name?: string | null
          caller_phone?: string | null
          channel: string
          classification?: Json | null
          consent_metadata?: Json | null
          contact_id?: string | null
          direction: string
          duration_seconds?: number | null
          ended_at?: string | null
          escalated_at?: string | null
          id?: string
          metadata?: Json | null
          qualification_score?: number | null
          recording_url?: string | null
          started_at?: string
          status?: string | null
          transcript?: Json | null
          workspace_id: string
        }
        Update: {
          caller_name?: string | null
          caller_phone?: string | null
          channel?: string
          classification?: Json | null
          consent_metadata?: Json | null
          contact_id?: string | null
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          escalated_at?: string | null
          id?: string
          metadata?: Json | null
          qualification_score?: number | null
          recording_url?: string | null
          started_at?: string
          status?: string | null
          transcript?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sofia_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sofia_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sofia_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sphere_signals: {
        Row: {
          confidence: number | null
          contact_id: string
          detected_at: string
          id: string
          resolved: boolean | null
          resolved_at: string | null
          signal_data: Json | null
          signal_type: string
          surfaced_at: string | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          contact_id: string
          detected_at?: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          signal_data?: Json | null
          signal_type: string
          surfaced_at?: string | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          contact_id?: string
          detected_at?: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          signal_data?: Json | null
          signal_type?: string
          surfaced_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sphere_signals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sphere_signals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_contacts_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sphere_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_milestones: {
        Row: {
          completed_at: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          nudges_sent: number | null
          status: string | null
          transaction_id: string
          type: string
        }
        Insert: {
          completed_at?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          nudges_sent?: number | null
          status?: string | null
          transaction_id: string
          type: string
        }
        Update: {
          completed_at?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          nudges_sent?: number | null
          status?: string | null
          transaction_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_milestones_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          actual_close: string | null
          agent_id: string | null
          buyer_id: string | null
          contract_date: string | null
          contract_price: number | null
          created_at: string
          docusign_envelope_id: string | null
          dotloop_loop_id: string | null
          expected_close: string | null
          id: string
          listing_id: string | null
          property_address: string | null
          risk_flags: Json | null
          side: string
          signing_provider: string | null
          status: string | null
          timeline_json: Json | null
          workspace_id: string
        }
        Insert: {
          actual_close?: string | null
          agent_id?: string | null
          buyer_id?: string | null
          contract_date?: string | null
          contract_price?: number | null
          created_at?: string
          docusign_envelope_id?: string | null
          dotloop_loop_id?: string | null
          expected_close?: string | null
          id?: string
          listing_id?: string | null
          property_address?: string | null
          risk_flags?: Json | null
          side: string
          signing_provider?: string | null
          status?: string | null
          timeline_json?: Json | null
          workspace_id: string
        }
        Update: {
          actual_close?: string | null
          agent_id?: string | null
          buyer_id?: string | null
          contract_date?: string | null
          contract_price?: number | null
          created_at?: string
          docusign_envelope_id?: string | null
          dotloop_loop_id?: string | null
          expected_close?: string | null
          id?: string
          listing_id?: string | null
          property_address?: string | null
          risk_flags?: Json | null
          side?: string
          signing_provider?: string | null
          status?: string | null
          timeline_json?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      underwriter_runs: {
        Row: {
          agent_id: string | null
          comp_set: Json | null
          created_at: string
          id: string
          inputs: Json | null
          mode: string
          pdf_url: string | null
          result: Json | null
          subject_address: string
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          comp_set?: Json | null
          created_at?: string
          id?: string
          inputs?: Json | null
          mode: string
          pdf_url?: string | null
          result?: Json | null
          subject_address: string
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          comp_set?: Json | null
          created_at?: string
          id?: string
          inputs?: Json | null
          mode?: string
          pdf_url?: string | null
          result?: Json | null
          subject_address?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "underwriter_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriter_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          id: string
          metadata: Json | null
          meter: string
          occurred_at: string
          quantity: number
          reported_to_stripe_at: string | null
          unit: string | null
          workspace_id: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          meter: string
          occurred_at?: string
          quantity: number
          reported_to_stripe_at?: string | null
          unit?: string | null
          workspace_id: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          meter?: string
          occurred_at?: string
          quantity?: number
          reported_to_stripe_at?: string | null
          unit?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      usps_ncoa_records: {
        Row: {
          effective_date: string | null
          fetched_at: string
          forward_type: string | null
          from_address: string
          id: string
          resident_name: string | null
          source: string | null
          to_address: string | null
          workspace_id: string | null
        }
        Insert: {
          effective_date?: string | null
          fetched_at?: string
          forward_type?: string | null
          from_address: string
          id?: string
          resident_name?: string | null
          source?: string | null
          to_address?: string | null
          workspace_id?: string | null
        }
        Update: {
          effective_date?: string | null
          fetched_at?: string
          forward_type?: string | null
          from_address?: string
          id?: string
          resident_name?: string | null
          source?: string | null
          to_address?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usps_ncoa_records_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vesper_assets: {
        Row: {
          agent_id: string | null
          approval_metadata: Json | null
          asset_type: string
          campaign_id: string | null
          channel: string | null
          content: Json | null
          created_at: string
          fair_housing_lint_findings: Json | null
          fair_housing_lint_passed: boolean | null
          id: string
          listing_id: string | null
          published_at: string | null
          scheduled_for: string | null
          status: string | null
          visual_urls: string[] | null
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          approval_metadata?: Json | null
          asset_type: string
          campaign_id?: string | null
          channel?: string | null
          content?: Json | null
          created_at?: string
          fair_housing_lint_findings?: Json | null
          fair_housing_lint_passed?: boolean | null
          id?: string
          listing_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string | null
          visual_urls?: string[] | null
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          approval_metadata?: Json | null
          asset_type?: string
          campaign_id?: string | null
          channel?: string | null
          content?: Json | null
          created_at?: string
          fair_housing_lint_findings?: Json | null
          fair_housing_lint_passed?: boolean | null
          id?: string
          listing_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string | null
          visual_urls?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vesper_assets_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vesper_assets_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vesper_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vesper_campaigns: {
        Row: {
          approved_count: number | null
          asset_count: number | null
          campaign_type: string | null
          completed_at: string | null
          created_at: string
          id: string
          listing_id: string | null
          published_count: number | null
          status: string | null
          workspace_id: string
        }
        Insert: {
          approved_count?: number | null
          asset_count?: number | null
          campaign_type?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          published_count?: number | null
          status?: string | null
          workspace_id: string
        }
        Update: {
          approved_count?: number | null
          asset_count?: number | null
          campaign_type?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          published_count?: number | null
          status?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vesper_campaigns_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vesper_campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vesper_configs: {
        Row: {
          approval_mode: string | null
          approval_window_minutes: number | null
          cadence_json: Json | null
          channel_priorities: string[] | null
          created_at: string
          fair_housing_strict: boolean | null
          id: string
          prohibit_stock: boolean | null
          voice_preset: string | null
          watermark_enabled: boolean | null
        }
        Insert: {
          approval_mode?: string | null
          approval_window_minutes?: number | null
          cadence_json?: Json | null
          channel_priorities?: string[] | null
          created_at?: string
          fair_housing_strict?: boolean | null
          id?: string
          prohibit_stock?: boolean | null
          voice_preset?: string | null
          watermark_enabled?: boolean | null
        }
        Update: {
          approval_mode?: string | null
          approval_window_minutes?: number | null
          cadence_json?: Json | null
          channel_priorities?: string[] | null
          created_at?: string
          fair_housing_strict?: boolean | null
          id?: string
          prohibit_stock?: boolean | null
          voice_preset?: string | null
          watermark_enabled?: boolean | null
        }
        Relationships: []
      }
      workspace_comms_settings: {
        Row: {
          auto_log_mode: string
          gmail_enabled: boolean | null
          linkedin_enabled: boolean | null
          sofia_enabled: boolean | null
          twilio_enabled: boolean | null
          updated_at: string
          updated_by: string | null
          vesper_enabled: boolean | null
          workspace_id: string
        }
        Insert: {
          auto_log_mode?: string
          gmail_enabled?: boolean | null
          linkedin_enabled?: boolean | null
          sofia_enabled?: boolean | null
          twilio_enabled?: boolean | null
          updated_at?: string
          updated_by?: string | null
          vesper_enabled?: boolean | null
          workspace_id: string
        }
        Update: {
          auto_log_mode?: string
          gmail_enabled?: boolean | null
          linkedin_enabled?: boolean | null
          sofia_enabled?: boolean | null
          twilio_enabled?: boolean | null
          updated_at?: string
          updated_by?: string | null
          vesper_enabled?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_comms_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_integrations: {
        Row: {
          connected_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          oauth_access_token_encrypted: string | null
          oauth_refresh_token_encrypted: string | null
          scopes: string[] | null
          service: string
          status: string | null
          workspace_id: string
        }
        Insert: {
          connected_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          oauth_access_token_encrypted?: string | null
          oauth_refresh_token_encrypted?: string | null
          scopes?: string[] | null
          service: string
          status?: string | null
          workspace_id: string
        }
        Update: {
          connected_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          oauth_access_token_encrypted?: string | null
          oauth_refresh_token_encrypted?: string | null
          scopes?: string[] | null
          service?: string
          status?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          created_at: string
          onboarded_at: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          onboarded_at?: string | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          onboarded_at?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          activated_at: string | null
          brand_kit_id: string | null
          brokerage_id: string | null
          created_at: string
          custom_domain: string | null
          id: string
          metadata: Json | null
          mls_safe_mode: boolean | null
          name: string
          owner_user_id: string | null
          plan: string | null
          slug: string
          sofia_config_id: string | null
          status: string | null
          vesper_config_id: string | null
        }
        Insert: {
          activated_at?: string | null
          brand_kit_id?: string | null
          brokerage_id?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          metadata?: Json | null
          mls_safe_mode?: boolean | null
          name: string
          owner_user_id?: string | null
          plan?: string | null
          slug: string
          sofia_config_id?: string | null
          status?: string | null
          vesper_config_id?: string | null
        }
        Update: {
          activated_at?: string | null
          brand_kit_id?: string | null
          brokerage_id?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          metadata?: Json | null
          mls_safe_mode?: boolean | null
          name?: string
          owner_user_id?: string | null
          plan?: string | null
          slug?: string
          sofia_config_id?: string | null
          status?: string | null
          vesper_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_sofia_config_id_fkey"
            columns: ["sofia_config_id"]
            isOneToOne: false
            referencedRelation: "sofia_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_vesper_config_id_fkey"
            columns: ["vesper_config_id"]
            isOneToOne: false
            referencedRelation: "vesper_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_contacts_unified: {
        Row: {
          buyer_deals: number | null
          category: string | null
          created_at: string | null
          emails: string[] | null
          full_name: string | null
          id: string | null
          language: string | null
          last_activity_at: string | null
          last_touch_at: string | null
          lifecycle_stage: string | null
          linked_grid_signals: number | null
          notes: string | null
          open_opportunities: number | null
          open_sphere_signals: number | null
          phones: string[] | null
          priority: string | null
          prospect_source: string | null
          relationship_score: number | null
          seller_listings: number | null
          source: string | null
          tags: string[] | null
          temperature: string | null
          workspace_id: string | null
        }
        Insert: {
          buyer_deals?: never
          category?: string | null
          created_at?: string | null
          emails?: string[] | null
          full_name?: string | null
          id?: string | null
          language?: string | null
          last_activity_at?: string | null
          last_touch_at?: string | null
          lifecycle_stage?: string | null
          linked_grid_signals?: never
          notes?: string | null
          open_opportunities?: never
          open_sphere_signals?: never
          phones?: string[] | null
          priority?: string | null
          prospect_source?: string | null
          relationship_score?: number | null
          seller_listings?: never
          source?: string | null
          tags?: string[] | null
          temperature?: string | null
          workspace_id?: string | null
        }
        Update: {
          buyer_deals?: never
          category?: string | null
          created_at?: string | null
          emails?: string[] | null
          full_name?: string | null
          id?: string | null
          language?: string | null
          last_activity_at?: string | null
          last_touch_at?: string | null
          lifecycle_stage?: string | null
          linked_grid_signals?: never
          notes?: string | null
          open_opportunities?: never
          open_sphere_signals?: never
          phones?: string[] | null
          priority?: string | null
          prospect_source?: string | null
          relationship_score?: number | null
          seller_listings?: never
          source?: string | null
          tags?: string[] | null
          temperature?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_grid_actionable: {
        Row: {
          apn: string | null
          assigned_to: string | null
          code_violation_at: string | null
          county: string | null
          data_sources: string[] | null
          detected_at: string | null
          distress_score: number | null
          divorce_filing_at: string | null
          dnc_checked_at: string | null
          dnc_reason: string | null
          do_not_contact: boolean | null
          effective_at: string | null
          engine_version: string | null
          equity_score: number | null
          estimated_equity: number | null
          estimated_mortgage_balance: number | null
          estimated_value: number | null
          expires_at: string | null
          has_code_violations: boolean | null
          has_hoa_delinquency: boolean | null
          hazard_180d: number | null
          hazard_365d: number | null
          hazard_90d: number | null
          hazard_90d_ci_hi: number | null
          hazard_90d_ci_lo: number | null
          id: string | null
          is_absentee_owner: boolean | null
          is_divorce: boolean | null
          is_pre_foreclosure: boolean | null
          is_probate: boolean | null
          is_senior_owner: boolean | null
          is_tax_delinquent: boolean | null
          is_vacant: boolean | null
          life_event_score: number | null
          long_tenure_flag: boolean | null
          market_score: number | null
          mls_last_closed_at: string | null
          mls_last_listed_at: string | null
          mls_status: string | null
          motivation_score: number | null
          neighborhood_absorption_rate: number | null
          on_dnc_registry: boolean | null
          outreach_history: Json | null
          owner_email: string | null
          owner_mailing_address: string | null
          owner_name: string | null
          owner_phone: string | null
          pre_foreclosure_at: string | null
          probate_filing_at: string | null
          property_address: string | null
          property_city: string | null
          property_state: string | null
          property_zip: string | null
          reasons: string[] | null
          reasons_summary: string | null
          refreshed_at: string | null
          status: string | null
          tax_delinquent_at: string | null
          tenure_score: number | null
          workspace_id: string | null
          years_owned: number | null
        }
        Insert: {
          apn?: string | null
          assigned_to?: string | null
          code_violation_at?: string | null
          county?: string | null
          data_sources?: string[] | null
          detected_at?: string | null
          distress_score?: number | null
          divorce_filing_at?: string | null
          dnc_checked_at?: string | null
          dnc_reason?: string | null
          do_not_contact?: boolean | null
          effective_at?: string | null
          engine_version?: string | null
          equity_score?: number | null
          estimated_equity?: number | null
          estimated_mortgage_balance?: number | null
          estimated_value?: number | null
          expires_at?: string | null
          has_code_violations?: boolean | null
          has_hoa_delinquency?: boolean | null
          hazard_180d?: number | null
          hazard_365d?: number | null
          hazard_90d?: number | null
          hazard_90d_ci_hi?: number | null
          hazard_90d_ci_lo?: number | null
          id?: string | null
          is_absentee_owner?: boolean | null
          is_divorce?: boolean | null
          is_pre_foreclosure?: boolean | null
          is_probate?: boolean | null
          is_senior_owner?: boolean | null
          is_tax_delinquent?: boolean | null
          is_vacant?: boolean | null
          life_event_score?: number | null
          long_tenure_flag?: boolean | null
          market_score?: number | null
          mls_last_closed_at?: string | null
          mls_last_listed_at?: string | null
          mls_status?: string | null
          motivation_score?: number | null
          neighborhood_absorption_rate?: number | null
          on_dnc_registry?: boolean | null
          outreach_history?: Json | null
          owner_email?: string | null
          owner_mailing_address?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          pre_foreclosure_at?: string | null
          probate_filing_at?: string | null
          property_address?: string | null
          property_city?: string | null
          property_state?: string | null
          property_zip?: string | null
          reasons?: string[] | null
          reasons_summary?: string | null
          refreshed_at?: string | null
          status?: string | null
          tax_delinquent_at?: string | null
          tenure_score?: number | null
          workspace_id?: string | null
          years_owned?: number | null
        }
        Update: {
          apn?: string | null
          assigned_to?: string | null
          code_violation_at?: string | null
          county?: string | null
          data_sources?: string[] | null
          detected_at?: string | null
          distress_score?: number | null
          divorce_filing_at?: string | null
          dnc_checked_at?: string | null
          dnc_reason?: string | null
          do_not_contact?: boolean | null
          effective_at?: string | null
          engine_version?: string | null
          equity_score?: number | null
          estimated_equity?: number | null
          estimated_mortgage_balance?: number | null
          estimated_value?: number | null
          expires_at?: string | null
          has_code_violations?: boolean | null
          has_hoa_delinquency?: boolean | null
          hazard_180d?: number | null
          hazard_365d?: number | null
          hazard_90d?: number | null
          hazard_90d_ci_hi?: number | null
          hazard_90d_ci_lo?: number | null
          id?: string | null
          is_absentee_owner?: boolean | null
          is_divorce?: boolean | null
          is_pre_foreclosure?: boolean | null
          is_probate?: boolean | null
          is_senior_owner?: boolean | null
          is_tax_delinquent?: boolean | null
          is_vacant?: boolean | null
          life_event_score?: number | null
          long_tenure_flag?: boolean | null
          market_score?: number | null
          mls_last_closed_at?: string | null
          mls_last_listed_at?: string | null
          mls_status?: string | null
          motivation_score?: number | null
          neighborhood_absorption_rate?: number | null
          on_dnc_registry?: boolean | null
          outreach_history?: Json | null
          owner_email?: string | null
          owner_mailing_address?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          pre_foreclosure_at?: string | null
          probate_filing_at?: string | null
          property_address?: string | null
          property_city?: string | null
          property_state?: string | null
          property_zip?: string | null
          reasons?: string[] | null
          reasons_summary?: string | null
          refreshed_at?: string | null
          status?: string | null
          tax_delinquent_at?: string | null
          tenure_score?: number | null
          workspace_id?: string | null
          years_owned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grid_signals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_prospects: {
        Row: {
          city: string | null
          contact_id: string | null
          detected_at: string | null
          expires_at: string | null
          person_name: string | null
          priority: string | null
          score: number | null
          source: string | null
          source_id: string | null
          state: string | null
          temperature: string | null
          title: string | null
          urgency_band: string | null
          why: string | null
          workspace_id: string | null
          zip: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      alevant_user_workspace_ids: { Args: never; Returns: string[] }
      seed_system_playbooks_for_workspace: {
        Args: { ws: string }
        Returns: undefined
      }
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
