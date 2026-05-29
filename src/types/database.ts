export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          gender: 'she' | 'he'
          food_vegetables: string[]
          food_fruits: string[]
          food_berries: string[]
          food_dishes: string[]
          chat_mode: 'ephemeral' | 'permanent'
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      couples: {
        Row: {
          id: string
          together_since: string | null
          created_at: string
          status: 'pending' | 'active'
        }
        Insert: { id?: string; together_since?: string | null; status?: string }
        Update: Partial<Database['public']['Tables']['couples']['Row']>
      }
      couple_members: {
        Row: {
          id: string
          couple_id: string
          user_id: string
          role: 'a' | 'b'
          joined_at: string
        }
        Insert: { couple_id: string; user_id: string; role: 'a' | 'b' }
        Update: Partial<Database['public']['Tables']['couple_members']['Row']>
      }
      couple_meetings: {
        Row: { couple_id: string; meeting_at: string; set_by: string | null; updated_at: string }
        Insert: { couple_id: string; meeting_at: string; set_by?: string }
        Update: Partial<Database['public']['Tables']['couple_meetings']['Row']>
      }
      heart_pulses: {
        Row: { id: string; couple_id: string; sender_id: string; created_at: string }
        Insert: { couple_id: string; sender_id: string }
        Update: never
      }
      activity_ideas: {
        Row: { id: string; couple_id: string; text: string; created_by: string | null; is_custom: boolean; created_at: string }
        Insert: { couple_id: string; text: string; created_by?: string; is_custom?: boolean }
        Update: never
      }
      chat_messages: {
        Row: { id: string; couple_id: string; sender_id: string; content: string; created_at: string; expires_at: string | null }
        Insert: { couple_id: string; sender_id: string; content: string; expires_at?: string | null }
        Update: never
      }
      album_photos: {
        Row: { id: string; couple_id: string; uploaded_by: string; storage_path: string; public_url: string; created_at: string }
        Insert: { couple_id: string; uploaded_by: string; storage_path: string; public_url: string }
        Update: never
      }
      tic_tac_toe_games: {
        Row: {
          couple_id: string
          board: string[]
          current_turn: string | null
          player_x: string | null
          player_o: string | null
          status: 'playing' | 'won' | 'draw'
          winner_id: string | null
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['tic_tac_toe_games']['Row']> & { couple_id: string }
        Update: Partial<Database['public']['Tables']['tic_tac_toe_games']['Row']>
      }
      savings_goals: {
        Row: { couple_id: string; goal_name: string; target_amount: number; current_amount: number; updated_at: string }
        Insert: { couple_id: string; goal_name?: string; target_amount?: number; current_amount?: number }
        Update: Partial<Database['public']['Tables']['savings_goals']['Row']>
      }
      important_dates: {
        Row: { id: string; couple_id: string; title: string; event_date: string; created_at: string }
        Insert: { couple_id: string; title: string; event_date: string }
        Update: never
      }
      compliments: {
        Row: { id: string; couple_id: string; sender_id: string; text: string; created_at: string }
        Insert: { couple_id: string; sender_id: string; text: string }
        Update: never
      }
      daily_moods: {
        Row: { id: string; couple_id: string; user_id: string; emoji: string; mood_date: string }
        Insert: { couple_id: string; user_id: string; emoji: string; mood_date?: string }
        Update: { emoji: string }
      }
    }
    Functions: {
      dissolve_couple: { Args: Record<string, never>; Returns: void }
      my_couple_id: { Args: Record<string, never>; Returns: string }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Couple = Database['public']['Tables']['couples']['Row']
