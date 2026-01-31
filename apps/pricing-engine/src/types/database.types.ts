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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_chat_messages: {
        Row: {
          ai_chat_id: string
          content: string
          created_at: string
          id: string
          organization_id: string
          user_id: string
          user_type: string
        }
        Insert: {
          ai_chat_id: string
          content: string
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
          user_type: string
        }
        Update: {
          ai_chat_id?: string
          content?: string
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_ai_chat_id_fkey"
            columns: ["ai_chat_id"]
            isOneToOne: false
            referencedRelation: "ai_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chats: {
        Row: {
          created_at: string
          id: string
          last_used_at: string
          name: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string
          name?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string
          name?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      application_signings: {
        Row: {
          created_at: string
          documenso_document_id: string
          id: number
          loan_id: string
          signer_email: string
        }
        Insert: {
          created_at?: string
          documenso_document_id: string
          id?: number
          loan_id: string
          signer_email: string
        }
        Update: {
          created_at?: string
          documenso_document_id?: string
          id?: number
          loan_id?: string
          signer_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_signings_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          application_url: string | null
          borrower_name: string | null
          created_at: string
          documenso_document_id: string | null
          entity_id: string | null
          guarantor_emails: string[] | null
          guarantor_ids: string[] | null
          guarantor_names: string[] | null
          loan_id: string
          organization_id: string
          property_city: string | null
          property_state: string | null
          property_street: string | null
          property_zip: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_url?: string | null
          borrower_name?: string | null
          created_at?: string
          documenso_document_id?: string | null
          entity_id?: string | null
          guarantor_emails?: string[] | null
          guarantor_ids?: string[] | null
          guarantor_names?: string[] | null
          loan_id: string
          organization_id: string
          property_city?: string | null
          property_state?: string | null
          property_street?: string | null
          property_zip?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_url?: string | null
          borrower_name?: string | null
          created_at?: string
          documenso_document_id?: string | null
          entity_id?: string | null
          guarantor_emails?: string[] | null
          guarantor_ids?: string[] | null
          guarantor_names?: string[] | null
          loan_id?: string
          organization_id?: string
          property_city?: string | null
          property_state?: string | null
          property_street?: string | null
          property_zip?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      applications_emails_sent: {
        Row: {
          created_at: string
          email: string
          id: number
          initial: boolean
          loan_id: string
          type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          initial?: boolean
          loan_id: string
          type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          initial?: boolean
          loan_id?: string
          type?: string
        }
        Relationships: []
      }
      borrower_entities: {
        Row: {
          borrower_id: string
          created_at: string
          entity_id: string
          guarantor: boolean | null
          id: string
          organization_id: string
          ownership_percent: number | null
          role: string | null
        }
        Insert: {
          borrower_id: string
          created_at?: string
          entity_id: string
          guarantor?: boolean | null
          id?: string
          organization_id: string
          ownership_percent?: number | null
          role?: string | null
        }
        Update: {
          borrower_id?: string
          created_at?: string
          entity_id?: string
          guarantor?: boolean | null
          id?: string
          organization_id?: string
          ownership_percent?: number | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrower_entities_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrower_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrower_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
        ]
      }
      borrowers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          alt_phone: string | null
          assigned_to: string[]
          citizenship: string | null
          city: string | null
          county: string | null
          created_at: string
          date_of_birth: string | null
          display_id: string
          email: string | null
          fico_score: number | null
          first_name: string
          fix_flips_3yrs: number | null
          green_card: boolean | null
          groundups_3yrs: number | null
          id: string
          last_name: string
          organization_id: string
          primary_phone: string | null
          real_estate_licensed: boolean | null
          rentals_owned: number | null
          ssn_encrypted: string | null
          ssn_last4: string | null
          state: string | null
          updated_at: string
          visa: boolean | null
          visa_type: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          alt_phone?: string | null
          assigned_to?: string[]
          citizenship?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_id?: string
          email?: string | null
          fico_score?: number | null
          first_name: string
          fix_flips_3yrs?: number | null
          green_card?: boolean | null
          groundups_3yrs?: number | null
          id?: string
          last_name: string
          organization_id: string
          primary_phone?: string | null
          real_estate_licensed?: boolean | null
          rentals_owned?: number | null
          ssn_encrypted?: string | null
          ssn_last4?: string | null
          state?: string | null
          updated_at?: string
          visa?: boolean | null
          visa_type?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          alt_phone?: string | null
          assigned_to?: string[]
          citizenship?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_id?: string
          email?: string | null
          fico_score?: number | null
          first_name?: string
          fix_flips_3yrs?: number | null
          green_card?: boolean | null
          groundups_3yrs?: number | null
          id?: string
          last_name?: string
          organization_id?: string
          primary_phone?: string | null
          real_estate_licensed?: boolean | null
          rentals_owned?: number | null
          ssn_encrypted?: string | null
          ssn_last4?: string | null
          state?: string | null
          updated_at?: string
          visa?: boolean | null
          visa_type?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrowers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          account_manager_ids: string[]
          clerk_invitation_id: string | null
          clerk_user_id: string | null
          company_logo_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          joined_at: string | null
          organization_id: string
          organization_member_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_manager_ids?: string[]
          clerk_invitation_id?: string | null
          clerk_user_id?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          joined_at?: string | null
          organization_id: string
          organization_member_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_manager_ids?: string[]
          clerk_invitation_id?: string | null
          clerk_user_id?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          joined_at?: string | null
          organization_id?: string
          organization_member_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokers_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokers_org_member_fk"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_report_chat_messages: {
        Row: {
          content: string
          created_at: string
          credit_report_chat_id: string
          id: string
          organization_id: string
          user_id: string
          user_type: string
        }
        Insert: {
          content: string
          created_at?: string
          credit_report_chat_id: string
          id?: string
          organization_id: string
          user_id: string
          user_type: string
        }
        Update: {
          content?: string
          created_at?: string
          credit_report_chat_id?: string
          id?: string
          organization_id?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_report_chat_messages_credit_report_chat_id_fkey"
            columns: ["credit_report_chat_id"]
            isOneToOne: false
            referencedRelation: "credit_report_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_report_chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_report_chats: {
        Row: {
          active_guarantor_id: string | null
          created_at: string
          id: string
          last_used_at: string
          name: string
          organization_id: string
          user_id: string
        }
        Insert: {
          active_guarantor_id?: string | null
          created_at?: string
          id?: string
          last_used_at?: string
          name?: string
          organization_id: string
          user_id: string
        }
        Update: {
          active_guarantor_id?: string | null
          created_at?: string
          id?: string
          last_used_at?: string
          name?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_report_chats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_report_user_chats: {
        Row: {
          chat_id: string
          created_at: string
          report_id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          report_id: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_report_user_chats_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "credit_report_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_report_user_chats_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "credit_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_report_viewers: {
        Row: {
          added_by: string | null
          created_at: string
          report_id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          report_id: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_report_viewers_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "credit_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_reports: {
        Row: {
          aggregator: string | null
          aggregator_id: string | null
          assigned_to: string[]
          borrower_id: string | null
          bucket: string
          created_at: string
          id: string
          metadata: Json
          organization_id: string | null
          status: string | null
          storage_path: string
        }
        Insert: {
          aggregator?: string | null
          aggregator_id?: string | null
          assigned_to: string[]
          borrower_id?: string | null
          bucket?: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          status?: string | null
          storage_path: string
        }
        Update: {
          aggregator?: string | null
          aggregator_id?: string | null
          assigned_to?: string[]
          borrower_id?: string | null
          bucket?: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          status?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_reports_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_broker_settings: {
        Row: {
          allow_buydown_rate: boolean
          allow_white_labeling: boolean
          allow_ysp: boolean
          broker_id: string
          created_at: string
          default: boolean | null
          id: string
          organization_id: string
          organization_member_id: string
          program_visibility: Json
          rates: Json
          updated_at: string
        }
        Insert: {
          allow_buydown_rate?: boolean
          allow_white_labeling?: boolean
          allow_ysp?: boolean
          broker_id: string
          created_at?: string
          default?: boolean | null
          id?: string
          organization_id: string
          organization_member_id: string
          program_visibility?: Json
          rates?: Json
          updated_at?: string
        }
        Update: {
          allow_buydown_rate?: boolean
          allow_white_labeling?: boolean
          allow_ysp?: boolean
          broker_id?: string
          created_at?: string
          default?: boolean | null
          id?: string
          organization_id?: string
          organization_member_id?: string
          program_visibility?: Json
          rates?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_broker_settings_broker_fk"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_broker_settings_broker_fk"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "v_brokers_with_manager_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_broker_settings_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_broker_settings_org_member_fk"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_role_types: {
        Row: {
          allows_multiple: boolean | null
          code: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: number
          is_active: boolean | null
          name: string
        }
        Insert: {
          allows_multiple?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name: string
        }
        Update: {
          allows_multiple?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      deal_roles: {
        Row: {
          contact_id: number | null
          created_at: string | null
          deal_id: string | null
          deal_role_types_id: number | null
          id: number
          notes: string | null
          users_id: number | null
        }
        Insert: {
          contact_id?: number | null
          created_at?: string | null
          deal_id?: string | null
          deal_role_types_id?: number | null
          id?: number
          notes?: string | null
          users_id?: number | null
        }
        Update: {
          contact_id?: number | null
          created_at?: string | null
          deal_id?: string | null
          deal_role_types_id?: number | null
          id?: number
          notes?: string | null
          users_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_roles_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_roles_deal_role_types_id_fkey"
            columns: ["deal_role_types_id"]
            isOneToOne: false
            referencedRelation: "deal_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_roles_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          assigned_to_user_id: Json | null
          borrower_first_name: string | null
          borrower_last_name: string | null
          created_at: string
          id: string
          inputs: Json
          loan_amount: number | null
          loan_type: string | null
          meta: Json | null
          organization_id: string
          primary_user_id: string | null
          program_id: string | null
          property_address: string | null
          rate: number | null
          selected: Json | null
          status: string | null
          transaction_type: string | null
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: Json | null
          borrower_first_name?: string | null
          borrower_last_name?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          loan_amount?: number | null
          loan_type?: string | null
          meta?: Json | null
          organization_id: string
          primary_user_id?: string | null
          program_id?: string | null
          property_address?: string | null
          rate?: number | null
          selected?: Json | null
          status?: string | null
          transaction_type?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: Json | null
          borrower_first_name?: string | null
          borrower_last_name?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          loan_amount?: number | null
          loan_type?: string | null
          meta?: Json | null
          organization_id?: string
          primary_user_id?: string | null
          program_id?: string | null
          property_address?: string | null
          rate?: number | null
          selected?: Json | null
          status?: string | null
          transaction_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      deals_clerk_orgs: {
        Row: {
          clerk_org_id: string
          deal_id: string
          id: number
        }
        Insert: {
          clerk_org_id: string
          deal_id: string
          id?: number
        }
        Update: {
          clerk_org_id?: string
          deal_id?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_clerk_orgs_clerk_org_id_fkey"
            columns: ["clerk_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_clerk_orgs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      default_broker_settings: {
        Row: {
          allow_buydown_rate: boolean
          allow_white_labeling: boolean
          allow_ysp: boolean
          created_at: string
          id: string
          organization_id: string
          organization_member_id: string
          program_visibility: Json
          rates: Json
          updated_at: string
        }
        Insert: {
          allow_buydown_rate?: boolean
          allow_white_labeling?: boolean
          allow_ysp?: boolean
          created_at?: string
          id?: string
          organization_id: string
          organization_member_id: string
          program_visibility?: Json
          rates?: Json
          updated_at?: string
        }
        Update: {
          allow_buydown_rate?: boolean
          allow_white_labeling?: boolean
          allow_ysp?: boolean
          created_at?: string
          id?: string
          organization_id?: string
          organization_member_id?: string
          program_visibility?: Json
          rates?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "default_broker_settings_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "default_broker_settings_org_member_fk"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_permissions: {
        Row: {
          can_delete: boolean
          can_insert: boolean
          can_upload: boolean
          can_view: boolean
          clerk_org_id: string
          created_at: string
          deal_role_types_id: number
          document_categories_id: number
          id: number
          updated_at: string
          updated_by_clerk_sub: string | null
          updated_by_user_id: number | null
        }
        Insert: {
          can_delete?: boolean
          can_insert?: boolean
          can_upload?: boolean
          can_view?: boolean
          clerk_org_id: string
          created_at?: string
          deal_role_types_id: number
          document_categories_id: number
          id?: number
          updated_at?: string
          updated_by_clerk_sub?: string | null
          updated_by_user_id?: number | null
        }
        Update: {
          can_delete?: boolean
          can_insert?: boolean
          can_upload?: boolean
          can_view?: boolean
          clerk_org_id?: string
          created_at?: string
          deal_role_types_id?: number
          document_categories_id?: number
          id?: number
          updated_at?: string
          updated_by_clerk_sub?: string | null
          updated_by_user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_permissions_clerk_org_id_fkey"
            columns: ["clerk_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_permissions_deal_role_types_id_fkey"
            columns: ["deal_role_types_id"]
            isOneToOne: false
            referencedRelation: "deal_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_permissions_document_categories_id_fkey"
            columns: ["document_categories_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_permissions_updated_by_user_id_fkey"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_permissions_global: {
        Row: {
          can_delete: boolean | null
          can_insert: boolean | null
          can_upload: boolean | null
          can_view: boolean | null
          created_at: string | null
          deal_role_types_id: number
          document_categories_id: number
          id: number
        }
        Insert: {
          can_delete?: boolean | null
          can_insert?: boolean | null
          can_upload?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          deal_role_types_id: number
          document_categories_id: number
          id?: number
        }
        Update: {
          can_delete?: boolean | null
          can_insert?: boolean | null
          can_upload?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          deal_role_types_id?: number
          document_categories_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_access_permissions_global_deal_role_types_id_fkey"
            columns: ["deal_role_types_id"]
            isOneToOne: false
            referencedRelation: "deal_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_permissions_global_document_categories_id_fkey"
            columns: ["document_categories_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          code: string
          created_at: string | null
          default_display_order: number | null
          description: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          is_internal_only: boolean | null
          name: string
          storage_folder: string
          uuid: string
        }
        Insert: {
          code: string
          created_at?: string | null
          default_display_order?: number | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          is_internal_only?: boolean | null
          name: string
          storage_folder: string
          uuid?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          default_display_order?: number | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          is_internal_only?: boolean | null
          name?: string
          storage_folder?: string
          uuid?: string
        }
        Relationships: []
      }
      document_categories_user_order: {
        Row: {
          clerk_user_id: string
          created_at: string | null
          display_order: number
          document_categories_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          clerk_user_id: string
          created_at?: string | null
          display_order: number
          document_categories_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          clerk_user_id?: string
          created_at?: string | null
          display_order?: number
          document_categories_id?: number
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_pref_document_categories_order_document_categories_id_fkey"
            columns: ["document_categories_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_files: {
        Row: {
          created_at: string
          document_category_id: number | null
          document_name: string | null
          document_status: Database["public"]["Enums"]["document_status"] | null
          effective_date: string | null
          expiration_date: string | null
          file_size: number | null
          file_type: string | null
          id: number
          is_required: boolean | null
          period_end: string | null
          period_start: string | null
          private_notes: string | null
          public_notes: string | null
          storage_bucket: string | null
          storage_path: string | null
          tags: string[] | null
          uploaded_at: string | null
          uploaded_by: string | null
          uuid: string
        }
        Insert: {
          created_at?: string
          document_category_id?: number | null
          document_name?: string | null
          document_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          effective_date?: string | null
          expiration_date?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: number
          is_required?: boolean | null
          period_end?: string | null
          period_start?: string | null
          private_notes?: string | null
          public_notes?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          tags?: string[] | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          uuid?: string
        }
        Update: {
          created_at?: string
          document_category_id?: number | null
          document_name?: string | null
          document_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          effective_date?: string | null
          expiration_date?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: number
          is_required?: boolean | null
          period_end?: string | null
          period_start?: string | null
          private_notes?: string | null
          public_notes?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          tags?: string[] | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_files_document_category_id_fkey"
            columns: ["document_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_files_clerk_orgs: {
        Row: {
          clerk_org_id: string
          created_at: string | null
          created_by: string | null
          document_file_id: number
          id: number
        }
        Insert: {
          clerk_org_id: string
          created_at?: string | null
          created_by?: string | null
          document_file_id: number
          id?: number
        }
        Update: {
          clerk_org_id?: string
          created_at?: string | null
          created_by?: string | null
          document_file_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_files_clerk_orgs_clerk_org_id_fkey"
            columns: ["clerk_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_clerk_orgs_document_file_id_fkey"
            columns: ["document_file_id"]
            isOneToOne: false
            referencedRelation: "document_files"
            referencedColumns: ["id"]
          },
        ]
      }
      document_files_clerk_users: {
        Row: {
          clerk_user_id: number
          created_at: string | null
          created_by: string | null
          document_file_id: number
          id: number
        }
        Insert: {
          clerk_user_id: number
          created_at?: string | null
          created_by?: string | null
          document_file_id: number
          id?: number
        }
        Update: {
          clerk_user_id?: number
          created_at?: string | null
          created_by?: string | null
          document_file_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_files_clerk_users_clerk_user_id_fkey"
            columns: ["clerk_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_clerk_users_document_file_id_fkey"
            columns: ["document_file_id"]
            isOneToOne: false
            referencedRelation: "document_files"
            referencedColumns: ["id"]
          },
        ]
      }
      document_files_entities: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_file_id: number
          entity_id: string
          id: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_file_id: number
          entity_id: string
          id?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_file_id?: number
          entity_id?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_files_entities_document_file_id_fkey"
            columns: ["document_file_id"]
            isOneToOne: false
            referencedRelation: "document_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
        ]
      }
      document_files_tags: {
        Row: {
          created_at: string | null
          created_by: number | null
          document_file_id: number
          document_tag_id: number
          id: number
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          document_file_id: number
          document_tag_id: number
          id?: number
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          document_file_id?: number
          document_tag_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_files_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_tags_document_file_id_fkey"
            columns: ["document_file_id"]
            isOneToOne: false
            referencedRelation: "document_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_tags_document_tag_id_fkey"
            columns: ["document_tag_id"]
            isOneToOne: false
            referencedRelation: "document_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      document_roles: {
        Row: {
          id: number
          role_name: string
        }
        Insert: {
          id?: number
          role_name: string
        }
        Update: {
          id?: number
          role_name?: string
        }
        Relationships: []
      }
      document_roles_files: {
        Row: {
          document_files_id: number
          document_roles_id: number
          id: number
        }
        Insert: {
          document_files_id: number
          document_roles_id: number
          id?: number
        }
        Update: {
          document_files_id?: number
          document_roles_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_roles_files_document_files_id_fkey"
            columns: ["document_files_id"]
            isOneToOne: false
            referencedRelation: "document_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_roles_files_document_roles_id_fkey"
            columns: ["document_roles_id"]
            isOneToOne: false
            referencedRelation: "document_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tags: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: number | null
          description: string | null
          id: number
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          id?: number
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          id?: number
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          craft_json: Json
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          craft_json?: Json
          id: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          craft_json?: Json
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          account_balances: string | null
          address_line1: string | null
          address_line2: string | null
          assigned_to: string[]
          bank_name: string | null
          city: string | null
          county: string | null
          created_at: string
          date_formed: string | null
          display_id: string
          ein: string | null
          entity_name: string
          entity_type: string | null
          id: string
          members: number | null
          organization_id: string
          state: string | null
          state_formed: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          account_balances?: string | null
          address_line1?: string | null
          address_line2?: string | null
          assigned_to?: string[]
          bank_name?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          date_formed?: string | null
          display_id?: string
          ein?: string | null
          entity_name: string
          entity_type?: string | null
          id?: string
          members?: number | null
          organization_id: string
          state?: string | null
          state_formed?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          account_balances?: string | null
          address_line1?: string | null
          address_line2?: string | null
          assigned_to?: string[]
          bank_name?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          date_formed?: string | null
          display_id?: string
          ein?: string | null
          entity_name?: string
          entity_type?: string | null
          id?: string
          members?: number | null
          organization_id?: string
          state?: string | null
          state_formed?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_owners: {
        Row: {
          address: string | null
          borrower_id: string | null
          created_at: string
          ein: string | null
          entity_id: string
          entity_owner_id: string | null
          id: string
          member_type: string | null
          name: string | null
          organization_id: string
          ownership_percent: number | null
          ssn_encrypted: string | null
          ssn_last4: string | null
          title: string | null
        }
        Insert: {
          address?: string | null
          borrower_id?: string | null
          created_at?: string
          ein?: string | null
          entity_id: string
          entity_owner_id?: string | null
          id?: string
          member_type?: string | null
          name?: string | null
          organization_id: string
          ownership_percent?: number | null
          ssn_encrypted?: string | null
          ssn_last4?: string | null
          title?: string | null
        }
        Update: {
          address?: string | null
          borrower_id?: string | null
          created_at?: string
          ein?: string | null
          entity_id?: string
          entity_owner_id?: string | null
          id?: string
          member_type?: string | null
          name?: string | null
          organization_id?: string
          ownership_percent?: number | null
          ssn_encrypted?: string | null
          ssn_last4?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_owners_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_owners_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_owners_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_owners_entity_owner_id_fkey"
            columns: ["entity_owner_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_owners_entity_owner_id_fkey"
            columns: ["entity_owner_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          status: boolean
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          status?: boolean
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          status?: boolean
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      integrations_clear: {
        Row: {
          integration_id: string
          password: string | null
          username: string | null
        }
        Insert: {
          integration_id: string
          password?: string | null
          username?: string | null
        }
        Update: {
          integration_id?: string
          password?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_clear_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_floify: {
        Row: {
          integration_id: string
          user_api_key: string | null
          x_api_key: string
        }
        Insert: {
          integration_id: string
          user_api_key?: string | null
          x_api_key: string
        }
        Update: {
          integration_id?: string
          user_api_key?: string | null
          x_api_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_floify_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_nadlan: {
        Row: {
          integration_id: string
          password: string | null
          username: string | null
        }
        Insert: {
          integration_id: string
          password?: string | null
          username?: string | null
        }
        Update: {
          integration_id?: string
          password?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_nadlan_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_xactus: {
        Row: {
          account_password: string
          account_user: string
          integration_id: string
        }
        Insert: {
          account_password: string
          account_user: string
          integration_id: string
        }
        Update: {
          account_password?: string
          account_user?: string
          integration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_xactus_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_scenarios: {
        Row: {
          borrower_entity_id: string | null
          created_at: string
          guarantor_borrower_ids: string[] | null
          guarantor_emails: string[] | null
          guarantor_names: string[] | null
          id: string
          inputs: Json
          loan_id: string
          name: string | null
          organization_id: string
          primary: boolean | null
          selected: Json
          user_id: string | null
        }
        Insert: {
          borrower_entity_id?: string | null
          created_at?: string
          guarantor_borrower_ids?: string[] | null
          guarantor_emails?: string[] | null
          guarantor_names?: string[] | null
          id?: string
          inputs?: Json
          loan_id: string
          name?: string | null
          organization_id?: string
          primary?: boolean | null
          selected: Json
          user_id?: string | null
        }
        Update: {
          borrower_entity_id?: string | null
          created_at?: string
          guarantor_borrower_ids?: string[] | null
          guarantor_emails?: string[] | null
          guarantor_names?: string[] | null
          id?: string
          inputs?: Json
          loan_id?: string
          name?: string | null
          organization_id?: string
          primary?: boolean | null
          selected?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_scenarios_borrower_entity_id_fkey"
            columns: ["borrower_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_scenarios_borrower_entity_id_fkey"
            columns: ["borrower_entity_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_scenarios_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_scenarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          clerk_organization_id: string | null
          created_at: string
          id: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          clerk_organization_id?: string | null
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          clerk_organization_id?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pricing_activity_log: {
        Row: {
          action: string
          activity_type: string
          assigned_to_changes: string[] | null
          created_at: string
          id: string
          inputs: Json | null
          loan_id: string
          outputs: Json | null
          scenario_id: string | null
          selected: Json | null
          term_sheet_edit_path: string | null
          term_sheet_original_path: string | null
          user_id: string
        }
        Insert: {
          action: string
          activity_type: string
          assigned_to_changes?: string[] | null
          created_at?: string
          id?: string
          inputs?: Json | null
          loan_id: string
          outputs?: Json | null
          scenario_id?: string | null
          selected?: Json | null
          term_sheet_edit_path?: string | null
          term_sheet_original_path?: string | null
          user_id: string
        }
        Update: {
          action?: string
          activity_type?: string
          assigned_to_changes?: string[] | null
          created_at?: string
          id?: string
          inputs?: Json | null
          loan_id?: string
          outputs?: Json | null
          scenario_id?: string | null
          selected?: Json | null
          term_sheet_edit_path?: string | null
          term_sheet_original_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_activity_log_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_activity_log_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "loan_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      program_documents: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          mime_type: string | null
          program_id: string
          status: string
          storage_path: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          mime_type?: string | null
          program_id: string
          status?: string
          storage_path: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          mime_type?: string | null
          program_id?: string
          status?: string
          storage_path?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_documents_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_documents_chunks_vs: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          external_name: string
          id: string
          internal_name: string
          loan_type: string
          organization_id: string
          status: string
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          external_name: string
          id?: string
          internal_name: string
          loan_type: string
          organization_id: string
          status?: string
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          external_name?: string
          id?: string
          internal_name?: string
          loan_type?: string
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rbac_permissions: {
        Row: {
          can_delete: boolean | null
          can_insert: boolean | null
          can_select: boolean | null
          can_update: boolean | null
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          priority: number | null
          resource_name: string
          resource_type: string
          role: string
          scope_filter: string | null
          scope_type: string | null
          updated_at: string | null
          uuid: string
        }
        Insert: {
          can_delete?: boolean | null
          can_insert?: boolean | null
          can_select?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          priority?: number | null
          resource_name: string
          resource_type: string
          role: string
          scope_filter?: string | null
          scope_type?: string | null
          updated_at?: string | null
          uuid?: string
        }
        Update: {
          can_delete?: boolean | null
          can_insert?: boolean | null
          can_select?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          priority?: number | null
          resource_name?: string
          resource_type?: string
          role?: string
          scope_filter?: string | null
          scope_type?: string | null
          updated_at?: string | null
          uuid?: string
        }
        Relationships: []
      }
      term_sheets: {
        Row: {
          created_at: string
          data: Json
          id: string
          loan_id: string
          pdf_url: string | null
          version: number
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          loan_id: string
          pdf_url?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          loan_id?: string
          pdf_url?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "term_sheets_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          activated_date: string | null
          avatar_url: string | null
          cell_phone: string | null
          clerk_user_id: string | null
          clerk_username: string | null
          contact_id: number | null
          create_organization_enabled: boolean | null
          created_at: string
          deactivation_date: string | null
          delete_self_enabled: boolean | null
          email: string | null
          email_verified: boolean | null
          email_verified_at: string | null
          first_name: string | null
          full_name: string | null
          has_image: boolean | null
          id: number
          image_url: string | null
          invitation_date: string | null
          is_active_yn: boolean | null
          is_banned: boolean | null
          is_internal_yn: boolean
          is_locked: boolean | null
          last_active_at: string | null
          last_name: string | null
          last_sign_in_at: string | null
          legal_accepted_at: string | null
          office_phone: string | null
          office_phone_extension: string | null
          personal_role: string | null
          phone_number: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          activated_date?: string | null
          avatar_url?: string | null
          cell_phone?: string | null
          clerk_user_id?: string | null
          clerk_username?: string | null
          contact_id?: number | null
          create_organization_enabled?: boolean | null
          created_at?: string
          deactivation_date?: string | null
          delete_self_enabled?: boolean | null
          email?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          first_name?: string | null
          full_name?: string | null
          has_image?: boolean | null
          id?: number
          image_url?: string | null
          invitation_date?: string | null
          is_active_yn?: boolean | null
          is_banned?: boolean | null
          is_internal_yn?: boolean
          is_locked?: boolean | null
          last_active_at?: string | null
          last_name?: string | null
          last_sign_in_at?: string | null
          legal_accepted_at?: string | null
          office_phone?: string | null
          office_phone_extension?: string | null
          personal_role?: string | null
          phone_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          activated_date?: string | null
          avatar_url?: string | null
          cell_phone?: string | null
          clerk_user_id?: string | null
          clerk_username?: string | null
          contact_id?: number | null
          create_organization_enabled?: boolean | null
          created_at?: string
          deactivation_date?: string | null
          delete_self_enabled?: boolean | null
          email?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          first_name?: string | null
          full_name?: string | null
          has_image?: boolean | null
          id?: number
          image_url?: string | null
          invitation_date?: string | null
          is_active_yn?: boolean | null
          is_banned?: boolean | null
          is_internal_yn?: boolean
          is_locked?: boolean | null
          last_active_at?: string | null
          last_name?: string | null
          last_sign_in_at?: string | null
          legal_accepted_at?: string | null
          office_phone?: string | null
          office_phone_extension?: string | null
          personal_role?: string | null
          phone_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      xactus_data: {
        Row: {
          borrower_id: string | null
          cleaned_data: Json | null
          created_at: string
          equifax_score: number | null
          experian_score: number | null
          id: string
          pull_type: string | null
          raw_data: string | null
          report_id: string | null
          transunion_score: number | null
        }
        Insert: {
          borrower_id?: string | null
          cleaned_data?: Json | null
          created_at?: string
          equifax_score?: number | null
          experian_score?: number | null
          id?: string
          pull_type?: string | null
          raw_data?: string | null
          report_id?: string | null
          transunion_score?: number | null
        }
        Update: {
          borrower_id?: string | null
          cleaned_data?: Json | null
          created_at?: string
          equifax_score?: number | null
          experian_score?: number | null
          id?: string
          pull_type?: string | null
          raw_data?: string | null
          report_id?: string | null
          transunion_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "xactus_reports_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      entities_view: {
        Row: {
          assigned_to: string[] | null
          assigned_to_names: string[] | null
          created_at: string | null
          date_formed: string | null
          display_id: string | null
          ein: string | null
          entity_name: string | null
          entity_type: string | null
          id: string | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string[] | null
          assigned_to_names?: never
          created_at?: string | null
          date_formed?: string | null
          display_id?: string | null
          ein?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string[] | null
          assigned_to_names?: never
          created_at?: string | null
          date_formed?: string | null
          display_id?: string | null
          ein?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_brokers_with_manager_names: {
        Row: {
          email: string | null
          id: string | null
          joined_at: string | null
          manager_names: string | null
          organization_id: string | null
          organization_member_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokers_org_member_fk"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_deal_document:
        | {
            Args: {
              p_action: string
              p_deal_id: number
              p_document_category_id: number
            }
            Returns: boolean
          }
        | {
            Args: {
              p_action: string
              p_deal_id: string
              p_document_category_id: number
            }
            Returns: boolean
          }
      can_access_deal_document_by_code:
        | {
            Args: {
              p_action: string
              p_deal_id: number
              p_document_category_code: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_action: string
              p_deal_id: string
              p_document_category_code: string
            }
            Returns: boolean
          }
      ensure_user_chat: {
        Args: { p_org_id: string; p_report_id: string; p_user_id: string }
        Returns: undefined
      }
      get_active_org_id: { Args: never; Returns: string }
      get_current_user_id: { Args: never; Returns: number }
      is_internal_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { p_org_id: string }; Returns: boolean }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_program_chunks: {
        Args: {
          p_match_count?: number
          p_min_cosine_sim?: number
          p_program_id: string
          p_query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          cosine_sim: number
          document_id: string
        }[]
      }
      sync_application_from_primary_scenario: {
        Args: { p_loan_id: string }
        Returns: undefined
      }
      sync_primary_scenario_from_application: {
        Args: { p_loan_id: string }
        Returns: undefined
      }
    }
    Enums: {
      document_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "archived"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      document_status: ["draft", "pending", "approved", "rejected", "archived"],
    },
  },
} as const
