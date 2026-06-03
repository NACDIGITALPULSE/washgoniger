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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          active: boolean
          avg_eta_min: number
          created_at: string
          current_location: Json | null
          id: string
          name: string
          phone: string
          zone: string | null
        }
        Insert: {
          active?: boolean
          avg_eta_min?: number
          created_at?: string
          current_location?: Json | null
          id?: string
          name: string
          phone: string
          zone?: string | null
        }
        Update: {
          active?: boolean
          avg_eta_min?: number
          created_at?: string
          current_location?: Json | null
          id?: string
          name?: string
          phone?: string
          zone?: string | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          points: number
          source: string
          user_id: string | null
          user_phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          points?: number
          source?: string
          user_id?: string | null
          user_phone: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          points?: number
          source?: string
          user_id?: string | null
          user_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          agent_eta_min: number | null
          agent_id: string | null
          assigned_at: string | null
          client_name: string
          client_phone: string
          created_at: string
          discount: number | null
          id: string
          location: string
          order_number: string | null
          payment: string
          promo_code: string | null
          quantity: number
          receipt_url: string | null
          selected_option: Json
          service_icon: string
          service_id: string
          service_name: string
          status: string
          total: number
          user_id: string | null
        }
        Insert: {
          address?: string | null
          agent_eta_min?: number | null
          agent_id?: string | null
          assigned_at?: string | null
          client_name: string
          client_phone: string
          created_at?: string
          discount?: number | null
          id: string
          location?: string
          order_number?: string | null
          payment?: string
          promo_code?: string | null
          quantity?: number
          receipt_url?: string | null
          selected_option: Json
          service_icon?: string
          service_id: string
          service_name: string
          status?: string
          total?: number
          user_id?: string | null
        }
        Update: {
          address?: string | null
          agent_eta_min?: number | null
          agent_id?: string | null
          assigned_at?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          discount?: number | null
          id?: string
          location?: string
          order_number?: string | null
          payment?: string
          promo_code?: string | null
          quantity?: number
          receipt_url?: string | null
          selected_option?: Json
          service_icon?: string
          service_id?: string
          service_name?: string
          status?: string
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_receipts: {
        Row: {
          created_at: string
          id: string
          order_id: string
          receipt_url: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          receipt_url: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          receipt_url?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order: number
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order?: number
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order?: number
          used_count?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          options: Json
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          icon?: string
          id: string
          name: string
          options?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          options?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      agents_public: {
        Row: {
          active: boolean | null
          avg_eta_min: number | null
          created_at: string | null
          current_location: Json | null
          id: string | null
          name: string | null
          zone: string | null
        }
        Insert: {
          active?: boolean | null
          avg_eta_min?: number | null
          created_at?: string | null
          current_location?: Json | null
          id?: string | null
          name?: string | null
          zone?: string | null
        }
        Update: {
          active?: boolean | null
          avg_eta_min?: number | null
          created_at?: string | null
          current_location?: Json | null
          id?: string | null
          name?: string | null
          zone?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_promo: {
        Args: { _code: string; _order_total: number }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
