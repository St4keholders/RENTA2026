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
      app_settings: {
        Row: {
          id: boolean
          pct_contador: number
          pct_desarrollo: number
          pct_ref_bajo: number
          pct_ref_sobre: number
          pct_vendedor: number
          tope: number
        }
        Insert: {
          id?: boolean
          pct_contador?: number
          pct_desarrollo?: number
          pct_ref_bajo?: number
          pct_ref_sobre?: number
          pct_vendedor?: number
          tope?: number
        }
        Update: {
          id?: boolean
          pct_contador?: number
          pct_desarrollo?: number
          pct_ref_bajo?: number
          pct_ref_sobre?: number
          pct_vendedor?: number
          tope?: number
        }
        Relationships: []
      }
      arquetipos: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string
          orden_cascada: number
          slug: string
          tagline: string
          url_imagen: string | null
          url_video: string | null
        }
        Insert: {
          descripcion?: string | null
          id?: number
          nombre: string
          orden_cascada: number
          slug: string
          tagline: string
          url_imagen?: string | null
          url_video?: string | null
        }
        Update: {
          descripcion?: string | null
          id?: number
          nombre?: string
          orden_cascada?: number
          slug?: string
          tagline?: string
          url_imagen?: string | null
          url_video?: string | null
        }
        Relationships: []
      }
      calendario_vencimientos: {
        Row: {
          anio: number
          digitos_desde: string
          digitos_hasta: string
          fecha_limite: string
          id: number
        }
        Insert: {
          anio: number
          digitos_desde: string
          digitos_hasta: string
          fecha_limite: string
          id?: number
        }
        Update: {
          anio?: number
          digitos_desde?: string
          digitos_hasta?: string
          fecha_limite?: string
          id?: number
        }
        Relationships: []
      }
      citas: {
        Row: {
          celular: string
          correo: string
          created_at: string | null
          estado: string
          fecha_consulta: string
          hora_consulta: string
          id: string
          medio_contacto: string | null
          nombre: string
        }
        Insert: {
          celular: string
          correo: string
          created_at?: string | null
          estado?: string
          fecha_consulta: string
          hora_consulta: string
          id?: string
          medio_contacto?: string | null
          nombre: string
        }
        Update: {
          celular?: string
          correo?: string
          created_at?: string | null
          estado?: string
          fecha_consulta?: string
          hora_consulta?: string
          id?: string
          medio_contacto?: string | null
          nombre?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          base_amount: number
          beneficiary_id: string
          created_at: string
          id: string
          paid_at: string | null
          pct: number
          pipeline_lead_id: string
          role: string
          status: string
        }
        Insert: {
          amount: number
          base_amount: number
          beneficiary_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          pct: number
          pipeline_lead_id: string
          role: string
          status?: string
        }
        Update: {
          amount?: number
          base_amount?: number
          beneficiary_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          pct?: number
          pipeline_lead_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_pipeline_lead_id_fkey"
            columns: ["pipeline_lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      contadores: {
        Row: {
          activo: boolean
          credencial: string | null
          especialidad: string | null
          id: number
          nombre: string
          url_foto: string | null
          usuario_id: string | null
        }
        Insert: {
          activo?: boolean
          credencial?: string | null
          especialidad?: string | null
          id?: number
          nombre: string
          url_foto?: string | null
          usuario_id?: string | null
        }
        Update: {
          activo?: boolean
          credencial?: string | null
          especialidad?: string | null
          id?: number
          nombre?: string
          url_foto?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contadores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_requests: {
        Row: {
          contador_id: string
          id: string
          pipeline_lead_id: string
          requested_at: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          contador_id: string
          id?: string
          pipeline_lead_id: string
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          contador_id?: string
          id?: string
          pipeline_lead_id?: string
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_requests_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_requests_pipeline_lead_id_fkey"
            columns: ["pipeline_lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          arquetipo_id: number | null
          barra_creditos: number
          barra_ingresos: number
          barra_movimientos: number
          barra_patrimonio: number
          cedula: string
          celular: string | null
          contador_id: string | null
          correo: string | null
          created_at: string | null
          debe_declarar: boolean
          edad: number
          estado: string
          etapa?: string
          extemporaneo: boolean
          fecha_vencimiento: string | null
          id: string
          nombre: string
          ocupacion: string
          pagado?: boolean
          referrer_id?: string | null
          seller_id?: string | null
          slug_publico: string
          source?: string | null
          topes_superados: string[]
          updated_at: string | null
          valor_declaracion?: number | null
        }
        Insert: {
          arquetipo_id?: number | null
          barra_creditos: number
          barra_ingresos: number
          barra_movimientos: number
          barra_patrimonio: number
          cedula: string
          celular?: string | null
          contador_id?: string | null
          correo?: string | null
          created_at?: string | null
          debe_declarar: boolean
          edad: number
          estado?: string
          etapa?: string
          extemporaneo?: boolean
          fecha_vencimiento?: string | null
          id?: string
          nombre: string
          ocupacion: string
          pagado?: boolean
          referrer_id?: string | null
          seller_id?: string | null
          slug_publico?: string
          source?: string | null
          topes_superados?: string[]
          updated_at?: string | null
          valor_declaracion?: number | null
        }
        Update: {
          arquetipo_id?: number | null
          barra_creditos?: number
          barra_ingresos?: number
          barra_movimientos?: number
          barra_patrimonio?: number
          cedula?: string
          celular?: string | null
          contador_id?: string | null
          correo?: string | null
          created_at?: string | null
          debe_declarar?: boolean
          edad?: number
          estado?: string
          etapa?: string
          extemporaneo?: boolean
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string
          ocupacion?: string
          pagado?: boolean
          referrer_id?: string | null
          seller_id?: string | null
          slug_publico?: string
          source?: string | null
          topes_superados?: string[]
          updated_at?: string | null
          valor_declaracion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_arquetipo_id_fkey"
            columns: ["arquetipo_id"]
            isOneToOne: false
            referencedRelation: "arquetipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_in_cents: number
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          lead_id: string | null
          lead_slug: string | null
          payment_method_type: string | null
          reference: string
          status: string
          updated_at: string
          wompi_transaction_id: string | null
        }
        Insert: {
          amount_in_cents: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          lead_id?: string | null
          lead_slug?: string | null
          payment_method_type?: string | null
          reference: string
          status?: string
          updated_at?: string
          wompi_transaction_id?: string | null
        }
        Update: {
          amount_in_cents?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          lead_id?: string | null
          lead_slug?: string | null
          payment_method_type?: string | null
          reference?: string
          status?: string
          updated_at?: string
          wompi_transaction_id?: string | null
        }
        Relationships: []
      }
      parametros_fiscales: {
        Row: {
          anio_gravable: number
          created_at: string | null
          edad_max_mochilero: number
          edad_min_mochilero: number
          factor_penalizacion_compras: number
          id: number
          ratio_cuota_gladiador: number
          tope_compras: number
          tope_consignaciones: number
          tope_ingresos: number
          tope_patrimonio: number
          tope_tc: number
          umbral_ingreso_mago: number
          uvt: number
        }
        Insert: {
          anio_gravable: number
          created_at?: string | null
          edad_max_mochilero?: number
          edad_min_mochilero?: number
          factor_penalizacion_compras?: number
          id?: number
          ratio_cuota_gladiador?: number
          tope_compras: number
          tope_consignaciones: number
          tope_ingresos: number
          tope_patrimonio: number
          tope_tc: number
          umbral_ingreso_mago?: number
          uvt: number
        }
        Update: {
          anio_gravable?: number
          created_at?: string | null
          edad_max_mochilero?: number
          edad_min_mochilero?: number
          factor_penalizacion_compras?: number
          id?: number
          ratio_cuota_gladiador?: number
          tope_compras?: number
          tope_consignaciones?: number
          tope_ingresos?: number
          tope_patrimonio?: number
          tope_tc?: number
          umbral_ingreso_mago?: number
          uvt?: number
        }
        Relationships: []
      }
      pipeline_leads: {
        Row: {
          anticipo_paid_at: string | null
          assigned_contador_id: string | null
          created_at: string
          created_by: string | null
          declaration_amount: number | null
          email: string | null
          full_name: string
          id: string
          lead_id: string | null
          phone: string | null
          referrer_id: string | null
          seller_id: string | null
          source: string
          stage: string
          updated_at: string
        }
        Insert: {
          anticipo_paid_at?: string | null
          assigned_contador_id?: string | null
          created_at?: string
          created_by?: string | null
          declaration_amount?: number | null
          email?: string | null
          full_name: string
          id?: string
          lead_id?: string | null
          phone?: string | null
          referrer_id?: string | null
          seller_id?: string | null
          source?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          anticipo_paid_at?: string | null
          assigned_contador_id?: string | null
          created_at?: string
          created_by?: string | null
          declaration_amount?: number | null
          email?: string | null
          full_name?: string
          id?: string
          lead_id?: string | null
          phone?: string | null
          referrer_id?: string | null
          seller_id?: string | null
          source?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_leads_assigned_contador_id_fkey"
            columns: ["assigned_contador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_leads_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_leads_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_events: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          event_type: string
          id: string
          pipeline_lead_id: string | null
          referrer_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          event_type: string
          id?: string
          pipeline_lead_id?: string | null
          referrer_id: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          event_type?: string
          id?: string
          pipeline_lead_id?: string | null
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_events_pipeline_lead_id_fkey"
            columns: ["pipeline_lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_events_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      respuestas: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          payload: Json
          version_motor: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          payload: Json
          version_motor: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          payload?: Json
          version_motor?: string
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean
          created_at: string | null
          email: string
          id: string
          nombre: string
          password_hash: string | null
          payout_account_number: string | null
          payout_account_type: string | null
          payout_bank: string | null
          payout_doc_id: string | null
          phone: string | null
          referral_slug: string | null
          rol: string
        }
        Insert: {
          activo?: boolean
          created_at?: string | null
          email: string
          id?: string
          nombre: string
          password_hash?: string | null
          payout_account_number?: string | null
          payout_account_type?: string | null
          payout_bank?: string | null
          payout_doc_id?: string | null
          phone?: string | null
          referral_slug?: string | null
          rol?: string
        }
        Update: {
          activo?: boolean
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          password_hash?: string | null
          payout_account_number?: string | null
          payout_account_type?: string | null
          payout_bank?: string | null
          payout_doc_id?: string | null
          phone?: string | null
          referral_slug?: string | null
          rol?: string
        }
        Relationships: []
      }
      ventas: {
        Row: {
          abono_consulta: number
          contador_id: number | null
          created_at: string | null
          estado: string
          fecha_consulta: string | null
          id: string
          lead_id: string
          medio_contacto: string | null
          pago_confirmado: boolean
          precio_servicio: number | null
          referencia_pago: string | null
          saldo_pendiente: number | null
          updated_at: string | null
        }
        Insert: {
          abono_consulta?: number
          contador_id?: number | null
          created_at?: string | null
          estado?: string
          fecha_consulta?: string | null
          id?: string
          lead_id: string
          medio_contacto?: string | null
          pago_confirmado?: boolean
          precio_servicio?: number | null
          referencia_pago?: string | null
          saldo_pendiente?: number | null
          updated_at?: string | null
        }
        Update: {
          abono_consulta?: number
          contador_id?: number | null
          created_at?: string | null
          estado?: string
          fecha_consulta?: string | null
          id?: string
          lead_id?: string
          medio_contacto?: string | null
          pago_confirmado?: boolean
          precio_servicio?: number | null
          referencia_pago?: string | null
          saldo_pendiente?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "contadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_commissions: { Args: { p_lead_id: string }; Returns: undefined }
      generate_referral_slug: { Args: { nombre: string }; Returns: string }
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
