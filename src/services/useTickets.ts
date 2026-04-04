import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { Ticket } from "../types/ticket";

/**
 * DB shape (snake_case).
 * IMPORTANT: no usamos fecha_creacion / ultima_actualizacion porque tu tabla no las tiene.
 * Usamos created_at / updated_at.
 */
type TicketDb = {
  id: string;
  user_id: string;

  cliente: string;
  email: string;
  telefono: string | null;

  asunto: string;
  descripcion: string;

  estado: string;
  prioridad: string;

  assigned_to_id: string | null;
  asignado: string | null;

  comentarios: string[] | null;

  fecha: string | null;

  created_at: string;
  updated_at: string;
};

function dbToTicket(row: TicketDb): Ticket {
  return {
    ...(row as any),

    // Normalizaciones
    telefono: row.telefono ?? "",
    comentarios: row.comentarios ?? [],

    // snake_case -> camelCase
    assignedToId: row.assigned_to_id,

    // Campos que tu UI usa (los rellenamos con los timestamps reales de DB)
    fechaCreacion: row.created_at ?? "",
    ultimaActualizacion: row.updated_at ?? "",
  } as Ticket;
}

function ticketPatchToDbPatch(patch: Partial<Ticket>): Partial<TicketDb> {
  const out: Partial<TicketDb> = {};

  // Campos iguales en DB
  if (patch.cliente !== undefined) out.cliente = patch.cliente as any;
  if (patch.email !== undefined) out.email = patch.email as any;
  if (patch.telefono !== undefined) out.telefono = (patch.telefono as any) ?? null;

  if (patch.asunto !== undefined) out.asunto = patch.asunto as any;
  if (patch.descripcion !== undefined) out.descripcion = patch.descripcion as any;

  if (patch.estado !== undefined) out.estado = patch.estado as any;
  if (patch.prioridad !== undefined) out.prioridad = patch.prioridad as any;

  if (patch.asignado !== undefined) out.asignado = (patch.asignado as any) ?? null;
  if (patch.comentarios !== undefined) out.comentarios = (patch.comentarios as any) ?? [];

  if ((patch as any).fecha !== undefined) out.fecha = ((patch as any).fecha as any) ?? null;

  // camelCase -> snake_case
  if ((patch as any).assignedToId !== undefined) out.assigned_to_id = (patch as any).assignedToId ?? null;

  // NO mapear fechaCreacion / ultimaActualizacion a DB (no existen como columnas)
  // se usan created_at / updated_at

  return out;
}

function ticketToDbInsert(ticket: Ticket): Partial<TicketDb> {
  return {
    id: ticket.id,

    cliente: ticket.cliente,
    email: ticket.email,
    telefono: (ticket.telefono as any) ?? null,

    asunto: ticket.asunto,
    descripcion: ticket.descripcion,

    estado: ticket.estado as any,
    prioridad: ticket.prioridad as any,

    assigned_to_id: (ticket as any).assignedToId ?? null,
    asignado: (ticket as any).asignado ?? null,

    comentarios: ticket.comentarios ?? [],

    fecha: (ticket as any).fecha ?? null,
  };
}

export function useTickets(enabled: boolean, isAdmin: boolean) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
  if (!enabled) {
    setTickets([]);
    return;
  }

  setLoading(true);
  setError(null);

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) {
    setError(authErr.message);
    setTickets([]);
    setLoading(false);
    return;
  }

  const userId = auth?.user?.id;

  let q = supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  // Si NO es admin: mostrar "asignados a mí" + "sin asignar"
  if (!isAdmin) {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }
    q = q.or(`assigned_to_id.eq.${userId},assigned_to_id.is.null`);
  }

  const { data, error } = await q;

  if (error) {
    setError(error.message);
    setTickets([]);
    setLoading(false);
    return;
  }

  const mapped = ((data ?? []) as TicketDb[]).map(dbToTicket);
  setTickets(mapped);
  setLoading(false);
}, [enabled, isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

const updateTicket = useCallback(async (id: string, patch: Partial<Ticket>) => {
  const dbPatch = ticketPatchToDbPatch(patch);

  const { data, error } = await supabase
    .from("tickets")
    .update(dbPatch)
    .eq("id", id)
    .select("*"); // OJO: sin .single()

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    throw new Error(
      "No se pudo actualizar (0 filas). Probable: permisos/RLS o el filtro no matchea el ticket."
    );
  }

  const updated = dbToTicket(data[0] as TicketDb);
  setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
  return updated;
}, []);

 const appendComment = useCallback(
  async (id: string, newComment: string) => {
    // 1) Intento "admin" (update directo)
    try {
      const { data: current, error: readErr } = await supabase
        .from("tickets")
        .select("comentarios")
        .eq("id", id)
        .single();

      if (readErr) throw new Error(readErr.message);

      const next = [...(((current as any)?.comentarios as string[]) ?? []), newComment];

      // Si sos admin, esto va a funcionar
      return await updateTicket(id, { comentarios: next } as any);
    } catch (e: any) {
      // 2) Fallback seguro: RPC (para technician)
      const { data, error } = await supabase.rpc("append_ticket_comment", {
        p_ticket_id: id,
        p_comment: newComment,
      });

      if (error) throw new Error(error.message);

      // RPC retorna setof tickets -> normalmente array con 1 item
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("No se pudo actualizar el ticket");

      const updated = dbToTicket(row as any);

      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    }
  },
  [updateTicket]
);


const createTicket = useCallback(async (ticket: Ticket) => {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  if (!userId) throw new Error("No hay usuario autenticado");

  // 1. Llamamos al "Cerebro" (Edge Function) en lugar del insert directo
  const { data, error } = await supabase.functions.invoke('crear-ticket', {
    body: {
      cliente: ticket.cliente,
      email: ticket.email,
      telefono: ticket.telefono,
      asunto: ticket.asunto,
      descripcion: ticket.descripcion,
      categoria: ticket.categoria || 'General',
      // Mandamos el asignado (si el admin eligió a alguien) o null para activar balanceo
      assignedToId: (ticket as any).assignedToId ?? null, 
      // CRÍTICO: Le pasamos el ID de quien lo está creando para que no falle el RLS
      user_id: userId 
    }
  });

  if (error) {
    console.error("Error de la Edge Function:", error);
    throw new Error(error.message || "Error al crear el ticket desde el servidor");
  }

  // 2. La Edge Function nos devuelve el ticket listo. Lo pasamos por tu mapeador.
  const created = dbToTicket(data as TicketDb);
  
  // 3. Actualizamos el estado de React para que aparezca al instante en la tabla
  setTickets((prev) => [created, ...prev]);
  
  return created;
}, []);

  return {
    tickets,
    setTickets, 
    loading,
    error,
    refresh,
    updateTicket,
    appendComment,
    createTicket,
  };
}
