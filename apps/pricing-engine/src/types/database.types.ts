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
            referencedRelation: "loans"
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
            referencedRelation: "loans"
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
      appraisal: {
        Row: {
          appraiser_id: number | null
          co_amc: string | null
          co_appraisal: string | null
          created_at: string
          date_amc_vendor_accept: string | null
          date_amc_vendor_assign: string | null
          date_inspection_completed: string | null
          date_inspection_scheduled: string | null
          date_report_effective: string | null
          date_report_expiration: string | null
          date_report_ordered: string | null
          date_report_received: string | null
          deal_id: string | null
          document_id: number | null
          file_number: string | null
          file_number_amc: string | null
          id: number
          order_status: string | null
          order_type: string | null
          property_id: number | null
          updated_at: string | null
          value_conclusion_as_is: number | null
          value_conclusion_as_repaired: number | null
          value_conclusion_fair_market_rent: number | null
        }
        Insert: {
          appraiser_id?: number | null
          co_amc?: string | null
          co_appraisal?: string | null
          created_at?: string
          date_amc_vendor_accept?: string | null
          date_amc_vendor_assign?: string | null
          date_inspection_completed?: string | null
          date_inspection_scheduled?: string | null
          date_report_effective?: string | null
          date_report_expiration?: string | null
          date_report_ordered?: string | null
          date_report_received?: string | null
          deal_id?: string | null
          document_id?: number | null
          file_number?: string | null
          file_number_amc?: string | null
          id?: number
          order_status?: string | null
          order_type?: string | null
          property_id?: number | null
          updated_at?: string | null
          value_conclusion_as_is?: number | null
          value_conclusion_as_repaired?: number | null
          value_conclusion_fair_market_rent?: number | null
        }
        Update: {
          appraiser_id?: number | null
          co_amc?: string | null
          co_appraisal?: string | null
          created_at?: string
          date_amc_vendor_accept?: string | null
          date_amc_vendor_assign?: string | null
          date_inspection_completed?: string | null
          date_inspection_scheduled?: string | null
          date_report_effective?: string | null
          date_report_expiration?: string | null
          date_report_ordered?: string | null
          date_report_received?: string | null
          deal_id?: string | null
          document_id?: number | null
          file_number?: string | null
          file_number_amc?: string | null
          id?: number
          order_status?: string | null
          order_type?: string | null
          property_id?: number | null
          updated_at?: string | null
          value_conclusion_as_is?: number | null
          value_conclusion_as_repaired?: number | null
          value_conclusion_fair_market_rent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_appraiser_id_fkey"
            columns: ["appraiser_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_co_amc_fkey"
            columns: ["co_amc"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_co_amc_fkey"
            columns: ["co_amc"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_co_appraisal_fkey"
            columns: ["co_appraisal"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_co_appraisal_fkey"
            columns: ["co_appraisal"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["id"]
          },
        ]
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
      contact: {
        Row: {
          cell_phone: string | null
          created_at: string | null
          email_address: string | null
          first_name: string | null
          home_phone: string | null
          id: number
          last_name: string | null
          middle_name: string | null
          name: string | null
          office_phone: string | null
          portal_access: boolean | null
          profile_picture: string | null
          updated_at: string | null
        }
        Insert: {
          cell_phone?: string | null
          created_at?: string | null
          email_address?: string | null
          first_name?: string | null
          home_phone?: string | null
          id?: number
          last_name?: string | null
          middle_name?: string | null
          name?: string | null
          office_phone?: string | null
          portal_access?: boolean | null
          profile_picture?: string | null
          updated_at?: string | null
        }
        Update: {
          cell_phone?: string | null
          created_at?: string | null
          email_address?: string | null
          first_name?: string | null
          home_phone?: string | null
          id?: number
          last_name?: string | null
          middle_name?: string | null
          name?: string | null
          office_phone?: string | null
          portal_access?: boolean | null
          profile_picture?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      credit_report_data_xactus: {
        Row: {
          borrower_id: string | null
          cleaned_data: Json | null
          created_at: string
          date_ordered: string | null
          equifax_score: number | null
          experian_score: number | null
          file_size: number | null
          file_type: string | null
          guarantor_id: number | null
          id: string
          pull_type: string | null
          raw_data: string | null
          report_id: string | null
          transunion_score: number | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          borrower_id?: string | null
          cleaned_data?: Json | null
          created_at?: string
          date_ordered?: string | null
          equifax_score?: number | null
          experian_score?: number | null
          file_size?: number | null
          file_type?: string | null
          guarantor_id?: number | null
          id?: string
          pull_type?: string | null
          raw_data?: string | null
          report_id?: string | null
          transunion_score?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          borrower_id?: string | null
          cleaned_data?: Json | null
          created_at?: string
          date_ordered?: string | null
          equifax_score?: number | null
          experian_score?: number | null
          file_size?: number | null
          file_type?: string | null
          guarantor_id?: number | null
          id?: string
          pull_type?: string | null
          raw_data?: string | null
          report_id?: string | null
          transunion_score?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_report_data_xactus_guarantor_id_fkey"
            columns: ["guarantor_id"]
            isOneToOne: false
            referencedRelation: "guarantor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xactus_reports_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
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
          report_id: number | null
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
          report_id?: number | null
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
          report_id?: number | null
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
      deal_clerk_orgs: {
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
            foreignKeyName: "deal_clerk_orgs_clerk_org_id_fkey"
            columns: ["clerk_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_clerk_orgs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_comment_reads: {
        Row: {
          clerk_user_id: string
          deal_id: string
          last_read_at: string
        }
        Insert: {
          clerk_user_id: string
          deal_id: string
          last_read_at?: string
        }
        Update: {
          clerk_user_id?: string
          deal_id?: string
          last_read_at?: string
        }
        Relationships: []
      }
      deal_comments: {
        Row: {
          author_avatar_url: string | null
          author_clerk_user_id: string
          author_name: string
          content: string
          created_at: string
          deal_id: string
          id: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_clerk_user_id: string
          author_name: string
          content: string
          created_at?: string
          deal_id: string
          id?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_clerk_user_id?: string
          author_name?: string
          content?: string
          created_at?: string
          deal_id?: string
          id?: string
        }
        Relationships: []
      }
      deal_document_participants: {
        Row: {
          created_at: string
          deal_id: string
          document_file_id: number
          source_pk: number
          source_table: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          document_file_id: number
          source_pk: number
          source_table: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          document_file_id?: number
          source_pk?: number
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_document_participants_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_document_participants_document_file_id_fkey"
            columns: ["document_file_id"]
            isOneToOne: false
            referencedRelation: "document_files"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_guarantors: {
        Row: {
          created_at: string | null
          deal_id: string
          display_order: number | null
          guarantor_id: number
          id: number
          is_primary: boolean | null
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          display_order?: number | null
          guarantor_id: number
          id?: number
          is_primary?: boolean | null
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          display_order?: number | null
          guarantor_id?: number
          id?: number
          is_primary?: boolean | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_guarantors_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_guarantors_guarantor_id_fkey"
            columns: ["guarantor_id"]
            isOneToOne: false
            referencedRelation: "guarantor"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_property: {
        Row: {
          deal_id: string
          id: number
          property_id: number
        }
        Insert: {
          deal_id: string
          id?: number
          property_id: number
        }
        Update: {
          deal_id?: string
          id?: number
          property_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_deal_property_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_deal_property_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
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
      document_files_borrowers: {
        Row: {
          borrower_id: string
          created_at: string | null
          created_by: string | null
          document_file_id: number
          id: number
        }
        Insert: {
          borrower_id: string
          created_at?: string | null
          created_by?: string | null
          document_file_id: number
          id?: number
        }
        Update: {
          borrower_id?: string
          created_at?: string | null
          created_by?: string | null
          document_file_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_files_borrowers_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_borrowers_document_file_id_fkey"
            columns: ["document_file_id"]
            isOneToOne: false
            referencedRelation: "document_files"
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
      document_files_deals: {
        Row: {
          created_at: string | null
          created_by: string | null
          deal_id: string
          document_file_id: number
          id: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deal_id: string
          document_file_id: number
          id?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deal_id?: string
          document_file_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_files_deals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_deals_document_file_id_fkey"
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
      guarantor: {
        Row: {
          borrower_id: string | null
          cell_phone: string | null
          citizenship: string | null
          created_at: string
          date_of_birth: string | null
          email_address: string | null
          first_name: string | null
          home_phone: string | null
          id: number
          last_name: string | null
          mailing_address_city: string | null
          mailing_address_country: string | null
          mailing_address_is_primary_residence: boolean | null
          mailing_address_po_box: string | null
          mailing_address_postal_code: string | null
          mailing_address_state: string | null
          mailing_address_state_long: string | null
          mailing_address_street: string | null
          mailing_address_suite_apt: string | null
          marital_status: string | null
          middle_name: string | null
          name: string | null
          office_phone: string | null
          previous_residence_address_city: string | null
          previous_residence_address_country: string | null
          previous_residence_address_postal_code: string | null
          previous_residence_address_state: string | null
          previous_residence_address_state_long: string | null
          previous_residence_address_street: string | null
          previous_residence_address_suite_apt: string | null
          primary_residence_address_city: string | null
          primary_residence_address_country: string | null
          primary_residence_address_postal_code: string | null
          primary_residence_address_state: string | null
          primary_residence_address_state_long: string | null
          primary_residence_address_street: string | null
          primary_residence_address_suite_apt: string | null
          primary_residence_occupancy_start_date: string | null
          primary_residence_ownership: string | null
          social_security_number: string | null
        }
        Insert: {
          borrower_id?: string | null
          cell_phone?: string | null
          citizenship?: string | null
          created_at?: string
          date_of_birth?: string | null
          email_address?: string | null
          first_name?: string | null
          home_phone?: string | null
          id?: number
          last_name?: string | null
          mailing_address_city?: string | null
          mailing_address_country?: string | null
          mailing_address_is_primary_residence?: boolean | null
          mailing_address_po_box?: string | null
          mailing_address_postal_code?: string | null
          mailing_address_state?: string | null
          mailing_address_state_long?: string | null
          mailing_address_street?: string | null
          mailing_address_suite_apt?: string | null
          marital_status?: string | null
          middle_name?: string | null
          name?: string | null
          office_phone?: string | null
          previous_residence_address_city?: string | null
          previous_residence_address_country?: string | null
          previous_residence_address_postal_code?: string | null
          previous_residence_address_state?: string | null
          previous_residence_address_state_long?: string | null
          previous_residence_address_street?: string | null
          previous_residence_address_suite_apt?: string | null
          primary_residence_address_city?: string | null
          primary_residence_address_country?: string | null
          primary_residence_address_postal_code?: string | null
          primary_residence_address_state?: string | null
          primary_residence_address_state_long?: string | null
          primary_residence_address_street?: string | null
          primary_residence_address_suite_apt?: string | null
          primary_residence_occupancy_start_date?: string | null
          primary_residence_ownership?: string | null
          social_security_number?: string | null
        }
        Update: {
          borrower_id?: string | null
          cell_phone?: string | null
          citizenship?: string | null
          created_at?: string
          date_of_birth?: string | null
          email_address?: string | null
          first_name?: string | null
          home_phone?: string | null
          id?: number
          last_name?: string | null
          mailing_address_city?: string | null
          mailing_address_country?: string | null
          mailing_address_is_primary_residence?: boolean | null
          mailing_address_po_box?: string | null
          mailing_address_postal_code?: string | null
          mailing_address_state?: string | null
          mailing_address_state_long?: string | null
          mailing_address_street?: string | null
          mailing_address_suite_apt?: string | null
          marital_status?: string | null
          middle_name?: string | null
          name?: string | null
          office_phone?: string | null
          previous_residence_address_city?: string | null
          previous_residence_address_country?: string | null
          previous_residence_address_postal_code?: string | null
          previous_residence_address_state?: string | null
          previous_residence_address_state_long?: string | null
          previous_residence_address_street?: string | null
          previous_residence_address_suite_apt?: string | null
          primary_residence_address_city?: string | null
          primary_residence_address_country?: string | null
          primary_residence_address_postal_code?: string | null
          primary_residence_address_state?: string | null
          primary_residence_address_state_long?: string | null
          primary_residence_address_street?: string | null
          primary_residence_address_suite_apt?: string | null
          primary_residence_occupancy_start_date?: string | null
          primary_residence_ownership?: string | null
          social_security_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guarantor_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["display_id"]
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
            referencedRelation: "loans"
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
      loans: {
        Row: {
          assigned_to_user_id: Json | null
          created_at: string
          id: string
          organization_id: string
          primary_user_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: Json | null
          created_at?: string
          id?: string
          organization_id: string
          primary_user_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: Json | null
          created_at?: string
          id?: string
          organization_id?: string
          primary_user_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_organization_id_fkey"
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
      organization_member_roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: number
          is_active: boolean | null
          organization_id: string | null
          role_code: string
          role_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          organization_id?: string | null
          role_code: string
          role_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          organization_id?: string | null
          role_code?: string
          role_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_member_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          clerk_member_role: string | null
          clerk_org_role: string
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string
          user_id: string
        }
        Insert: {
          clerk_member_role?: string | null
          clerk_org_role?: string
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id: string
          user_id: string
        }
        Update: {
          clerk_member_role?: string | null
          clerk_org_role?: string
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string
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
      organization_policies: {
        Row: {
          action: string
          compiled_config: Json
          created_at: string
          created_by_clerk_sub: string | null
          created_by_user_id: number | null
          definition_json: Json
          id: string
          is_active: boolean
          org_id: string
          resource_name: string
          resource_type: string
          version: number
        }
        Insert: {
          action: string
          compiled_config: Json
          created_at?: string
          created_by_clerk_sub?: string | null
          created_by_user_id?: number | null
          definition_json: Json
          id?: string
          is_active?: boolean
          org_id: string
          resource_name?: string
          resource_type: string
          version?: number
        }
        Update: {
          action?: string
          compiled_config?: Json
          created_at?: string
          created_by_clerk_sub?: string | null
          created_by_user_id?: number | null
          definition_json?: Json
          id?: string
          is_active?: boolean
          org_id?: string
          resource_name?: string
          resource_type?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_policies_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_themes: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          theme_dark: Json
          theme_light: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          theme_dark: Json
          theme_light: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          theme_dark?: Json
          theme_light?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_themes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
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
          is_internal_yn: boolean | null
          name: string
          org_id: number
          slug: string | null
          updated_at: string
        }
        Insert: {
          clerk_organization_id?: string | null
          created_at?: string
          id?: string
          is_internal_yn?: boolean | null
          name: string
          org_id?: number
          slug?: string | null
          updated_at?: string
        }
        Update: {
          clerk_organization_id?: string | null
          created_at?: string
          id?: string
          is_internal_yn?: boolean | null
          name?: string
          org_id?: number
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
            referencedRelation: "loans"
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
          status?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      property: {
        Row: {
          address: string | null
          address_city: string | null
          address_country: string | null
          address_county: string | null
          address_postal_code: string | null
          address_state: string | null
          address_state_long: string | null
          address_street: string | null
          address_suite_apt: string | null
          bathrooms_aiv: number | null
          bathrooms_arv: number | null
          bedrooms_aiv: number | null
          bedrooms_arv: number | null
          created_at: string | null
          declining_market: string | null
          expense_annual_association_hoa: number | null
          expense_annual_insurance_flood: number | null
          expense_annual_insurance_hoi: number | null
          expense_annual_management: number | null
          expense_annual_property_tax: number | null
          flood_zone: string | null
          hoa_contact: number | null
          hoa_contact_email: string | null
          hoa_contact_person: string | null
          hoa_contact_phone: string | null
          hoa_name: string | null
          id: number
          income_monthly_fair_market_rent: number | null
          income_monthly_gross_rent: number | null
          inspection: string | null
          latitude: number | null
          longitude: number | null
          occupancy: string | null
          photo_url: string | null
          property_type: string | null
          purchase_date: string | null
          purchase_price: number | null
          recently_renovated: string | null
          rehab_completed_post_acquisition: number | null
          renovation_completed: string | null
          renovation_cost: number | null
          rural: string | null
          sale_date: string | null
          sale_price: number | null
          short_term_rental: string | null
          sq_footage_gla_aiv: number | null
          sq_footage_gla_arv: number | null
          sq_footage_lot_aiv: number | null
          sq_footage_lot_arv: number | null
          units: number | null
          updated_at: string | null
          value_aiv_appraised: number | null
          value_aiv_estimate: number | null
          value_arv_appraised: number | null
          value_arv_estimate: number | null
          warrantability: string | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_country?: string | null
          address_county?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_state_long?: string | null
          address_street?: string | null
          address_suite_apt?: string | null
          bathrooms_aiv?: number | null
          bathrooms_arv?: number | null
          bedrooms_aiv?: number | null
          bedrooms_arv?: number | null
          created_at?: string | null
          declining_market?: string | null
          expense_annual_association_hoa?: number | null
          expense_annual_insurance_flood?: number | null
          expense_annual_insurance_hoi?: number | null
          expense_annual_management?: number | null
          expense_annual_property_tax?: number | null
          flood_zone?: string | null
          hoa_contact?: number | null
          hoa_contact_email?: string | null
          hoa_contact_person?: string | null
          hoa_contact_phone?: string | null
          hoa_name?: string | null
          id?: number
          income_monthly_fair_market_rent?: number | null
          income_monthly_gross_rent?: number | null
          inspection?: string | null
          latitude?: number | null
          longitude?: number | null
          occupancy?: string | null
          photo_url?: string | null
          property_type?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          recently_renovated?: string | null
          rehab_completed_post_acquisition?: number | null
          renovation_completed?: string | null
          renovation_cost?: number | null
          rural?: string | null
          sale_date?: string | null
          sale_price?: number | null
          short_term_rental?: string | null
          sq_footage_gla_aiv?: number | null
          sq_footage_gla_arv?: number | null
          sq_footage_lot_aiv?: number | null
          sq_footage_lot_arv?: number | null
          units?: number | null
          updated_at?: string | null
          value_aiv_appraised?: number | null
          value_aiv_estimate?: number | null
          value_arv_appraised?: number | null
          value_arv_estimate?: number | null
          warrantability?: string | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_country?: string | null
          address_county?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_state_long?: string | null
          address_street?: string | null
          address_suite_apt?: string | null
          bathrooms_aiv?: number | null
          bathrooms_arv?: number | null
          bedrooms_aiv?: number | null
          bedrooms_arv?: number | null
          created_at?: string | null
          declining_market?: string | null
          expense_annual_association_hoa?: number | null
          expense_annual_insurance_flood?: number | null
          expense_annual_insurance_hoi?: number | null
          expense_annual_management?: number | null
          expense_annual_property_tax?: number | null
          flood_zone?: string | null
          hoa_contact?: number | null
          hoa_contact_email?: string | null
          hoa_contact_person?: string | null
          hoa_contact_phone?: string | null
          hoa_name?: string | null
          id?: number
          income_monthly_fair_market_rent?: number | null
          income_monthly_gross_rent?: number | null
          inspection?: string | null
          latitude?: number | null
          longitude?: number | null
          occupancy?: string | null
          photo_url?: string | null
          property_type?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          recently_renovated?: string | null
          rehab_completed_post_acquisition?: number | null
          renovation_completed?: string | null
          renovation_cost?: number | null
          rural?: string | null
          sale_date?: string | null
          sale_price?: number | null
          short_term_rental?: string | null
          sq_footage_gla_aiv?: number | null
          sq_footage_gla_arv?: number | null
          sq_footage_lot_aiv?: number | null
          sq_footage_lot_arv?: number | null
          units?: number | null
          updated_at?: string | null
          value_aiv_appraised?: number | null
          value_aiv_estimate?: number | null
          value_arv_appraised?: number | null
          value_arv_estimate?: number | null
          warrantability?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_hoa_contact_fkey"
            columns: ["hoa_contact"]
            isOneToOne: false
            referencedRelation: "contact"
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
      term_sheet_template_fields: {
        Row: {
          created_at: string
          field_type: string
          id: string
          name: string
          position: number
          required: boolean
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_type: string
          id?: string
          name: string
          position?: number
          required?: boolean
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          name?: string
          position?: number
          required?: boolean
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_sheet_template_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "term_sheet_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      term_sheet_templates: {
        Row: {
          created_at: string
          gjs_data: Json
          html_content: string
          id: string
          name: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gjs_data: Json
          html_content?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gjs_data?: Json
          html_content?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_sheet_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "loans"
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
        | {
            Args: { p_deal_id: string; p_document_id: string }
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
      can_access_document: {
        Args: { p_action: string; p_document_file_id: number }
        Returns: boolean
      }
      can_access_org_resource: {
        Args: {
          p_action: string
          p_resource_name: string
          p_resource_type: string
        }
        Returns: boolean
      }
      create_document_with_deal_link: {
        Args: {
          p_deal_id: string
          p_document_category_id: number
          p_document_name: string
          p_file_size?: number
          p_file_type?: string
          p_original_filename: string
          p_storage_bucket: string
        }
        Returns: {
          document_id: number
          storage_bucket: string
          storage_path: string
        }[]
      }
      create_document_with_subject_link: {
        Args: {
          p_document_category_id: number
          p_document_name: string
          p_file_size?: number
          p_file_type?: string
          p_original_filename: string
          p_storage_bucket: string
          p_subject_id?: string
          p_subject_type?: string
        }
        Returns: {
          document_id: number
          storage_bucket: string
          storage_path: string
        }[]
      }
      document_file_deal_ids: {
        Args: { p_document_file_id: number }
        Returns: {
          deal_id: string
        }[]
      }
      ensure_user_chat: {
        Args: { p_org_id: string; p_report_id: string; p_user_id: string }
        Returns: undefined
      }
      finalize_document_upload: {
        Args: { p_document_file_id: number; p_file_size?: number }
        Returns: boolean
      }
      generate_tag_slug: { Args: { tag_name: string }; Returns: string }
      get_active_org_id: { Args: never; Returns: string }
      get_clerk_user_id: { Args: never; Returns: string }
      get_current_user_id: { Args: never; Returns: number }
      get_deal_documents: {
        Args: { p_deal_id: string }
        Returns: {
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
        }[]
        SetofOptions: {
          from: "*"
          to: "document_files"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_internal_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { p_org_id: string }; Returns: boolean }
      is_org_owner: { Args: { p_org_id: string }; Returns: boolean }
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
      country:
        | "Bonaire, Sint Eustatius and Saba"
        | "Curaçao"
        | "Guernsey"
        | "Isle of Man"
        | "Jersey"
        | "Åland Islands"
        | "Montenegro"
        | "Saint Barthélemy"
        | "Saint Martin (French part)"
        | "Serbia"
        | "Sint Maarten (Dutch part)"
        | "South Sudan"
        | "Timor-Leste"
        | "American Samoa"
        | "Andorra"
        | "Angola"
        | "Anguilla"
        | "Antarctica"
        | "Antigua and Barbuda"
        | "Argentina"
        | "Armenia"
        | "Aruba"
        | "Australia"
        | "Austria"
        | "Azerbaijan"
        | "Bahamas"
        | "Bahrain"
        | "Bangladesh"
        | "Barbados"
        | "Belarus"
        | "Belgium"
        | "Belize"
        | "Benin"
        | "Bermuda"
        | "Bhutan"
        | "Bolivia"
        | "Bosnia and Herzegovina"
        | "Botswana"
        | "Bouvet Island"
        | "Brazil"
        | "British Indian Ocean Territory"
        | "Brunei Darussalam"
        | "Bulgaria"
        | "Burkina Faso"
        | "Burundi"
        | "Cambodia"
        | "Cameroon"
        | "Canada"
        | "Cape Verde"
        | "Cayman Islands"
        | "Central African Republic"
        | "Chad"
        | "Chile"
        | "China"
        | "Christmas Island"
        | "Cocos (Keeling) Islands"
        | "Colombia"
        | "Comoros"
        | "Congo"
        | "Congo, the Democratic Republic of the"
        | "Cook Islands"
        | "Costa Rica"
        | "Cote DIvoire"
        | "Croatia"
        | "Cuba"
        | "Cyprus"
        | "Czech Republic"
        | "Denmark"
        | "Djibouti"
        | "Dominica"
        | "Dominican Republic"
        | "Ecuador"
        | "Egypt"
        | "El Salvador"
        | "Equatorial Guinea"
        | "Eritrea"
        | "Estonia"
        | "Ethiopia"
        | "Falkland Islands (Malvinas)"
        | "Faroe Islands"
        | "Fiji"
        | "Finland"
        | "France"
        | "French Guiana"
        | "French Polynesia"
        | "French Southern Territories"
        | "Gabon"
        | "Gambia"
        | "Georgia"
        | "Germany"
        | "Ghana"
        | "Gibraltar"
        | "Greece"
        | "Greenland"
        | "Grenada"
        | "Guadeloupe"
        | "Guam"
        | "Guatemala"
        | "Guinea"
        | "Guinea-Bissau"
        | "Guyana"
        | "Haiti"
        | "Heard Island and Mcdonald Islands"
        | "Holy See (Vatican City State)"
        | "Honduras"
        | "Hong Kong"
        | "Hungary"
        | "Iceland"
        | "India"
        | "Indonesia"
        | "Iran, Islamic Republic of"
        | "Iraq"
        | "Ireland"
        | "Israel"
        | "Italy"
        | "Jamaica"
        | "Japan"
        | "Jordan"
        | "Kazakhstan"
        | "Kenya"
        | "Kiribati"
        | "Korea, Democratic People's Republic of"
        | "Korea, Republic of"
        | "Kuwait"
        | "Kyrgyzstan"
        | "Lao People's Democratic Republic"
        | "Latvia"
        | "Lebanon"
        | "Lesotho"
        | "Liberia"
        | "Libya"
        | "Liechtenstein"
        | "Lithuania"
        | "Luxembourg"
        | "Macao"
        | "Macedonia, the Former Yugoslav Republic of"
        | "Madagascar"
        | "Malawi"
        | "Malaysia"
        | "Maldives"
        | "Mali"
        | "Malta"
        | "Marshall Islands"
        | "Martinique"
        | "Mauritania"
        | "Mauritius"
        | "Mayotte"
        | "Mexico"
        | "Micronesia, Federated States of"
        | "Moldova, Republic of"
        | "Monaco"
        | "Mongolia"
        | "Albania"
        | "Montserrat"
        | "Morocco"
        | "Mozambique"
        | "Myanmar"
        | "Namibia"
        | "Nauru"
        | "Nepal"
        | "Netherlands"
        | "New Caledonia"
        | "New Zealand"
        | "Nicaragua"
        | "Niger"
        | "Nigeria"
        | "Niue"
        | "Norfolk Island"
        | "Northern Mariana Islands"
        | "Norway"
        | "Oman"
        | "Pakistan"
        | "Palau"
        | "Palestine, State of"
        | "Panama"
        | "Papua New Guinea"
        | "Paraguay"
        | "Peru"
        | "Philippines"
        | "Pitcairn"
        | "Poland"
        | "Portugal"
        | "Puerto Rico"
        | "Qatar"
        | "Reunion"
        | "Romania"
        | "Russian Federation"
        | "Rwanda"
        | "Saint Helena, Ascension and Tristan da Cunha"
        | "Saint Kitts and Nevis"
        | "Saint Lucia"
        | "Saint Pierre and Miquelon"
        | "Saint Vincent and the Grenadines"
        | "Samoa"
        | "San Marino"
        | "Sao Tome and Principe"
        | "Saudi Arabia"
        | "Senegal"
        | "Seychelles"
        | "Sierra Leone"
        | "Singapore"
        | "Slovakia"
        | "Slovenia"
        | "Solomon Islands"
        | "Somalia"
        | "South Africa"
        | "South Georgia and the South Sandwich Islands"
        | "Spain"
        | "Sri Lanka"
        | "Sudan"
        | "Suriname"
        | "Svalbard and Jan Mayen"
        | "Swaziland"
        | "Sweden"
        | "Switzerland"
        | "Syrian Arab Republic"
        | "Taiwan (Province of China)"
        | "Tajikistan"
        | "Tanzania, United Republic of"
        | "Thailand"
        | "Togo"
        | "Tokelau"
        | "Tonga"
        | "Trinidad and Tobago"
        | "Tunisia"
        | "Turkey"
        | "Turkmenistan"
        | "Turks and Caicos Islands"
        | "Tuvalu"
        | "Uganda"
        | "Ukraine"
        | "United Arab Emirates"
        | "United Kingdom"
        | "United States"
        | "United States Minor Outlying Islands"
        | "Uruguay"
        | "Uzbekistan"
        | "Vanuatu"
        | "Venezuela"
        | "Viet Nam"
        | "Virgin Islands (British)"
        | "Virgin Islands (U.S.)"
        | "Wallis and Futuna"
        | "Western Sahara"
        | "Yemen"
        | "Zambia"
        | "Zimbabwe"
        | "Afghanistan"
        | "Algeria"
      document_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "archived"
      entity_type:
        | "general_partnership"
        | "limited_liability_company"
        | "limited_liability_partnership"
        | "limited_partnership"
        | "corp"
        | "c-corp"
        | "s_corp"
        | "sole_proprietorship"
        | "other"
      us_states:
        | "AL"
        | "AK"
        | "AZ"
        | "AR"
        | "CA"
        | "CO"
        | "CT"
        | "DE"
        | "FL"
        | "GA"
        | "HI"
        | "ID"
        | "IL"
        | "IN"
        | "IA"
        | "KS"
        | "KY"
        | "LA"
        | "ME"
        | "MD"
        | "MA"
        | "MI"
        | "MN"
        | "MS"
        | "MO"
        | "MT"
        | "NE"
        | "NV"
        | "NH"
        | "NJ"
        | "NM"
        | "NY"
        | "NC"
        | "ND"
        | "OH"
        | "OK"
        | "OR"
        | "PA"
        | "RI"
        | "SC"
        | "SD"
        | "TN"
        | "TX"
        | "UT"
        | "VT"
        | "VA"
        | "WA"
        | "WV"
        | "WI"
        | "WY"
        | "DC"
        | "PR"
      us_states_long:
        | "alabama"
        | "alaska"
        | "arizona"
        | "arkansas"
        | "california"
        | "colorado"
        | "connecticut"
        | "delaware"
        | "district_of_columbia"
        | "florida"
        | "georgia"
        | "hawaii"
        | "idaho"
        | "illinois"
        | "indiana"
        | "iowa"
        | "kansas"
        | "kentucky"
        | "louisiana"
        | "maine"
        | "maryland"
        | "massachusetts"
        | "michigan"
        | "minnesota"
        | "mississippi"
        | "missouri"
        | "montana"
        | "nebraska"
        | "nevada"
        | "new_hampshire"
        | "new_jersey"
        | "new_mexico"
        | "new_york"
        | "north_carolina"
        | "north_dakota"
        | "ohio"
        | "oklahoma"
        | "oregon"
        | "pennsylvania"
        | "rhode_island"
        | "south_carolina"
        | "south_dakota"
        | "tennessee"
        | "texas"
        | "utah"
        | "vermont"
        | "virginia"
        | "washington"
        | "west_virginia"
        | "wisconsin"
        | "wyoming"
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
      country: [
        "Bonaire, Sint Eustatius and Saba",
        "Curaçao",
        "Guernsey",
        "Isle of Man",
        "Jersey",
        "Åland Islands",
        "Montenegro",
        "Saint Barthélemy",
        "Saint Martin (French part)",
        "Serbia",
        "Sint Maarten (Dutch part)",
        "South Sudan",
        "Timor-Leste",
        "American Samoa",
        "Andorra",
        "Angola",
        "Anguilla",
        "Antarctica",
        "Antigua and Barbuda",
        "Argentina",
        "Armenia",
        "Aruba",
        "Australia",
        "Austria",
        "Azerbaijan",
        "Bahamas",
        "Bahrain",
        "Bangladesh",
        "Barbados",
        "Belarus",
        "Belgium",
        "Belize",
        "Benin",
        "Bermuda",
        "Bhutan",
        "Bolivia",
        "Bosnia and Herzegovina",
        "Botswana",
        "Bouvet Island",
        "Brazil",
        "British Indian Ocean Territory",
        "Brunei Darussalam",
        "Bulgaria",
        "Burkina Faso",
        "Burundi",
        "Cambodia",
        "Cameroon",
        "Canada",
        "Cape Verde",
        "Cayman Islands",
        "Central African Republic",
        "Chad",
        "Chile",
        "China",
        "Christmas Island",
        "Cocos (Keeling) Islands",
        "Colombia",
        "Comoros",
        "Congo",
        "Congo, the Democratic Republic of the",
        "Cook Islands",
        "Costa Rica",
        "Cote DIvoire",
        "Croatia",
        "Cuba",
        "Cyprus",
        "Czech Republic",
        "Denmark",
        "Djibouti",
        "Dominica",
        "Dominican Republic",
        "Ecuador",
        "Egypt",
        "El Salvador",
        "Equatorial Guinea",
        "Eritrea",
        "Estonia",
        "Ethiopia",
        "Falkland Islands (Malvinas)",
        "Faroe Islands",
        "Fiji",
        "Finland",
        "France",
        "French Guiana",
        "French Polynesia",
        "French Southern Territories",
        "Gabon",
        "Gambia",
        "Georgia",
        "Germany",
        "Ghana",
        "Gibraltar",
        "Greece",
        "Greenland",
        "Grenada",
        "Guadeloupe",
        "Guam",
        "Guatemala",
        "Guinea",
        "Guinea-Bissau",
        "Guyana",
        "Haiti",
        "Heard Island and Mcdonald Islands",
        "Holy See (Vatican City State)",
        "Honduras",
        "Hong Kong",
        "Hungary",
        "Iceland",
        "India",
        "Indonesia",
        "Iran, Islamic Republic of",
        "Iraq",
        "Ireland",
        "Israel",
        "Italy",
        "Jamaica",
        "Japan",
        "Jordan",
        "Kazakhstan",
        "Kenya",
        "Kiribati",
        "Korea, Democratic People's Republic of",
        "Korea, Republic of",
        "Kuwait",
        "Kyrgyzstan",
        "Lao People's Democratic Republic",
        "Latvia",
        "Lebanon",
        "Lesotho",
        "Liberia",
        "Libya",
        "Liechtenstein",
        "Lithuania",
        "Luxembourg",
        "Macao",
        "Macedonia, the Former Yugoslav Republic of",
        "Madagascar",
        "Malawi",
        "Malaysia",
        "Maldives",
        "Mali",
        "Malta",
        "Marshall Islands",
        "Martinique",
        "Mauritania",
        "Mauritius",
        "Mayotte",
        "Mexico",
        "Micronesia, Federated States of",
        "Moldova, Republic of",
        "Monaco",
        "Mongolia",
        "Albania",
        "Montserrat",
        "Morocco",
        "Mozambique",
        "Myanmar",
        "Namibia",
        "Nauru",
        "Nepal",
        "Netherlands",
        "New Caledonia",
        "New Zealand",
        "Nicaragua",
        "Niger",
        "Nigeria",
        "Niue",
        "Norfolk Island",
        "Northern Mariana Islands",
        "Norway",
        "Oman",
        "Pakistan",
        "Palau",
        "Palestine, State of",
        "Panama",
        "Papua New Guinea",
        "Paraguay",
        "Peru",
        "Philippines",
        "Pitcairn",
        "Poland",
        "Portugal",
        "Puerto Rico",
        "Qatar",
        "Reunion",
        "Romania",
        "Russian Federation",
        "Rwanda",
        "Saint Helena, Ascension and Tristan da Cunha",
        "Saint Kitts and Nevis",
        "Saint Lucia",
        "Saint Pierre and Miquelon",
        "Saint Vincent and the Grenadines",
        "Samoa",
        "San Marino",
        "Sao Tome and Principe",
        "Saudi Arabia",
        "Senegal",
        "Seychelles",
        "Sierra Leone",
        "Singapore",
        "Slovakia",
        "Slovenia",
        "Solomon Islands",
        "Somalia",
        "South Africa",
        "South Georgia and the South Sandwich Islands",
        "Spain",
        "Sri Lanka",
        "Sudan",
        "Suriname",
        "Svalbard and Jan Mayen",
        "Swaziland",
        "Sweden",
        "Switzerland",
        "Syrian Arab Republic",
        "Taiwan (Province of China)",
        "Tajikistan",
        "Tanzania, United Republic of",
        "Thailand",
        "Togo",
        "Tokelau",
        "Tonga",
        "Trinidad and Tobago",
        "Tunisia",
        "Turkey",
        "Turkmenistan",
        "Turks and Caicos Islands",
        "Tuvalu",
        "Uganda",
        "Ukraine",
        "United Arab Emirates",
        "United Kingdom",
        "United States",
        "United States Minor Outlying Islands",
        "Uruguay",
        "Uzbekistan",
        "Vanuatu",
        "Venezuela",
        "Viet Nam",
        "Virgin Islands (British)",
        "Virgin Islands (U.S.)",
        "Wallis and Futuna",
        "Western Sahara",
        "Yemen",
        "Zambia",
        "Zimbabwe",
        "Afghanistan",
        "Algeria",
      ],
      document_status: ["draft", "pending", "approved", "rejected", "archived"],
      entity_type: [
        "general_partnership",
        "limited_liability_company",
        "limited_liability_partnership",
        "limited_partnership",
        "corp",
        "c-corp",
        "s_corp",
        "sole_proprietorship",
        "other",
      ],
      us_states: [
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
        "DC",
        "PR",
      ],
      us_states_long: [
        "alabama",
        "alaska",
        "arizona",
        "arkansas",
        "california",
        "colorado",
        "connecticut",
        "delaware",
        "district_of_columbia",
        "florida",
        "georgia",
        "hawaii",
        "idaho",
        "illinois",
        "indiana",
        "iowa",
        "kansas",
        "kentucky",
        "louisiana",
        "maine",
        "maryland",
        "massachusetts",
        "michigan",
        "minnesota",
        "mississippi",
        "missouri",
        "montana",
        "nebraska",
        "nevada",
        "new_hampshire",
        "new_jersey",
        "new_mexico",
        "new_york",
        "north_carolina",
        "north_dakota",
        "ohio",
        "oklahoma",
        "oregon",
        "pennsylvania",
        "rhode_island",
        "south_carolina",
        "south_dakota",
        "tennessee",
        "texas",
        "utah",
        "vermont",
        "virginia",
        "washington",
        "west_virginia",
        "wisconsin",
        "wyoming",
      ],
    },
  },
} as const
