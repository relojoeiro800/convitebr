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
      admin_templates: {
        Row: {
          category_id: string | null
          config: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_premium: boolean
          name: string
          preview_url: string | null
          price_cents: number
          status: string
          theme: string | null
          type: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          config?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_premium?: boolean
          name: string
          preview_url?: string | null
          price_cents?: number
          status?: string
          theme?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          config?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          name?: string
          preview_url?: string | null
          price_cents?: number
          status?: string
          theme?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accent_color: string | null
          baby_name: string | null
          baby_theme: string | null
          background_music_url: string | null
          couple_story: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          dress_code: string | null
          event_date: string | null
          font_family: string | null
          frame_style: string | null
          gift_list_url: string | null
          host_names: string | null
          id: string
          location: string | null
          location_url: string | null
          max_guests: number | null
          message: string | null
          playlist_url: string | null
          published: boolean
          rsvp_enabled: boolean
          slug: string
          stickers: Json
          theme: string
          title: string
          type: Database["public"]["Enums"]["invite_type"]
          updated_at: string
          user_id: string
          video_url: string | null
          view_count: number
        }
        Insert: {
          accent_color?: string | null
          baby_name?: string | null
          baby_theme?: string | null
          background_music_url?: string | null
          couple_story?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          dress_code?: string | null
          event_date?: string | null
          font_family?: string | null
          frame_style?: string | null
          gift_list_url?: string | null
          host_names?: string | null
          id?: string
          location?: string | null
          location_url?: string | null
          max_guests?: number | null
          message?: string | null
          playlist_url?: string | null
          published?: boolean
          rsvp_enabled?: boolean
          slug: string
          stickers?: Json
          theme?: string
          title: string
          type: Database["public"]["Enums"]["invite_type"]
          updated_at?: string
          user_id: string
          video_url?: string | null
          view_count?: number
        }
        Update: {
          accent_color?: string | null
          baby_name?: string | null
          baby_theme?: string | null
          background_music_url?: string | null
          couple_story?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          dress_code?: string | null
          event_date?: string | null
          font_family?: string | null
          frame_style?: string | null
          gift_list_url?: string | null
          host_names?: string | null
          id?: string
          location?: string | null
          location_url?: string | null
          max_guests?: number | null
          message?: string | null
          playlist_url?: string | null
          published?: boolean
          rsvp_enabled?: boolean
          slug?: string
          stickers?: Json
          theme?: string
          title?: string
          type?: Database["public"]["Enums"]["invite_type"]
          updated_at?: string
          user_id?: string
          video_url?: string | null
          view_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          error: string | null
          id: string
          invite_id: string | null
          metadata: Json
          provider_id: string | null
          recipient: string
          rsvp_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
          trigger: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          invite_id?: string | null
          metadata?: Json
          provider_id?: string | null
          recipient: string
          rsvp_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          trigger: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          invite_id?: string | null
          metadata?: Json
          provider_id?: string | null
          recipient?: string
          rsvp_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          trigger?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: false
            referencedRelation: "rsvps"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          id: string
          invite_id: string | null
          provider: string | null
          provider_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invite_id?: string | null
          provider?: string | null
          provider_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invite_id?: string | null
          provider?: string | null
          provider_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          max_guests_per_invite: number | null
          max_invites: number | null
          name: string
          price_cents: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          max_guests_per_invite?: number | null
          max_invites?: number | null
          name: string
          price_cents?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          max_guests_per_invite?: number | null
          max_invites?: number | null
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number
          updated_at?: string
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
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          email: string | null
          guest_count: number
          guest_name: string
          id: string
          invite_id: string
          message: string | null
          notes: string | null
          phone: string | null
          token: string
        }
        Insert: {
          attending?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          email?: string | null
          guest_count?: number
          guest_name: string
          id?: string
          invite_id: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          token?: string
        }
        Update: {
          attending?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          email?: string | null
          guest_count?: number
          guest_name?: string
          id?: string
          invite_id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          token?: string
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
      suspended_accounts: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          suspended_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          suspended_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          suspended_by?: string
          user_id?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      template_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      template_favorites: {
        Row: {
          created_at: string
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_favorites_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "admin_templates"
            referencedColumns: ["id"]
          },
        ]
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
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_in_rsvp: {
        Args: { _token: string }
        Returns: {
          already: boolean
          attending: boolean
          checked_in_at: string
          guest_count: number
          guest_name: string
          id: string
          invite_id: string
          invite_title: string
        }[]
      }
      draw_secret_santa: { Args: { _invite_id: string }; Returns: number }
      get_admin_stats: { Args: never; Returns: Json }
      get_rsvp_by_token: {
        Args: { _token: string }
        Returns: {
          attending: boolean
          created_at: string
          event_date: string
          guest_count: number
          guest_name: string
          id: string
          invite_id: string
          invite_title: string
          message: string
          notes: string
          slug: string
        }[]
      }
      get_secret_santa_assignment: {
        Args: { _token: string }
        Returns: {
          assigned_name: string
          event_date: string
          invite_title: string
          participant_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_invite_view: { Args: { _slug: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      plan_tier: "free" | "premium" | "business" | "premium_pro"
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
      app_role: ["admin", "moderator", "user"],
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
      plan_tier: ["free", "premium", "business", "premium_pro"],
    },
  },
} as const
