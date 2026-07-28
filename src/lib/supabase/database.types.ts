export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RolUsuario = "admin" | "cazador";
export type TipoPuntoInteres = "comedero" | "bebedero" | "puesto" | "otro";

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre: string;
          rol: RolUsuario;
          fecha_alta: string;
        };
        Insert: {
          id: string;
          nombre: string;
          rol?: RolUsuario;
          fecha_alta?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          rol?: RolUsuario;
          fecha_alta?: string;
        };
        Relationships: [];
      };
      puntos_interes: {
        Row: {
          id: string;
          nombre: string;
          tipo: TipoPuntoInteres;
          lat: number;
          lng: number;
          notas: string | null;
          foto_url: string | null;
          creado_por: string;
          fecha_creacion: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          tipo: TipoPuntoInteres;
          lat: number;
          lng: number;
          notas?: string | null;
          foto_url?: string | null;
          creado_por?: string;
          fecha_creacion?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          tipo?: TipoPuntoInteres;
          lat?: number;
          lng?: number;
          notas?: string | null;
          foto_url?: string | null;
          creado_por?: string;
          fecha_creacion?: string;
        };
        Relationships: [
          {
            foreignKeyName: "puntos_interes_creado_por_fkey";
            columns: ["creado_por"];
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      finca_limite: {
        Row: {
          id: string;
          version: number;
          geometria: Json;
          actualizado_por: string;
          fecha_actualizacion: string;
        };
        Insert: {
          id?: string;
          version?: number;
          geometria: Json;
          actualizado_por?: string;
          fecha_actualizacion?: string;
        };
        Update: {
          id?: string;
          version?: number;
          geometria?: Json;
          actualizado_por?: string;
          fecha_actualizacion?: string;
        };
        Relationships: [
          {
            foreignKeyName: "finca_limite_actualizado_por_fkey";
            columns: ["actualizado_por"];
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      finca_limite_actual: {
        Row: {
          id: string;
          version: number;
          geometria: Json;
          actualizado_por: string;
          fecha_actualizacion: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
