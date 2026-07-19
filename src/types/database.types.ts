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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      formations: {
        Row: {
          created_at: string
          formation_type: string
          id: string
          name: string
          org_id: string
          positions: Json
        }
        Insert: {
          created_at?: string
          formation_type: string
          id?: string
          name: string
          org_id: string
          positions?: Json
        }
        Update: {
          created_at?: string
          formation_type?: string
          id?: string
          name?: string
          org_id?: string
          positions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "formations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      frame_objects: {
        Row: {
          created_at: string
          data: Json
          frame_id: string
          id: string
          object_type: string
          player_id: string | null
          rotation: number
          scale: number
          x: number
          y: number
          z_index: number
        }
        Insert: {
          created_at?: string
          data?: Json
          frame_id: string
          id?: string
          object_type: string
          player_id?: string | null
          rotation?: number
          scale?: number
          x?: number
          y?: number
          z_index?: number
        }
        Update: {
          created_at?: string
          data?: Json
          frame_id?: string
          id?: string
          object_type?: string
          player_id?: string | null
          rotation?: number
          scale?: number
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "frame_objects_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frame_objects_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      frames: {
        Row: {
          caption_badge: string | null
          caption_subtitle: string | null
          caption_title: string | null
          created_at: string
          duration_ms: number
          formation_id: string | null
          id: string
          order_index: number
          project_id: string
        }
        Insert: {
          caption_badge?: string | null
          caption_subtitle?: string | null
          caption_title?: string | null
          created_at?: string
          duration_ms?: number
          formation_id?: string | null
          id?: string
          order_index?: number
          project_id: string
        }
        Update: {
          caption_badge?: string | null
          caption_subtitle?: string | null
          caption_title?: string | null
          created_at?: string
          duration_ms?: number
          formation_id?: string | null
          id?: string
          order_index?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "frames_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frames_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string
          secondary_color: string
          subscription_tier: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string
          secondary_color?: string
          subscription_tier?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string
          secondary_color?: string
          subscription_tier?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          attributes: Json
          birth_date: string | null
          created_at: string
          email: string | null
          first_name: string
          height_cm: number | null
          id: string
          jersey_number: number | null
          last_name: string
          nationality: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          position: string | null
          secondary_position: string | null
          strong_foot: string | null
          team_id: string
          weight_kg: number | null
        }
        Insert: {
          attributes?: Json
          birth_date?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          height_cm?: number | null
          id?: string
          jersey_number?: number | null
          last_name: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          secondary_position?: string | null
          strong_foot?: string | null
          team_id: string
          weight_kg?: number | null
        }
        Update: {
          attributes?: Json
          birth_date?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          height_cm?: number | null
          id?: string
          jersey_number?: number | null
          last_name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          secondary_position?: string | null
          strong_foot?: string | null
          team_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          org_id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          org_id: string
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          org_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          field_crop: string
          id: string
          org_id: string
          orientation: string
          pitch_design: string
          show_pitch_markings: boolean
          team_id: string | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
          zone_grid_style: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          field_crop?: string
          id?: string
          org_id: string
          orientation?: string
          pitch_design?: string
          show_pitch_markings?: boolean
          team_id?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          zone_grid_style?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          field_crop?: string
          id?: string
          org_id?: string
          orientation?: string
          pitch_design?: string
          show_pitch_markings?: boolean
          team_id?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          zone_grid_style?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          age_group: string | null
          away_kit_color1: string
          away_kit_color2: string
          away_kit_pattern: string
          chip_scale: number
          created_at: string
          gk_kit_color1: string
          gk_kit_color2: string
          gk_kit_pattern: string
          home_kit_color1: string
          home_kit_color2: string
          home_kit_pattern: string
          id: string
          name: string
          org_id: string
          season: string | null
        }
        Insert: {
          age_group?: string | null
          away_kit_color1?: string
          away_kit_color2?: string
          away_kit_pattern?: string
          chip_scale?: number
          created_at?: string
          gk_kit_color1?: string
          gk_kit_color2?: string
          gk_kit_pattern?: string
          home_kit_color1?: string
          home_kit_color2?: string
          home_kit_pattern?: string
          id?: string
          name: string
          org_id: string
          season?: string | null
        }
        Update: {
          age_group?: string | null
          away_kit_color1?: string
          away_kit_color2?: string
          away_kit_pattern?: string
          chip_scale?: number
          created_at?: string
          gk_kit_color1?: string
          gk_kit_color2?: string
          gk_kit_pattern?: string
          home_kit_color1?: string
          home_kit_color2?: string
          home_kit_pattern?: string
          id?: string
          name?: string
          org_id?: string
          season?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
