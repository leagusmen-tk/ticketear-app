import { supabase } from "./supabaseClient";
import type { Ticket } from "../types/ticket";

type TicketRow = {
  id: string;
  cliente: string;
  asunto: string;
  estado: Ticket["estado"];
  prioridad: Ticket["prioridad"];
  asignado: string | null;
  assigned_to_id: string | null;
  fecha: string;
  descripcion: string;
  email: string;
  telefono: string;
  fecha_creacion: string;
  ultima_actualizacion: string;
  categoria: string;
  comentarios: string[] | null;
};

function toTicket(r: TicketRow): Ticket {
  return {
    id: r.id,
    cliente: r.cliente,
    asunto: r.asunto,
    estado: r.estado,
    prioridad: r.prioridad,
    asignado: r.asignado ?? "Sin asignar",
    assignedToId: r.assigned_to_id ?? null,
    fecha: r.fecha,
    descripcion: r.descripcion,
    email: r.email,
    telefono: r.telefono,
    fechaCreacion: r.fecha_creacion,
    ultimaActualizacion: r.ultima_actualizacion,
    categoria: r.categoria,
    comentarios: r.comentarios ?? [],
  };
}

function toRow(t: Ticket): TicketRow {
  return {
    id: t.id,
    cliente: t.cliente,
    asunto: t.asunto,
    estado: t.estado,
    prioridad: t.prioridad,
    asignado: t.asignado ?? "Sin asignar",
    assigned_to_id: t.assignedToId ?? null,
    fecha: t.fecha,
    descripcion: t.descripcion,
    email: t.email,
    telefono: t.telefono,
    fecha_creacion: t.fechaCreacion,
    ultima_actualizacion: t.ultimaActualizacion,
    categoria: t.categoria,
    comentarios: t.comentarios ?? [],
  };
}

async function list(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "id,cliente,asunto,estado,prioridad,asignado,assigned_to_id,fecha,descripcion,email,telefono,fecha_creacion,ultima_actualizacion,categoria,comentarios"
    )
    .order("fecha_creacion", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r) => toTicket(r as TicketRow));
}

/**
 * Guarda todos los tickets (upsert por id).
 * Nota: no borra tickets que ya existan y no vengan en la lista (para evitar problemas de RLS).
 */
async function replaceAll(tickets: Ticket[]): Promise<void> {
  const rows = tickets.map(toRow);

  const { error } = await supabase.from("tickets").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

// NUEVA FUNCIÓN: Llama a la Edge Function centralizada
async function create(ticketData: Partial<Ticket>): Promise<Ticket> {
  // Usamos .invoke() en lugar de .insert()
  const { data, error } = await supabase.functions.invoke('crear-ticket', {
    body: {
      cliente: ticketData.cliente,
      email: ticketData.email,
      telefono: ticketData.telefono,
      asunto: ticketData.asunto,
      descripcion: ticketData.descripcion,
      categoria: ticketData.categoria || 'General',
      // Si el admin no eligió a nadie, esto viaja como null y dispara el balanceo
      assignedToId: ticketData.assignedToId || null, 
    }
  });

  if (error) {
    console.error("Error en Edge Function:", error);
    throw new Error(error.message || "Error al crear el ticket en el servidor");
  }

  return toTicket(data as TicketRow);
}

export const ticketsService = {
  list,
  replaceAll,
  create, 
};
