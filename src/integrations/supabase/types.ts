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
      invites: {
        Row: {
          baby_name: string | null
          baby_theme: string | null
          couple_story: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          dress_code: string | null
          event_date: string | null
          gift_list_url: string | null
          host_names: string | null
          id: string
          location: string | null
          location_url: string | null
          message: string | null
          playlist_url: string | null
          published: boolean
          rsvp_enabled: boolean
          slug: string
          theme: string
          title: string
          type: Database["public"]["Enums"]["invite_type"]
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          baby_name?: string | null
          baby_theme?: string | null
          couple_story?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          dress_code?: string | null
          event_date?: string | null
          gift_list_url?: string | null
          host_names?: string | null
          id?: string
          location?: string | null
          location_url?: string | null
          message?: string | null
          playlist_url?: string | null
          published?: boolean
          rsvp_enabled?: boolean
          slug: string
          theme?: string
          title: string
          type: Database["public"]["Enums"]["invite_type"]
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          baby_name?: string | null
          baby_theme?: string | null
          couple_story?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          dress_code?: string | null
          event_date?: string | null
          gift_list_url?: string | null
          host_names?: string | null
          id?: string
          location?: string | null
          location_url?: string | null
          message?: string | null
          playlist_url?: string | null
          published?: boolean
          rsvp_enabled?: boolean
          slug?: string
          theme?: string
          title?: string
          type?: Database["public"]["Enums"]["invite_type"]
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          attending: boolean
          created_at: string
          guest_count: number
          guest_name: string
          id: string
          invite_id: string
          message: string | null
        }
        Insert: {
          attending?: boolean
          created_at?: string
          guest_count?: number
          guest_name: string
          id?: string
          invite_id: string
          message?: string | null
        }
        Update: {
          attending?: boolean
          created_at?: string
          guest_count?: number
          guest_name?: string
          id?: string
          invite_id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_santa_participants: {
        Row: {
          assigned_to_id: string | null
          created_at: string
          email: string | null
          id: string
          invite_id: string
          name: string
          phone: string | null
          reveal_token: string
        }
        Insert: {
          assigned_to_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invite_id: string
          name: string
          phone?: string | null
          reveal_token?: string
        }
        Update: {
          assigned_to_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invite_id?: string
          name?: string
          phone?: string | null
          reveal_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_santa_participants_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "secret_santa_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_santa_participants_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      draw_secret_santa: { Args: { _invite_id: string }; Returns: number }
      get_secret_santa_assignment: {
        Args: { _token: string }
        Returns: {
          assigned_name: string
          event_date: string
          invite_title: string
          participant_name: string
        }[]
      }
      increment_invite_view: { Args: { _slug: string }; Returns: undefined }
    }
    Enums: {
      invite_type:
        | "casamento"
        | "aniversario"
        | "cha_bebe"
        | "cha_revelacao"
        | "amigo_secreto"
        | "formatura"
        | "corporativo"
        | "infantil"
        | "religioso"
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
      invite_type: [
        "casamento",
        "aniversario",
        "cha_bebe",
        "cha_revelacao",
        "amigo_secreto",
        "formatura",
        "corporativo",
        "infantil",
        "religioso",
      ],
    },
  },
} as const
