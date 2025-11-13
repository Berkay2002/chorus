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
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      servers: {
        Row: {
          id: string
          name: string
          owner_id: string
          invite_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          invite_code?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          invite_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      server_members: {
        Row: {
          server_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          server_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          server_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          server_id: string
          name: string
          agents_md: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          server_id: string
          name: string
          agents_md?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          name?: string
          agents_md?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          user_id: string | null
          content: string
          is_ai: boolean
          embedding: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          user_id?: string | null
          content: string
          is_ai?: boolean
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string | null
          content?: string
          is_ai?: boolean
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_messages: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          channel_filter?: string
        }
        Returns: {
          id: string
          channel_id: string
          user_id: string | null
          content: string
          is_ai: boolean
          created_at: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
