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
      leads: {
        Row: {
          arquetipo_id: number | null
          barra_creditos: number
          barra_ingresos: number
          barra_movimientos: number
          barra_patrimonio: number
          cedula: string
          celular: string | null
          created_at: string | null
          debe_declarar: boolean
          edad: number
          estado: string
          extemporaneo: boolean
          fecha_vencimiento: string | null
          id: string
          nombre: string
          ocupacion: string
          slug_publico: string
          topes_superados: string[]
          updated_at: string | null
        }
        Insert: {
          arquetipo_id?: number | null
          barra_creditos: number
          barra_ingresos: number
          barra_movimientos: number
          barra_patrimonio: number
          cedula: string
          celular?: string | null
          created_at?: string | null
          debe_declarar: boolean
          edad: number
          estado?: string
          extemporaneo?: boolean
          fecha_vencimiento?: string | null
          id?: string
          nombre: string
          ocupacion: string
          slug_publico?: string
          topes_superados?: string[]
          updated_at?: string | null
        }
        Update: {
          arquetipo_id?: number | null
          barra_creditos?: number
          barra_ingresos?: number
          barra_movimientos?: number
          barra_patrimonio?: number
          cedula?: string
          celular?: string | null
          created_at?: string | null
          debe_declarar?: boolean
          edad?: number
          estado?: string
          extemporaneo?: boolean
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string
          ocupacion?: string
          slug_publico?: string
          topes_superados?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_arquetipo_id_fkey"
            columns: ["arquetipo_id"]
            isOneToOne: false
            referencedRelation: "arquetipos"
            referencedColumns: ["id"]
          },
        ]
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
          rol: string
        }
        Insert: {
          activo?: boolean
          created_at?: string | null
          email: string
          id?: string
          nombre: string
          password_hash?: string | null
          rol?: string
        }
        Update: {
          activo?: boolean
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          password_hash?: string | null
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
