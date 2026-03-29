export interface Ticket {
  id: string;
  cliente: string;
  asunto: string;
  estado: "Abierto" | "En Progreso" | "En Espera" | "Resuelto" | "Cerrado";
  prioridad: "Alta" | "Media" | "Baja";

  // UI (lo seguimos mostrando en la tabla)
  asignado: string;

  // NUEVO: backend real (Supabase)
  assignedToId?: string | null; // uuid del usuario asignado (profiles.id / auth.uid)
  createdBy?: string | null;    // uuid del creador (auth.uid)

  fecha: string;
  descripcion: string;
  email: string;
  telefono: string;
  fechaCreacion: string;
  ultimaActualizacion: string;
  categoria: string;
  comentarios: string[];

   
}

// Dejamos ESTADOS porque sí es un catálogo real
export const ESTADOS = ["Abierto", "En Progreso", "En Espera", "Resuelto", "Cerrado"] as const;
export type Estado = typeof ESTADOS[number];

// IMPORTANTE: vamos a dejar de usar TECNICOS hardcodeados.
// Los técnicos se van a traer desde Supabase (tabla profiles).
export type Tecnico = string;

