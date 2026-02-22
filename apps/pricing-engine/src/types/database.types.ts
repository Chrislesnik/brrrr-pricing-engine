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
      actions: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          trigger_type: string
          updated_at: string
          uuid: string
          webhook_type: string | null
          workflow_data: Json | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          trigger_type?: string
          updated_at?: string
          uuid?: string
          webhook_type?: string | null
          workflow_data?: Json | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          trigger_type?: string
          updated_at?: string
          uuid?: string
          webhook_type?: string | null
          workflow_data?: Json | null
        }
        Relationships: []
      }
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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      application_appraisal: {
        Row: {
          application_id: string
          borrower_alt_phone: string | null
          borrower_email: string | null
          borrower_name: string | null
          borrower_phone: string | null
          contact_email: string | null
          contact_name: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          due_date: string | null
          id: string
          investor: string | null
          lender: string | null
          loan_amount: string | null
          loan_number: string | null
          loan_type: string | null
          loan_type_other: string | null
          occupancy_type: string | null
          organization_id: string
          other_access_info: string | null
          priority: string | null
          product: string | null
          property_address: string | null
          property_city: string | null
          property_county: string | null
          property_state: string | null
          property_type: string | null
          property_zip: string | null
          sales_price: string | null
          transaction_type: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          borrower_alt_phone?: string | null
          borrower_email?: string | null
          borrower_name?: string | null
          borrower_phone?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          investor?: string | null
          lender?: string | null
          loan_amount?: string | null
          loan_number?: string | null
          loan_type?: string | null
          loan_type_other?: string | null
          occupancy_type?: string | null
          organization_id: string
          other_access_info?: string | null
          priority?: string | null
          product?: string | null
          property_address?: string | null
          property_city?: string | null
          property_county?: string | null
          property_state?: string | null
          property_type?: string | null
          property_zip?: string | null
          sales_price?: string | null
          transaction_type?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          borrower_alt_phone?: string | null
          borrower_email?: string | null
          borrower_name?: string | null
          borrower_phone?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          investor?: string | null
          lender?: string | null
          loan_amount?: string | null
          loan_number?: string | null
          loan_type?: string | null
          loan_type_other?: string | null
          occupancy_type?: string | null
          organization_id?: string
          other_access_info?: string | null
          priority?: string | null
          product?: string | null
          property_address?: string | null
          property_city?: string | null
          property_county?: string | null
          property_state?: string | null
          property_type?: string | null
          property_zip?: string | null
          sales_price?: string | null
          transaction_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_appraisal_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "application_appraisal_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      application_background: {
        Row: {
          application_id: string
          borrower_id: string | null
          city: string | null
          country: string | null
          county: string | null
          created_at: string
          date_of_birth: string | null
          date_of_formation: string | null
          dppa: string | null
          ein: string | null
          email: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          first_name: string | null
          glb: string | null
          id: string
          is_entity: boolean
          last_name: string | null
          middle_initial: string | null
          organization_id: string
          party_index: number
          phone: string | null
          province: string | null
          state: string | null
          state_of_formation: string | null
          street: string | null
          updated_at: string
          voter: string | null
          zip: string | null
        }
        Insert: {
          application_id: string
          borrower_id?: string | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_formation?: string | null
          dppa?: string | null
          ein?: string | null
          email?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          first_name?: string | null
          glb?: string | null
          id?: string
          is_entity?: boolean
          last_name?: string | null
          middle_initial?: string | null
          organization_id: string
          party_index?: number
          phone?: string | null
          province?: string | null
          state?: string | null
          state_of_formation?: string | null
          street?: string | null
          updated_at?: string
          voter?: string | null
          zip?: string | null
        }
        Update: {
          application_id?: string
          borrower_id?: string | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_formation?: string | null
          dppa?: string | null
          ein?: string | null
          email?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          first_name?: string | null
          glb?: string | null
          id?: string
          is_entity?: boolean
          last_name?: string | null
          middle_initial?: string | null
          organization_id?: string
          party_index?: number
          phone?: string | null
          province?: string | null
          state?: string | null
          state_of_formation?: string | null
          street?: string | null
          updated_at?: string
          voter?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_background_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "application_background_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_background_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_background_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_background_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      application_credit: {
        Row: {
          application_id: string
          borrower_id: string | null
          city: string | null
          county: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          guarantor_index: number
          id: string
          include_eq: boolean | null
          include_ex: boolean | null
          include_tu: boolean | null
          last_name: string | null
          organization_id: string
          prev_city: string | null
          prev_state: string | null
          prev_street: string | null
          prev_zip: string | null
          pull_type: string | null
          state: string | null
          street: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          application_id: string
          borrower_id?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          guarantor_index?: number
          id?: string
          include_eq?: boolean | null
          include_ex?: boolean | null
          include_tu?: boolean | null
          last_name?: string | null
          organization_id: string
          prev_city?: string | null
          prev_state?: string | null
          prev_street?: string | null
          prev_zip?: string | null
          pull_type?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          application_id?: string
          borrower_id?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          guarantor_index?: number
          id?: string
          include_eq?: boolean | null
          include_ex?: boolean | null
          include_tu?: boolean | null
          last_name?: string | null
          organization_id?: string
          prev_city?: string | null
          prev_state?: string | null
          prev_street?: string | null
          prev_zip?: string | null
          pull_type?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_credit_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "application_credit_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_credit_organization_id_fkey"
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
          display_id: string
          documenso_document_id: string | null
          entity_id: string | null
          external_defaults: Json | null
          form_data: Json | null
          guarantor_emails: string[] | null
          guarantor_ids: string[] | null
          guarantor_names: string[] | null
          loan_id: string
          merged_data: Json | null
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
          display_id: string
          documenso_document_id?: string | null
          entity_id?: string | null
          external_defaults?: Json | null
          form_data?: Json | null
          guarantor_emails?: string[] | null
          guarantor_ids?: string[] | null
          guarantor_names?: string[] | null
          loan_id: string
          merged_data?: Json | null
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
          display_id?: string
          documenso_document_id?: string | null
          entity_id?: string | null
          external_defaults?: Json | null
          form_data?: Json | null
          guarantor_emails?: string[] | null
          guarantor_ids?: string[] | null
          guarantor_names?: string[] | null
          loan_id?: string
          merged_data?: Json | null
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
          amc_id: number | null
          appraiser_id: number | null
          borrower_id: string | null
          borrower_name: string | null
          co_amc: string | null
          co_appraisal: string | null
          created_at: string
          created_by: string | null
          date_amc_vendor_accept: string | null
          date_amc_vendor_assign: string | null
          date_due: string | null
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
          loan_number: string | null
          order_status: string | null
          order_type: string | null
          organization_id: string | null
          property_address: string | null
          property_city: string | null
          property_id: number | null
          property_state: string | null
          property_zip: string | null
          updated_at: string | null
          value_conclusion_as_is: number | null
          value_conclusion_as_repaired: number | null
          value_conclusion_fair_market_rent: number | null
        }
        Insert: {
          amc_id?: number | null
          appraiser_id?: number | null
          borrower_id?: string | null
          borrower_name?: string | null
          co_amc?: string | null
          co_appraisal?: string | null
          created_at?: string
          created_by?: string | null
          date_amc_vendor_accept?: string | null
          date_amc_vendor_assign?: string | null
          date_due?: string | null
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
          loan_number?: string | null
          order_status?: string | null
          order_type?: string | null
          organization_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_id?: number | null
          property_state?: string | null
          property_zip?: string | null
          updated_at?: string | null
          value_conclusion_as_is?: number | null
          value_conclusion_as_repaired?: number | null
          value_conclusion_fair_market_rent?: number | null
        }
        Update: {
          amc_id?: number | null
          appraiser_id?: number | null
          borrower_id?: string | null
          borrower_name?: string | null
          co_amc?: string | null
          co_appraisal?: string | null
          created_at?: string
          created_by?: string | null
          date_amc_vendor_accept?: string | null
          date_amc_vendor_assign?: string | null
          date_due?: string | null
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
          loan_number?: string | null
          order_status?: string | null
          order_type?: string | null
          organization_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_id?: number | null
          property_state?: string | null
          property_zip?: string | null
          updated_at?: string | null
          value_conclusion_as_is?: number | null
          value_conclusion_as_repaired?: number | null
          value_conclusion_fair_market_rent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_amc_id_fkey"
            columns: ["amc_id"]
            isOneToOne: false
            referencedRelation: "appraisal_amcs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_appraiser_id_fkey"
            columns: ["appraiser_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
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
            foreignKeyName: "appraisal_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      appraisal_amcs: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_amcs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      background_person_search: {
        Row: {
          background_report_id: string | null
          created_at: string
          data: Json | null
          dppa: number | null
          entity_id: string | null
          glb: string | null
          group_id: string | null
          id: number
          voter: number | null
        }
        Insert: {
          background_report_id?: string | null
          created_at?: string
          data?: Json | null
          dppa?: number | null
          entity_id?: string | null
          glb?: string | null
          group_id?: string | null
          id?: number
          voter?: number | null
        }
        Update: {
          background_report_id?: string | null
          created_at?: string
          data?: Json | null
          dppa?: number | null
          entity_id?: string | null
          glb?: string | null
          group_id?: string | null
          id?: number
          voter?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "background_person_search_background_report_id_fkey"
            columns: ["background_report_id"]
            isOneToOne: false
            referencedRelation: "background_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      background_person_search_bankruptcy: {
        Row: {
          background_person_report_id: string | null
          bk_case_number: string | null
          bk_chapter: string | null
          bk_court_state: string | null
          bk_discharged_date: string | null
          bk_filing_date: string | null
          created_at: string
          data: Json | null
          id: number
        }
        Insert: {
          background_person_report_id?: string | null
          bk_case_number?: string | null
          bk_chapter?: string | null
          bk_court_state?: string | null
          bk_discharged_date?: string | null
          bk_filing_date?: string | null
          created_at?: string
          data?: Json | null
          id?: number
        }
        Update: {
          background_person_report_id?: string | null
          bk_case_number?: string | null
          bk_chapter?: string | null
          bk_court_state?: string | null
          bk_discharged_date?: string | null
          bk_filing_date?: string | null
          created_at?: string
          data?: Json | null
          id?: number
        }
        Relationships: []
      }
      background_person_search_criminal: {
        Row: {
          background_person_search_id: number | null
          cr_case_info: string | null
          cr_case_status: string | null
          cr_disposition: string | null
          cr_filed_date: string | null
          cr_offense: string | null
          cr_severity: string | null
          created_at: string
          data: Json | null
          id: number
        }
        Insert: {
          background_person_search_id?: number | null
          cr_case_info?: string | null
          cr_case_status?: string | null
          cr_disposition?: string | null
          cr_filed_date?: string | null
          cr_offense?: string | null
          cr_severity?: string | null
          created_at?: string
          data?: Json | null
          id?: number
        }
        Update: {
          background_person_search_id?: number | null
          cr_case_info?: string | null
          cr_case_status?: string | null
          cr_disposition?: string | null
          cr_filed_date?: string | null
          cr_offense?: string | null
          cr_severity?: string | null
          created_at?: string
          data?: Json | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "background_person_search_crimi_background_person_search_id_fkey"
            columns: ["background_person_search_id"]
            isOneToOne: false
            referencedRelation: "background_person_search"
            referencedColumns: ["id"]
          },
        ]
      }
      background_person_search_lien: {
        Row: {
          amount: string | null
          background_person_search_id: number | null
          created_at: string
          creditor_name: string | null
          data: Json | null
          debtor_name: string | null
          file_date: string | null
          filing_county: string | null
          filing_state: string | null
          filing_type: string | null
          id: number
        }
        Insert: {
          amount?: string | null
          background_person_search_id?: number | null
          created_at?: string
          creditor_name?: string | null
          data?: Json | null
          debtor_name?: string | null
          file_date?: string | null
          filing_county?: string | null
          filing_state?: string | null
          filing_type?: string | null
          id?: number
        }
        Update: {
          amount?: string | null
          background_person_search_id?: number | null
          created_at?: string
          creditor_name?: string | null
          data?: Json | null
          debtor_name?: string | null
          file_date?: string | null
          filing_county?: string | null
          filing_state?: string | null
          filing_type?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "background_people_search_lien_background_people_search_id_fkey"
            columns: ["background_person_search_id"]
            isOneToOne: false
            referencedRelation: "background_person_search"
            referencedColumns: ["id"]
          },
        ]
      }
      background_person_search_litigation: {
        Row: {
          background_person_search_id: number | null
          created_at: string
          data: Json | null
          id: number
          lit_case_number: string | null
          lit_case_type: string | null
          lit_disposition_date: string | null
          lit_filing_date: string | null
          lit_judgement_amount: string | null
          lit_status: string | null
        }
        Insert: {
          background_person_search_id?: number | null
          created_at?: string
          data?: Json | null
          id?: number
          lit_case_number?: string | null
          lit_case_type?: string | null
          lit_disposition_date?: string | null
          lit_filing_date?: string | null
          lit_judgement_amount?: string | null
          lit_status?: string | null
        }
        Update: {
          background_person_search_id?: number | null
          created_at?: string
          data?: Json | null
          id?: number
          lit_case_number?: string | null
          lit_case_type?: string | null
          lit_disposition_date?: string | null
          lit_filing_date?: string | null
          lit_judgement_amount?: string | null
          lit_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "background_person_search_litig_background_person_search_id_fkey"
            columns: ["background_person_search_id"]
            isOneToOne: false
            referencedRelation: "background_person_search"
            referencedColumns: ["id"]
          },
        ]
      }
      background_person_search_quick_analysis: {
        Row: {
          background_person_search_id: number | null
          created_at: string
          id: number
          record_details: Json | null
        }
        Insert: {
          background_person_search_id?: number | null
          created_at?: string
          id?: number
          record_details?: Json | null
        }
        Update: {
          background_person_search_id?: number | null
          created_at?: string
          id?: number
          record_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "background_person_search_quick_background_person_search_id_fkey"
            columns: ["background_person_search_id"]
            isOneToOne: false
            referencedRelation: "background_person_search"
            referencedColumns: ["id"]
          },
        ]
      }
      background_person_search_ucc: {
        Row: {
          background_person_search_id: number | null
          collateral_summary: string | null
          created_at: string
          data: Json | null
          debtor_name: string | null
          filing_date: string | null
          filing_number: string | null
          filing_type: string | null
          id: number
          secured_party: string | null
        }
        Insert: {
          background_person_search_id?: number | null
          collateral_summary?: string | null
          created_at?: string
          data?: Json | null
          debtor_name?: string | null
          filing_date?: string | null
          filing_number?: string | null
          filing_type?: string | null
          id?: number
          secured_party?: string | null
        }
        Update: {
          background_person_search_id?: number | null
          collateral_summary?: string | null
          created_at?: string
          data?: Json | null
          debtor_name?: string | null
          filing_date?: string | null
          filing_number?: string | null
          filing_type?: string | null
          id?: number
          secured_party?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "background_people_search_ucc_background_people_search_id_fkey"
            columns: ["background_person_search_id"]
            isOneToOne: false
            referencedRelation: "background_person_search"
            referencedColumns: ["id"]
          },
        ]
      }
      background_report_applications: {
        Row: {
          application_id: string
          background_report_id: string
          created_at: string
          id: number
        }
        Insert: {
          application_id: string
          background_report_id: string
          created_at?: string
          id?: number
        }
        Update: {
          application_id?: string
          background_report_id?: string
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "background_report_applications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "background_report_applications_background_report_id_fkey"
            columns: ["background_report_id"]
            isOneToOne: false
            referencedRelation: "background_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      background_reports: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          borrower_id: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          id: string
          organization_id: string
          type: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          borrower_id?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          id?: string
          organization_id: string
          type: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          borrower_id?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          id?: string
          organization_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_reports_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_reports_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_reports_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          archived_at: string | null
          archived_by: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
      credit_report_data_links: {
        Row: {
          aggregator: string
          aggregator_data_id: string
          created_at: string
          credit_report_id: string
          id: number
        }
        Insert: {
          aggregator?: string
          aggregator_data_id: string
          created_at?: string
          credit_report_id: string
          id?: number
        }
        Update: {
          aggregator?: string
          aggregator_data_id?: string
          created_at?: string
          credit_report_id?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_report_data_links_credit_report_id_fkey"
            columns: ["credit_report_id"]
            isOneToOne: false
            referencedRelation: "credit_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_report_data_xactus: {
        Row: {
          aggregator: string | null
          borrower_id: string | null
          cleaned_data: Json | null
          created_at: string
          credit_report_id: string | null
          date_ordered: string | null
          equifax_score: number | null
          experian_score: number | null
          guarantor_id: number | null
          id: string
          inquiries: Json
          liabilities: Json
          mid_score: number | null
          organization_id: string | null
          public_records: Json
          pull_type: string | null
          report_date: string | null
          report_id: string | null
          tradelines: Json
          transunion_score: number | null
          uploaded_by: string | null
        }
        Insert: {
          aggregator?: string | null
          borrower_id?: string | null
          cleaned_data?: Json | null
          created_at?: string
          credit_report_id?: string | null
          date_ordered?: string | null
          equifax_score?: number | null
          experian_score?: number | null
          guarantor_id?: number | null
          id?: string
          inquiries?: Json
          liabilities?: Json
          mid_score?: number | null
          organization_id?: string | null
          public_records?: Json
          pull_type?: string | null
          report_date?: string | null
          report_id?: string | null
          tradelines?: Json
          transunion_score?: number | null
          uploaded_by?: string | null
        }
        Update: {
          aggregator?: string | null
          borrower_id?: string | null
          cleaned_data?: Json | null
          created_at?: string
          credit_report_id?: string | null
          date_ordered?: string | null
          equifax_score?: number | null
          experian_score?: number | null
          guarantor_id?: number | null
          id?: string
          inquiries?: Json
          liabilities?: Json
          mid_score?: number | null
          organization_id?: string | null
          public_records?: Json
          pull_type?: string | null
          report_date?: string | null
          report_id?: string | null
          tradelines?: Json
          transunion_score?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_report_data_xactus_credit_report_id_fkey"
            columns: ["credit_report_id"]
            isOneToOne: false
            referencedRelation: "credit_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_report_data_xactus_guarantor_id_fkey"
            columns: ["guarantor_id"]
            isOneToOne: false
            referencedRelation: "guarantor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_report_data_xactus_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          archived_at: string | null
          archived_by: string | null
          assigned_to: string[]
          borrower_id: string | null
          created_at: string
          data: Json | null
          equifax_score: number | null
          experian_score: number | null
          id: string
          mid_score: number | null
          organization_id: string | null
          pull_type: string | null
          report_date: string | null
          report_id: string | null
          status: string | null
          transunion_score: number | null
        }
        Insert: {
          aggregator?: string | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_to: string[]
          borrower_id?: string | null
          created_at?: string
          data?: Json | null
          equifax_score?: number | null
          experian_score?: number | null
          id?: string
          mid_score?: number | null
          organization_id?: string | null
          pull_type?: string | null
          report_date?: string | null
          report_id?: string | null
          status?: string | null
          transunion_score?: number | null
        }
        Update: {
          aggregator?: string | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_to?: string[]
          borrower_id?: string | null
          created_at?: string
          data?: Json | null
          equifax_score?: number | null
          experian_score?: number | null
          id?: string
          mid_score?: number | null
          organization_id?: string | null
          pull_type?: string | null
          report_date?: string | null
          report_id?: string | null
          status?: string | null
          transunion_score?: number | null
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
          broker_org_id: string
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
          broker_org_id: string
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
          broker_org_id?: string
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
            foreignKeyName: "custom_broker_settings_broker_org_fk"
            columns: ["broker_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      deal_borrower: {
        Row: {
          deal_entity_id: number
          deal_guarantor_ids: number[] | null
          deal_id: string
          id: number
          vesting_type: string | null
        }
        Insert: {
          deal_entity_id: number
          deal_guarantor_ids?: number[] | null
          deal_id: string
          id?: never
          vesting_type?: string | null
        }
        Update: {
          deal_entity_id?: number
          deal_guarantor_ids?: number[] | null
          deal_id?: string
          id?: never
          vesting_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_borrower_deal_entity_id_fkey"
            columns: ["deal_entity_id"]
            isOneToOne: false
            referencedRelation: "deal_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_borrower_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_calendar_events: {
        Row: {
          all_day: boolean | null
          created_at: string
          deal_id: string | null
          deal_input_id: number | null
          etiquette: string | null
          event_date: string
          event_description: string | null
          event_time: string | null
          event_title: string | null
          id: number
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string
          deal_id?: string | null
          deal_input_id?: number | null
          etiquette?: string | null
          event_date: string
          event_description?: string | null
          event_time?: string | null
          event_title?: string | null
          id?: number
        }
        Update: {
          all_day?: boolean | null
          created_at?: string
          deal_id?: string | null
          deal_input_id?: number | null
          etiquette?: string | null
          event_date?: string
          event_description?: string | null
          event_time?: string | null
          event_title?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_calendar_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_calendar_events_deal_input_id_fkey"
            columns: ["deal_input_id"]
            isOneToOne: false
            referencedRelation: "inputs"
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
      deal_comment_mentions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          mentioned_user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          mentioned_user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          mentioned_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "deal_comments"
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
      deal_document_ai_chat: {
        Row: {
          citations: Json | null
          created_at: string
          deal_document_id: number | null
          id: number
          message: string | null
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          citations?: Json | null
          created_at?: string
          deal_document_id?: number | null
          id?: number
          message?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          citations?: Json | null
          created_at?: string
          deal_document_id?: number | null
          id?: number
          message?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_document_ai_chat_deal_document_id_fkey"
            columns: ["deal_document_id"]
            isOneToOne: false
            referencedRelation: "deal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_document_ai_condition: {
        Row: {
          ai_value: boolean | null
          approved_value: boolean | null
          created_at: string
          deal_document_id: number | null
          document_type_ai_condition: number | null
          id: number
          rejected: boolean | null
          response: Json | null
          user_id: string | null
        }
        Insert: {
          ai_value?: boolean | null
          approved_value?: boolean | null
          created_at?: string
          deal_document_id?: number | null
          document_type_ai_condition?: number | null
          id?: number
          rejected?: boolean | null
          response?: Json | null
          user_id?: string | null
        }
        Update: {
          ai_value?: boolean | null
          approved_value?: boolean | null
          created_at?: string
          deal_document_id?: number | null
          document_type_ai_condition?: number | null
          id?: number
          rejected?: boolean | null
          response?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_document_ai_condition_deal_document_id_fkey"
            columns: ["deal_document_id"]
            isOneToOne: false
            referencedRelation: "deal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_document_ai_condition_document_type_ai_condition_fkey"
            columns: ["document_type_ai_condition"]
            isOneToOne: false
            referencedRelation: "document_type_ai_condition"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_document_ai_input: {
        Row: {
          ai_value: string | null
          approved_value: string | null
          created_at: string
          deal_document_id: number | null
          document_type_ai_input_id: number | null
          id: number
          rejected: boolean | null
          response: Json | null
          user_id: string | null
        }
        Insert: {
          ai_value?: string | null
          approved_value?: string | null
          created_at?: string
          deal_document_id?: number | null
          document_type_ai_input_id?: number | null
          id?: number
          rejected?: boolean | null
          response?: Json | null
          user_id?: string | null
        }
        Update: {
          ai_value?: string | null
          approved_value?: string | null
          created_at?: string
          deal_document_id?: number | null
          document_type_ai_input_id?: number | null
          id?: number
          rejected?: boolean | null
          response?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_document_ai_input_deal_document_id_fkey"
            columns: ["deal_document_id"]
            isOneToOne: false
            referencedRelation: "deal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_document_ai_input_document_type_ai_input_id_fkey"
            columns: ["document_type_ai_input_id"]
            isOneToOne: false
            referencedRelation: "document_type_ai_input"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_document_overrides: {
        Row: {
          created_at: string
          deal_id: string
          document_type_id: number
          id: number
          is_required_override: boolean | null
          is_visible_override: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          document_type_id: number
          id?: number
          is_required_override?: boolean | null
          is_visible_override?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          document_type_id?: number
          id?: number
          is_required_override?: boolean | null
          is_visible_override?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_document_overrides_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_document_overrides_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_documents: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          deal_id: string
          document_file_id: number | null
          document_type_id: number | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: number
          notes: string | null
          storage_path: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          deal_id: string
          document_file_id?: number | null
          document_type_id?: number | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: number
          notes?: string | null
          storage_path?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          deal_id?: string
          document_file_id?: number | null
          document_type_id?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: number
          notes?: string | null
          storage_path?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_documents_document_file_id_fkey"
            columns: ["document_file_id"]
            isOneToOne: false
            referencedRelation: "document_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_entity: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          county: string | null
          created_at: string
          date_formed: string | null
          deal_id: string | null
          ein: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: number
          members: number | null
          state: string | null
          state_formed: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          date_formed?: string | null
          deal_id?: string | null
          ein?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: number
          members?: number | null
          state?: string | null
          state_formed?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          date_formed?: string | null
          deal_id?: string | null
          ein?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: number
          members?: number | null
          state?: string | null
          state_formed?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_entity_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_entity_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_entity_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_entity_owners: {
        Row: {
          address: string | null
          borrower_id: string | null
          created_at: string
          deal_id: string | null
          ein: string | null
          entity_id: string | null
          entity_owner_id: string | null
          id: number
          member_type: string | null
          name: string | null
          ownership_percent: number | null
          ssn_encrypted: string | null
          ssn_last4: string | null
          title: string | null
        }
        Insert: {
          address?: string | null
          borrower_id?: string | null
          created_at?: string
          deal_id?: string | null
          ein?: string | null
          entity_id?: string | null
          entity_owner_id?: string | null
          id?: number
          member_type?: string | null
          name?: string | null
          ownership_percent?: number | null
          ssn_encrypted?: string | null
          ssn_last4?: string | null
          title?: string | null
        }
        Update: {
          address?: string | null
          borrower_id?: string | null
          created_at?: string
          deal_id?: string | null
          ein?: string | null
          entity_id?: string | null
          entity_owner_id?: string | null
          id?: number
          member_type?: string | null
          name?: string | null
          ownership_percent?: number | null
          ssn_encrypted?: string | null
          ssn_last4?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_entity_owners_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_entity_owners_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_entity_owners_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_entity_owners_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_entity_owners_entity_owner_id_fkey"
            columns: ["entity_owner_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_entity_owners_entity_owner_id_fkey"
            columns: ["entity_owner_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
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
      deal_inputs: {
        Row: {
          created_at: string
          deal_id: string | null
          id: number
          input_id: number | null
          input_type: string | null
          linked_record_id: string | null
          value_array: Json | null
          value_bool: boolean | null
          value_date: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: number
          input_id?: number | null
          input_type?: string | null
          linked_record_id?: string | null
          value_array?: Json | null
          value_bool?: boolean | null
          value_date?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: number
          input_id?: number | null
          input_type?: string | null
          linked_record_id?: string | null
          value_array?: Json | null
          value_bool?: boolean | null
          value_date?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_inputs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_inputs_input_id_fkey"
            columns: ["input_id"]
            isOneToOne: false
            referencedRelation: "inputs"
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
          deal_id: string
          deal_role_types_id: number
          entities_id: string | null
          guarantor_id: number | null
          id: number
          notes: string | null
          users_id: number | null
        }
        Insert: {
          contact_id?: number | null
          created_at?: string | null
          deal_id: string
          deal_role_types_id: number
          entities_id?: string | null
          guarantor_id?: number | null
          id?: number
          notes?: string | null
          users_id?: number | null
        }
        Update: {
          contact_id?: number | null
          created_at?: string | null
          deal_id?: string
          deal_role_types_id?: number
          entities_id?: string | null
          guarantor_id?: number | null
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
            foreignKeyName: "deal_roles_entities_id_fkey"
            columns: ["entities_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_roles_entities_id_fkey"
            columns: ["entities_id"]
            isOneToOne: false
            referencedRelation: "entities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_roles_guarantor_id_fkey"
            columns: ["guarantor_id"]
            isOneToOne: false
            referencedRelation: "guarantor"
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
      deal_signature_requests: {
        Row: {
          created_at: string
          created_by_user_id: string
          deal_id: string
          documenso_document_id: string
          document_name: string
          id: string
          organization_id: string
          recipients: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          deal_id: string
          documenso_document_id: string
          document_name: string
          id?: string
          organization_id: string
          recipients?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          deal_id?: string
          documenso_document_id?: string
          document_name?: string
          id?: string
          organization_id?: string
          recipients?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_signature_requests_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_signature_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stages: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          code: string
          color: string | null
          created_at: string
          display_order: number | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string
          uuid: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          code: string
          color?: string | null
          created_at?: string
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          code?: string
          color?: string | null
          created_at?: string
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string
          uuid?: string
        }
        Relationships: []
      }
      deal_stepper: {
        Row: {
          created_at: string
          current_step: string
          deal_id: string
          id: number
          input_stepper_id: number
          step_order: string[]
        }
        Insert: {
          created_at?: string
          current_step: string
          deal_id: string
          id?: number
          input_stepper_id: number
          step_order: string[]
        }
        Update: {
          created_at?: string
          current_step?: string
          deal_id?: string
          id?: number
          input_stepper_id?: number
          step_order?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "deal_stepper_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stepper_input_stepper_id_fkey"
            columns: ["input_stepper_id"]
            isOneToOne: false
            referencedRelation: "input_stepper"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_task_events: {
        Row: {
          created_at: string
          deal_task_id: number
          event_type: string
          id: number
          new_value: string | null
          old_value: string | null
          performed_by: string | null
        }
        Insert: {
          created_at?: string
          deal_task_id: number
          event_type: string
          id?: number
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Update: {
          created_at?: string
          deal_task_id?: number
          event_type?: string
          id?: number
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_task_events_deal_task_id_fkey"
            columns: ["deal_task_id"]
            isOneToOne: false
            referencedRelation: "deal_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_tasks: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          assigned_to_user_ids: Json | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          deal_stage_id: number | null
          description: string | null
          display_order: number | null
          due_date_at: string | null
          id: number
          organization_id: string | null
          started_at: string | null
          task_priority_id: number | null
          task_status_id: number | null
          task_template_id: number | null
          title: string
          updated_at: string
          uuid: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          assigned_to_user_ids?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          deal_stage_id?: number | null
          description?: string | null
          display_order?: number | null
          due_date_at?: string | null
          id?: number
          organization_id?: string | null
          started_at?: string | null
          task_priority_id?: number | null
          task_status_id?: number | null
          task_template_id?: number | null
          title: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          assigned_to_user_ids?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          deal_stage_id?: number | null
          description?: string | null
          display_order?: number | null
          due_date_at?: string | null
          id?: number
          organization_id?: string | null
          started_at?: string | null
          task_priority_id?: number | null
          task_status_id?: number | null
          task_template_id?: number | null
          title?: string
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tasks_deal_stage_id_fkey"
            columns: ["deal_stage_id"]
            isOneToOne: false
            referencedRelation: "deal_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tasks_task_priority_id_fkey"
            columns: ["task_priority_id"]
            isOneToOne: false
            referencedRelation: "task_priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tasks_task_status_id_fkey"
            columns: ["task_status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tasks_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_users: {
        Row: {
          created_at: string
          deal_id: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_users_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          assigned_to_user_id: Json | null
          created_at: string
          id: string
          organization_id: string
          primary_user_id: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          assigned_to_user_id?: Json | null
          created_at?: string
          id?: string
          organization_id: string
          primary_user_id?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          assigned_to_user_id?: Json | null
          created_at?: string
          id?: string
          organization_id?: string
          primary_user_id?: string | null
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
          archived_at: string | null
          archived_by: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
      document_files_background_reports: {
        Row: {
          background_report_id: string | null
          created_at: string
          created_by: string | null
          document_file_id: number | null
          id: number
        }
        Insert: {
          background_report_id?: string | null
          created_at?: string
          created_by?: string | null
          document_file_id?: number | null
          id?: number
        }
        Update: {
          background_report_id?: string | null
          created_at?: string
          created_by?: string | null
          document_file_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_files_background_reports_background_report_id_fkey"
            columns: ["background_report_id"]
            isOneToOne: false
            referencedRelation: "background_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_background_reports_document_file_id_fkey"
            columns: ["document_file_id"]
            isOneToOne: false
            referencedRelation: "document_files"
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
      document_files_credit_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          credit_report_id: string
          document_file_id: number
          id: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credit_report_id: string
          document_file_id: number
          id?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credit_report_id?: string
          document_file_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_files_credit_reports_cr_fkey"
            columns: ["credit_report_id"]
            isOneToOne: false
            referencedRelation: "credit_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_credit_reports_doc_fkey"
            columns: ["document_file_id"]
            isOneToOne: false
            referencedRelation: "document_files"
            referencedColumns: ["id"]
          },
        ]
      }
      document_files_deals: {
        Row: {
          created_at: string
          deal_id: string
          document_file_id: number
          id: number
          source_pk: number
          source_table: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          document_file_id: number
          id?: number
          source_pk: number
          source_table?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          document_file_id?: number
          id?: number
          source_pk?: number
          source_table?: string
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
      document_logic: {
        Row: {
          created_at: string
          id: number
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          type?: string | null
        }
        Relationships: []
      }
      document_logic_actions: {
        Row: {
          created_at: string
          document_logic_id: number | null
          document_type_id: number | null
          id: number
          value_required: boolean | null
          value_type: string | null
          value_visible: boolean | null
        }
        Insert: {
          created_at?: string
          document_logic_id?: number | null
          document_type_id?: number | null
          id?: number
          value_required?: boolean | null
          value_type?: string | null
          value_visible?: boolean | null
        }
        Update: {
          created_at?: string
          document_logic_id?: number | null
          document_type_id?: number | null
          id?: number
          value_required?: boolean | null
          value_type?: string | null
          value_visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "document_logic_actions_document_logic_id_fkey"
            columns: ["document_logic_id"]
            isOneToOne: false
            referencedRelation: "document_logic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_logic_actions_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      document_logic_conditions: {
        Row: {
          created_at: string
          document_logic_id: number | null
          field: number | null
          id: number
          operator: string | null
          value: string | null
          value_expression: string | null
          value_field: number | null
          value_type: string | null
        }
        Insert: {
          created_at?: string
          document_logic_id?: number | null
          field?: number | null
          id?: number
          operator?: string | null
          value?: string | null
          value_expression?: string | null
          value_field?: number | null
          value_type?: string | null
        }
        Update: {
          created_at?: string
          document_logic_id?: number | null
          field?: number | null
          id?: number
          operator?: string | null
          value?: string | null
          value_expression?: string | null
          value_field?: number | null
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_logic_conditions_document_logic_id_fkey"
            columns: ["document_logic_id"]
            isOneToOne: false
            referencedRelation: "document_logic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_logic_conditions_field_fkey"
            columns: ["field"]
            isOneToOne: false
            referencedRelation: "inputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_logic_conditions_value_field_fkey"
            columns: ["value_field"]
            isOneToOne: false
            referencedRelation: "inputs"
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
      document_template_variables: {
        Row: {
          created_at: string
          id: string
          name: string
          path: string | null
          position: number
          template_id: string
          updated_at: string
          variable_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          path?: string | null
          position?: number
          template_id: string
          updated_at?: string
          variable_type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          path?: string | null
          position?: number
          template_id?: string
          updated_at?: string
          variable_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_template_variables_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          archived_at: string | null
          archived_by: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
      document_type_ai_condition: {
        Row: {
          ai_prompt: string | null
          condition_label: string | null
          created_at: string
          document_type: number | null
          id: number
        }
        Insert: {
          ai_prompt?: string | null
          condition_label?: string | null
          created_at?: string
          document_type?: number | null
          id?: number
        }
        Update: {
          ai_prompt?: string | null
          condition_label?: string | null
          created_at?: string
          document_type?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_type_ai_condition_document_type_fkey"
            columns: ["document_type"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      document_type_ai_input: {
        Row: {
          ai_prompt: string | null
          created_at: string
          document_type_id: number | null
          id: number
          input_id: number | null
        }
        Insert: {
          ai_prompt?: string | null
          created_at?: string
          document_type_id?: number | null
          id?: number
          input_id?: number | null
        }
        Update: {
          ai_prompt?: string | null
          created_at?: string
          document_type_id?: number | null
          id?: number
          input_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_type_ai_input_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_type_ai_input_input_id_fkey"
            columns: ["input_id"]
            isOneToOne: false
            referencedRelation: "inputs"
            referencedColumns: ["id"]
          },
        ]
      }
      document_type_ai_input_order: {
        Row: {
          created_at: string
          display_order: number
          document_type_ai_input_id: number | null
          id: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          document_type_ai_input_id?: number | null
          id?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          document_type_ai_input_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_type_ai_input_order_document_type_ai_input_id_fkey"
            columns: ["document_type_ai_input_id"]
            isOneToOne: false
            referencedRelation: "document_type_ai_input"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          display_order: number | null
          document_category_id: number | null
          document_description: string | null
          document_name: string | null
          id: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          display_order?: number | null
          document_category_id?: number | null
          document_description?: string | null
          document_name?: string | null
          id?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          display_order?: number | null
          document_category_id?: number | null
          document_description?: string | null
          document_name?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_types_document_category_id_fkey"
            columns: ["document_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          editor_json: Json
          email_output_html: string | null
          email_output_text: string | null
          from_address: string | null
          id: number
          liveblocks_room_id: string | null
          name: string
          organization_id: string
          preview_text: string
          published_at: string | null
          reply_to: string | null
          schema_version: number
          status: string
          styles: Json
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          editor_json?: Json
          email_output_html?: string | null
          email_output_text?: string | null
          from_address?: string | null
          id?: number
          liveblocks_room_id?: string | null
          name?: string
          organization_id: string
          preview_text?: string
          published_at?: string | null
          reply_to?: string | null
          schema_version?: number
          status?: string
          styles?: Json
          subject?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          editor_json?: Json
          email_output_html?: string | null
          email_output_text?: string | null
          from_address?: string | null
          id?: number
          liveblocks_room_id?: string | null
          name?: string
          organization_id?: string
          preview_text?: string
          published_at?: string | null
          reply_to?: string | null
          schema_version?: number
          status?: string
          styles?: Json
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          archived_at: string | null
          archived_by: string | null
          assigned_to: string[]
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
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_to?: string[]
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
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_to?: string[]
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
          archived_at: string | null
          archived_by: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
      input_categories: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          category: string | null
          created_at: string
          display_order: number
          id: number
          organization_id: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          category?: string | null
          created_at?: string
          display_order?: number
          id?: number
          organization_id?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          category?: string | null
          created_at?: string
          display_order?: number
          id?: number
          organization_id?: string | null
        }
        Relationships: []
      }
      input_logic: {
        Row: {
          created_at: string
          id: number
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          type?: string | null
        }
        Relationships: []
      }
      input_logic_actions: {
        Row: {
          created_at: string
          id: number
          input_id: number | null
          input_logic_id: number | null
          value_expression: string | null
          value_field: number | null
          value_required: boolean | null
          value_text: string | null
          value_type: string | null
          value_visible: boolean | null
        }
        Insert: {
          created_at?: string
          id?: number
          input_id?: number | null
          input_logic_id?: number | null
          value_expression?: string | null
          value_field?: number | null
          value_required?: boolean | null
          value_text?: string | null
          value_type?: string | null
          value_visible?: boolean | null
        }
        Update: {
          created_at?: string
          id?: number
          input_id?: number | null
          input_logic_id?: number | null
          value_expression?: string | null
          value_field?: number | null
          value_required?: boolean | null
          value_text?: string | null
          value_type?: string | null
          value_visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "input_logic_actions_input_id_fkey"
            columns: ["input_id"]
            isOneToOne: false
            referencedRelation: "inputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "input_logic_actions_input_logic_id_fkey"
            columns: ["input_logic_id"]
            isOneToOne: false
            referencedRelation: "input_logic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "input_logic_actions_value_field_fkey"
            columns: ["value_field"]
            isOneToOne: false
            referencedRelation: "inputs"
            referencedColumns: ["id"]
          },
        ]
      }
      input_logic_conditions: {
        Row: {
          created_at: string
          field: number | null
          id: number
          input_logic_id: number | null
          operator: string | null
          value: string | null
          value_expression: string | null
          value_field: number | null
          value_type: string | null
        }
        Insert: {
          created_at?: string
          field?: number | null
          id?: number
          input_logic_id?: number | null
          operator?: string | null
          value?: string | null
          value_expression?: string | null
          value_field?: number | null
          value_type?: string | null
        }
        Update: {
          created_at?: string
          field?: number | null
          id?: number
          input_logic_id?: number | null
          operator?: string | null
          value?: string | null
          value_expression?: string | null
          value_field?: number | null
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "input_logic_conditions_field_fkey"
            columns: ["field"]
            isOneToOne: false
            referencedRelation: "inputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "input_logic_conditions_input_logic_id_fkey"
            columns: ["input_logic_id"]
            isOneToOne: false
            referencedRelation: "input_logic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "input_logic_conditions_value_field_fkey"
            columns: ["value_field"]
            isOneToOne: false
            referencedRelation: "inputs"
            referencedColumns: ["id"]
          },
        ]
      }
      input_stepper: {
        Row: {
          created_at: string
          id: number
          input_id: number | null
          step_order: string[] | null
        }
        Insert: {
          created_at?: string
          id?: number
          input_id?: number | null
          step_order?: string[] | null
        }
        Update: {
          created_at?: string
          id?: number
          input_id?: number | null
          step_order?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "input_stepper_input_id_fkey"
            columns: ["input_id"]
            isOneToOne: false
            referencedRelation: "inputs"
            referencedColumns: ["id"]
          },
        ]
      }
      inputs: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          category: string | null
          category_id: number | null
          config: Json | null
          created_at: string
          display_order: number
          dropdown_options: Json | null
          id: number
          input_code: string
          input_label: string | null
          input_type: string | null
          linked_column: string | null
          linked_table: string | null
          starred: boolean
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          category?: string | null
          category_id?: number | null
          config?: Json | null
          created_at?: string
          display_order?: number
          dropdown_options?: Json | null
          id?: number
          input_code: string
          input_label?: string | null
          input_type?: string | null
          linked_column?: string | null
          linked_table?: string | null
          starred?: boolean
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          category?: string | null
          category_id?: number | null
          config?: Json | null
          created_at?: string
          display_order?: number
          dropdown_options?: Json | null
          id?: number
          input_code?: string
          input_label?: string | null
          input_type?: string | null
          linked_column?: string | null
          linked_table?: string | null
          starred?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "inputs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "input_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon_url: string | null
          id: number
          level_global: boolean
          level_individual: boolean
          level_org: boolean
          name: string
          slug: string
          tags: Json
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: never
          level_global?: boolean
          level_individual?: boolean
          level_org?: boolean
          name: string
          slug: string
          tags?: Json
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: never
          level_global?: boolean
          level_individual?: boolean
          level_org?: boolean
          name?: string
          slug?: string
          tags?: Json
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_setup: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          config: Json
          created_at: string
          id: string
          integration_settings_id: number | null
          name: string | null
          organization_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          config?: Json
          created_at?: string
          id?: string
          integration_settings_id?: number | null
          name?: string | null
          organization_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          config?: Json
          created_at?: string
          id?: string
          integration_settings_id?: number | null
          name?: string | null
          organization_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_setup_integration_settings_id_fkey"
            columns: ["integration_settings_id"]
            isOneToOne: false
            referencedRelation: "integration_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_setup_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      llama_document_chunks_vs: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      llama_document_parsed: {
        Row: {
          created_at: string
          document_id: number | null
          id: number
          llama_id: string | null
          llama_project_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          document_id?: number | null
          id?: number
          llama_id?: string | null
          llama_project_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          document_id?: number | null
          id?: number
          llama_id?: string | null
          llama_project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_parsed_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_files"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_scenarios: {
        Row: {
          archived_at: string | null
          archived_by: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at: string | null
          archived_by: string | null
          assigned_to_user_id: Json | null
          created_at: string
          display_id: string
          id: string
          organization_id: string
          primary_user_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          assigned_to_user_id?: Json | null
          created_at?: string
          display_id: string
          id?: string
          organization_id: string
          primary_user_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          assigned_to_user_id?: Json | null
          created_at?: string
          display_id?: string
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
      organization_account_managers: {
        Row: {
          account_manager_id: string
          created_at: string
          id: string
          organization_id: string
        }
        Insert: {
          account_manager_id: string
          created_at?: string
          id?: string
          organization_id: string
        }
        Update: {
          account_manager_id?: string
          created_at?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_account_managers_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_account_managers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_member_roles: {
        Row: {
          archived_at: string | null
          archived_by: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at: string | null
          archived_by: string | null
          compiled_config: Json
          created_at: string
          created_by_clerk_sub: string | null
          created_by_user_id: number | null
          definition_json: Json
          effect: string
          id: string
          is_active: boolean
          is_protected_policy: boolean
          org_id: string | null
          resource_name: string
          resource_type: string
          scope: string
          version: number
        }
        Insert: {
          action: string
          archived_at?: string | null
          archived_by?: string | null
          compiled_config: Json
          created_at?: string
          created_by_clerk_sub?: string | null
          created_by_user_id?: number | null
          definition_json: Json
          effect?: string
          id?: string
          is_active?: boolean
          is_protected_policy?: boolean
          org_id?: string | null
          resource_name?: string
          resource_type: string
          scope?: string
          version?: number
        }
        Update: {
          action?: string
          archived_at?: string | null
          archived_by?: string | null
          compiled_config?: Json
          created_at?: string
          created_by_clerk_sub?: string | null
          created_by_user_id?: number | null
          definition_json?: Json
          effect?: string
          id?: string
          is_active?: boolean
          is_protected_policy?: boolean
          org_id?: string | null
          resource_name?: string
          resource_type?: string
          scope?: string
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
      organization_policies_column_filters: {
        Row: {
          id: string
          is_excluded: boolean
          join_path: string | null
          named_scopes: string[]
          notes: string | null
          org_column: string | null
          schema_name: string
          table_name: string
          user_column: string | null
          user_column_type: string
        }
        Insert: {
          id?: string
          is_excluded?: boolean
          join_path?: string | null
          named_scopes?: string[]
          notes?: string | null
          org_column?: string | null
          schema_name?: string
          table_name: string
          user_column?: string | null
          user_column_type?: string
        }
        Update: {
          id?: string
          is_excluded?: boolean
          join_path?: string | null
          named_scopes?: string[]
          notes?: string | null
          org_column?: string | null
          schema_name?: string
          table_name?: string
          user_column?: string | null
          user_column_type?: string
        }
        Relationships: []
      }
      organization_policy_named_scope_tables: {
        Row: {
          fk_column: string
          notes: string | null
          scope_name: string
          table_name: string
        }
        Insert: {
          fk_column: string
          notes?: string | null
          scope_name: string
          table_name: string
        }
        Update: {
          fk_column?: string
          notes?: string | null
          scope_name?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_policy_named_scope_tables_scope_name_fkey"
            columns: ["scope_name"]
            isOneToOne: false
            referencedRelation: "organization_policy_named_scopes"
            referencedColumns: ["name"]
          },
        ]
      }
      organization_policy_named_scopes: {
        Row: {
          created_at: string
          description: string | null
          label: string
          name: string
          precomputed_pk_col: string | null
          precomputed_table: string | null
          precomputed_user_col: string | null
          uses_precomputed: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          label: string
          name: string
          precomputed_pk_col?: string | null
          precomputed_table?: string | null
          precomputed_user_col?: string | null
          uses_precomputed?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          label?: string
          name?: string
          precomputed_pk_col?: string | null
          precomputed_table?: string | null
          precomputed_user_col?: string | null
          uses_precomputed?: boolean
        }
        Relationships: []
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
          whitelabel_logo_dark_url: string | null
          whitelabel_logo_light_url: string | null
          whitelabel_logo_url: string | null
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
          whitelabel_logo_dark_url?: string | null
          whitelabel_logo_light_url?: string | null
          whitelabel_logo_url?: string | null
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
          whitelabel_logo_dark_url?: string | null
          whitelabel_logo_light_url?: string | null
          whitelabel_logo_url?: string | null
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
      pricing_engine_input_categories: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          category: string | null
          created_at: string
          display_order: number
          id: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          category?: string | null
          created_at?: string
          display_order?: number
          id?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          category?: string | null
          created_at?: string
          display_order?: number
          id?: number
        }
        Relationships: []
      }
      pricing_engine_inputs: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          category: string | null
          category_id: number | null
          config: Json | null
          created_at: string
          display_order: number
          dropdown_options: Json | null
          id: number
          input_code: string
          input_label: string | null
          input_type: string | null
          linked_column: string | null
          linked_table: string | null
          starred: boolean
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          category?: string | null
          category_id?: number | null
          config?: Json | null
          created_at?: string
          display_order?: number
          dropdown_options?: Json | null
          id?: number
          input_code: string
          input_label?: string | null
          input_type?: string | null
          linked_column?: string | null
          linked_table?: string | null
          starred?: boolean
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          category?: string | null
          category_id?: number | null
          config?: Json | null
          created_at?: string
          display_order?: number
          dropdown_options?: Json | null
          id?: number
          input_code?: string
          input_label?: string | null
          input_type?: string | null
          linked_column?: string | null
          linked_table?: string | null
          starred?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pricing_engine_inputs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pricing_engine_input_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          archived_at: string | null
          archived_by: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
          archived_at?: string | null
          archived_by?: string | null
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
      role_assignments: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: number
          organization_id: string | null
          resource_id: string
          resource_type: string
          role_type_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: never
          organization_id?: string | null
          resource_id: string
          resource_type: string
          role_type_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: never
          organization_id?: string | null
          resource_id?: string
          resource_type?: string
          role_type_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_role_type_id_fkey"
            columns: ["role_type_id"]
            isOneToOne: false
            referencedRelation: "deal_role_types"
            referencedColumns: ["id"]
          },
        ]
      }
      task_logic: {
        Row: {
          created_at: string
          description: string | null
          execution_order: number | null
          id: number
          is_active: boolean | null
          name: string | null
          task_template_id: number
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          execution_order?: number | null
          id?: number
          is_active?: boolean | null
          name?: string | null
          task_template_id: number
          type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          execution_order?: number | null
          id?: number
          is_active?: boolean | null
          name?: string | null
          task_template_id?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_logic_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_logic_actions: {
        Row: {
          action_type: string
          id: number
          required_for_stage_id: number | null
          required_status_id: number | null
          target_task_template_id: number | null
          task_logic_id: number
          value_expression: string | null
          value_field: string | null
          value_required: boolean | null
          value_text: string | null
          value_type: string | null
          value_visible: boolean | null
        }
        Insert: {
          action_type: string
          id?: number
          required_for_stage_id?: number | null
          required_status_id?: number | null
          target_task_template_id?: number | null
          task_logic_id: number
          value_expression?: string | null
          value_field?: string | null
          value_required?: boolean | null
          value_text?: string | null
          value_type?: string | null
          value_visible?: boolean | null
        }
        Update: {
          action_type?: string
          id?: number
          required_for_stage_id?: number | null
          required_status_id?: number | null
          target_task_template_id?: number | null
          task_logic_id?: number
          value_expression?: string | null
          value_field?: string | null
          value_required?: boolean | null
          value_text?: string | null
          value_type?: string | null
          value_visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "task_logic_actions_required_for_stage_id_fkey"
            columns: ["required_for_stage_id"]
            isOneToOne: false
            referencedRelation: "deal_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_logic_actions_required_status_id_fkey"
            columns: ["required_status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_logic_actions_target_template_fkey"
            columns: ["target_task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_logic_actions_task_logic_id_fkey"
            columns: ["task_logic_id"]
            isOneToOne: false
            referencedRelation: "task_logic"
            referencedColumns: ["id"]
          },
        ]
      }
      task_logic_conditions: {
        Row: {
          db_column: string | null
          db_match_type: string | null
          db_table: string | null
          field: string | null
          id: number
          operator: string | null
          source_type: string
          sql_expression: string | null
          task_logic_id: number
          value: string | null
          value_expression: string | null
          value_field: string | null
          value_type: string | null
        }
        Insert: {
          db_column?: string | null
          db_match_type?: string | null
          db_table?: string | null
          field?: string | null
          id?: number
          operator?: string | null
          source_type?: string
          sql_expression?: string | null
          task_logic_id: number
          value?: string | null
          value_expression?: string | null
          value_field?: string | null
          value_type?: string | null
        }
        Update: {
          db_column?: string | null
          db_match_type?: string | null
          db_table?: string | null
          field?: string | null
          id?: number
          operator?: string | null
          source_type?: string
          sql_expression?: string | null
          task_logic_id?: number
          value?: string | null
          value_expression?: string | null
          value_field?: string | null
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_logic_conditions_task_logic_id_fkey"
            columns: ["task_logic_id"]
            isOneToOne: false
            referencedRelation: "task_logic"
            referencedColumns: ["id"]
          },
        ]
      }
      task_priorities: {
        Row: {
          code: string
          color: string | null
          created_at: string
          display_order: number | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string
          uuid: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string
          uuid?: string
        }
        Relationships: []
      }
      task_statuses: {
        Row: {
          code: string
          color: string | null
          created_at: string
          display_order: number | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string
          uuid: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string
          uuid?: string
        }
        Relationships: []
      }
      task_template_roles: {
        Row: {
          created_at: string
          deal_role_type_id: number
          id: number
          task_template_id: number
        }
        Insert: {
          created_at?: string
          deal_role_type_id: number
          id?: never
          task_template_id: number
        }
        Update: {
          created_at?: string
          deal_role_type_id?: number
          id?: never
          task_template_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_template_roles_deal_role_type_id_fkey"
            columns: ["deal_role_type_id"]
            isOneToOne: false
            referencedRelation: "deal_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_template_roles_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          button_action_id: number | null
          button_enabled: boolean
          button_label: string | null
          code: string
          created_at: string
          deal_stage_id: number | null
          default_priority_id: number | null
          default_status_id: number | null
          description: string | null
          display_order: number | null
          due_offset_days: number | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string
          uuid: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          button_action_id?: number | null
          button_enabled?: boolean
          button_label?: string | null
          code: string
          created_at?: string
          deal_stage_id?: number | null
          default_priority_id?: number | null
          default_status_id?: number | null
          description?: string | null
          display_order?: number | null
          due_offset_days?: number | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          button_action_id?: number | null
          button_enabled?: boolean
          button_label?: string | null
          code?: string
          created_at?: string
          deal_stage_id?: number | null
          default_priority_id?: number | null
          default_status_id?: number | null
          description?: string | null
          display_order?: number | null
          due_offset_days?: number | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_button_action_id_fkey"
            columns: ["button_action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_deal_stage_id_fkey"
            columns: ["deal_stage_id"]
            isOneToOne: false
            referencedRelation: "deal_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_default_priority_id_fkey"
            columns: ["default_priority_id"]
            isOneToOne: false
            referencedRelation: "task_priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_default_status_id_fkey"
            columns: ["default_status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
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
      user_deal_access: {
        Row: {
          clerk_user_id: string
          created_at: string
          deal_id: string
          granted_via: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          deal_id: string
          granted_via?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          deal_id?: string
          granted_via?: string
        }
        Relationships: []
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
      workflow_execution_logs: {
        Row: {
          completed_at: string | null
          duration: string | null
          error: string | null
          execution_id: string
          id: string
          input: Json | null
          node_id: string
          node_name: string | null
          node_type: string | null
          output: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          duration?: string | null
          error?: string | null
          execution_id: string
          id?: string
          input?: Json | null
          node_id: string
          node_name?: string | null
          node_type?: string | null
          output?: Json | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          duration?: string | null
          error?: string | null
          execution_id?: string
          id?: string
          input?: Json | null
          node_id?: string
          node_name?: string | null
          node_type?: string | null
          output?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_logs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          duration: string | null
          error: string | null
          id: string
          input: Json | null
          organization_id: string
          output: Json | null
          started_at: string
          status: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          duration?: string | null
          error?: string | null
          id?: string
          input?: Json | null
          organization_id: string
          output?: Json | null
          started_at?: string
          status?: string
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          duration?: string | null
          error?: string | null
          id?: string
          input?: Json | null
          organization_id?: string
          output?: Json | null
          started_at?: string
          status?: string
          user_id?: string
          workflow_id?: string
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
      can_access_deal_document: {
        Args: {
          p_action: string
          p_deal_id: string
          p_document_category_id: number
        }
        Returns: boolean
      }
      can_access_deal_document_by_code: {
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
      check_named_scope: {
        Args: { p_anchor_id: string; p_scope_name: string }
        Returns: boolean
      }
      check_named_scope_from_scope_string: {
        Args: { p_anchor_id: string; p_scope: string }
        Returns: boolean
      }
      check_org_access: {
        Args: {
          p_action: string
          p_resource_name: string
          p_resource_type: string
        }
        Returns: Database["public"]["CompositeTypes"]["org_access_result"]
        SetofOptions: {
          from: "*"
          to: "org_access_result"
          isOneToOne: true
          isSetofReturn: false
        }
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
      fail_stale_llama_document_parsed: { Args: never; Returns: undefined }
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
          archived_at: string | null
          archived_by: string | null
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
      get_primary_key_column: {
        Args: { p_table_name: string }
        Returns: string
      }
      get_public_table_names: {
        Args: never
        Returns: {
          table_name: string
        }[]
      }
      is_internal_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { p_org_id: string }; Returns: boolean }
      is_org_owner: { Args: { p_org_id: string }; Returns: boolean }
      list_public_functions: {
        Args: never
        Returns: {
          function_args: string
          function_name: string
        }[]
      }
      list_public_tables: {
        Args: never
        Returns: {
          table_name: string
        }[]
      }
      list_table_columns: {
        Args: { p_table_name: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: boolean
        }[]
      }
      match_documents: {
        Args: { filter?: Json; match_count: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_llama_document_chunks: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
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
      match_program_document_chunks: {
        Args: { filter?: Json; match_count: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
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
      org_access_result: {
        allowed: boolean | null
        scope: string | null
      }
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
