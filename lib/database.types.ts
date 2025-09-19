export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          auth_provider: string
          email_verified: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          auth_provider: string
          email_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          auth_provider?: string
          email_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      topics: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          current_branch_id: string | null
          is_archived: boolean
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          current_branch_id?: string | null
          is_archived?: boolean
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          current_branch_id?: string | null
          is_archived?: boolean
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      branches: {
        Row: {
          id: string
          topic_id: string
          parent_id: string | null
          name: string
          system_prompt: string | null
          model_config: Json
          position: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          parent_id?: string | null
          name: string
          system_prompt?: string | null
          model_config?: Json
          position?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          parent_id?: string | null
          name?: string
          system_prompt?: string | null
          model_config?: Json
          position?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          branch_id: string
          author: string
          content: string
          metadata: Json | null
          is_edited: boolean
          original_content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          branch_id: string
          author: string
          content: string
          metadata?: Json | null
          is_edited?: boolean
          original_content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          branch_id?: string
          author?: string
          content?: string
          metadata?: Json | null
          is_edited?: boolean
          original_content?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          default_model: string
          default_system_prompt: string | null
          ui_theme: string
          canvas_layout: string
          api_keys: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_model?: string
          default_system_prompt?: string | null
          ui_theme?: string
          canvas_layout?: string
          api_keys?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_model?: string
          default_system_prompt?: string | null
          ui_theme?: string
          canvas_layout?: string
          api_keys?: Json | null
          created_at?: string
          updated_at?: string
        }
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