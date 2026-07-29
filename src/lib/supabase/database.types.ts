export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RolUsuario = "admin" | "cazador";
export type TipoPuntoInteres = "comedero" | "bebedero" | "puesto" | "casa" | "otro";
export type TipoCaptura = "captura" | "avistamiento";
export type TipoActividad = "rellenado" | "revision" | "reparacion" | "otro";
export type TipoDocumento = "seguro" | "licencia";

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
      capturas_avistamientos: {
        Row: {
          id: string;
          tipo: TipoCaptura;
          especie: string;
          cantidad: number;
          lat: number | null;
          lng: number | null;
          punto_interes_id: string | null;
          notas: string | null;
          foto_url: string | null;
          registrado_por: string;
          fecha: string;
          fecha_registro: string;
        };
        Insert: {
          id?: string;
          tipo: TipoCaptura;
          especie: string;
          cantidad?: number;
          lat?: number | null;
          lng?: number | null;
          punto_interes_id?: string | null;
          notas?: string | null;
          foto_url?: string | null;
          registrado_por?: string;
          fecha?: string;
          fecha_registro?: string;
        };
        Update: {
          id?: string;
          tipo?: TipoCaptura;
          especie?: string;
          cantidad?: number;
          lat?: number | null;
          lng?: number | null;
          punto_interes_id?: string | null;
          notas?: string | null;
          foto_url?: string | null;
          registrado_por?: string;
          fecha?: string;
          fecha_registro?: string;
        };
        Relationships: [
          {
            foreignKeyName: "capturas_avistamientos_registrado_por_fkey";
            columns: ["registrado_por"];
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "capturas_avistamientos_punto_interes_id_fkey";
            columns: ["punto_interes_id"];
            referencedRelation: "puntos_interes";
            referencedColumns: ["id"];
          },
        ];
      };
      actividades: {
        Row: {
          id: string;
          punto_interes_id: string;
          tipo: TipoActividad;
          notas: string | null;
          realizado_por: string;
          fecha: string;
          proxima_fecha_estimada: string | null;
          fecha_registro: string;
        };
        Insert: {
          id?: string;
          punto_interes_id: string;
          tipo: TipoActividad;
          notas?: string | null;
          realizado_por?: string;
          fecha?: string;
          proxima_fecha_estimada?: string | null;
          fecha_registro?: string;
        };
        Update: {
          id?: string;
          punto_interes_id?: string;
          tipo?: TipoActividad;
          notas?: string | null;
          realizado_por?: string;
          fecha?: string;
          proxima_fecha_estimada?: string | null;
          fecha_registro?: string;
        };
        Relationships: [
          {
            foreignKeyName: "actividades_realizado_por_fkey";
            columns: ["realizado_por"];
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "actividades_punto_interes_id_fkey";
            columns: ["punto_interes_id"];
            referencedRelation: "puntos_interes";
            referencedColumns: ["id"];
          },
        ];
      };
      esperas: {
        Row: {
          id: string;
          puesto_id: string;
          cazador_id: string;
          fecha: string;
          notas: string | null;
          asignado_por: string;
          fecha_registro: string;
        };
        Insert: {
          id?: string;
          puesto_id: string;
          cazador_id: string;
          fecha: string;
          notas?: string | null;
          asignado_por?: string;
          fecha_registro?: string;
        };
        Update: {
          id?: string;
          puesto_id?: string;
          cazador_id?: string;
          fecha?: string;
          notas?: string | null;
          asignado_por?: string;
          fecha_registro?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esperas_puesto_id_fkey";
            columns: ["puesto_id"];
            referencedRelation: "puntos_interes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esperas_cazador_id_fkey";
            columns: ["cazador_id"];
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esperas_asignado_por_fkey";
            columns: ["asignado_por"];
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      calendario_asistencias: {
        Row: {
          id: string;
          cazador_id: string;
          fecha: string;
          notas: string | null;
          fecha_registro: string;
        };
        Insert: {
          id?: string;
          cazador_id?: string;
          fecha: string;
          notas?: string | null;
          fecha_registro?: string;
        };
        Update: {
          id?: string;
          cazador_id?: string;
          fecha?: string;
          notas?: string | null;
          fecha_registro?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendario_asistencias_cazador_id_fkey";
            columns: ["cazador_id"];
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      documentos_usuario: {
        Row: {
          id: string;
          usuario_id: string;
          tipo: TipoDocumento;
          storage_path: string;
          nombre_archivo: string;
          fecha_subida: string;
        };
        Insert: {
          id?: string;
          usuario_id?: string;
          tipo: TipoDocumento;
          storage_path: string;
          nombre_archivo: string;
          fecha_subida?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          tipo?: TipoDocumento;
          storage_path?: string;
          nombre_archivo?: string;
          fecha_subida?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documentos_usuario_usuario_id_fkey";
            columns: ["usuario_id"];
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      gastos: {
        Row: {
          id: string;
          concepto: string;
          importe: number;
          pagado_por: string;
          fecha: string;
          notas: string | null;
          proveedor: string | null;
          registrado_por: string;
          fecha_registro: string;
        };
        Insert: {
          id?: string;
          concepto: string;
          importe: number;
          pagado_por: string;
          fecha: string;
          notas?: string | null;
          proveedor?: string | null;
          registrado_por?: string;
          fecha_registro?: string;
        };
        Update: {
          id?: string;
          concepto?: string;
          importe?: number;
          pagado_por?: string;
          fecha?: string;
          notas?: string | null;
          proveedor?: string | null;
          registrado_por?: string;
          fecha_registro?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gastos_pagado_por_fkey";
            columns: ["pagado_por"];
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gastos_registrado_por_fkey";
            columns: ["registrado_por"];
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
