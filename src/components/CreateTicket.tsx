import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import type { Ticket } from "../types/ticket";

type TechnicianOption = { id: string; label: string };
type Prioridad = "Alta" | "Media" | "Baja";

const UNASSIGNED = "__unassigned__";

interface CreateTicketProps {
  // TicketsTable te pasa esto y adentro persiste en Supabase
  onTicketCreated: (ticket: Ticket) => Promise<Ticket> | Ticket;

  existingTicketIds: string[];
  existingTickets: Ticket[];

  technicians?: TechnicianOption[];
  techniciansLoading?: boolean;
  techniciansError?: string | null;
}

function formatNowEs(): string {
  const now = new Date();
  return (
    now.toLocaleDateString("es-ES") +
    " " +
    now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  );
}

function nextTicketId(existingIds: string[]): string {
  let max = 0;

  for (const id of existingIds) {
    const m = id.match(/(\d+)\s*$/);
    if (!m) continue;
    const n = Number(m[1]);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }

  const next = max + 1;
  return `TCK-${String(next).padStart(3, "0")}`;
}

export function CreateTicket({
  onTicketCreated,
  existingTicketIds,
  existingTickets,
  technicians = [],
  techniciansLoading = false,
  techniciansError = null,
}: CreateTicketProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [cliente, setCliente] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [prioridad, setPrioridad] = useState<Prioridad>("Media");
  const [assignedToId, setAssignedToId] = useState<string>(UNASSIGNED);

  const assignedLabel = useMemo(() => {
    if (assignedToId === UNASSIGNED) return "Sin asignar";
    return technicians.find((t) => t.id === assignedToId)?.label ?? "Técnico";
  }, [assignedToId, technicians]);

  const canSubmit =
    !!cliente.trim() &&
    !!email.trim() &&
    !!asunto.trim() &&
    !!descripcion.trim() &&
    !submitting;

  const reset = () => {
    setCliente("");
    setEmail("");
    setTelefono("");
    setAsunto("");
    setDescripcion("");
    setPrioridad("Media");
    setAssignedToId(UNASSIGNED);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const nowIso = new Date().toISOString(); // para DB
    const nowLabel = formatNowEs(); // para UI/comentarios

    const id = nextTicketId(existingTicketIds);

    // Evitar ID duplicado por si el usuario abre 2 veces el modal, etc.
    if (existingTickets.some((t) => t.id === id)) {
      toast.error("Ya existe un ticket con ese ID. Probá de nuevo.");
      return;
    }

    const ticket: Ticket = {
      id,
      cliente: cliente.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      asunto: asunto.trim(),
      descripcion: descripcion.trim(),

      estado: "Abierto" as any,
      prioridad: prioridad as any,

      asignado: assignedToId === UNASSIGNED ? "Sin asignar" : assignedLabel,
      assignedToId: assignedToId === UNASSIGNED ? null : assignedToId,

      comentarios: [`[${nowLabel}] Sistema: Ticket creado`],

      // Si tu columna "fecha" es timestamp, esto evita el error de formato
      fecha: nowIso,
      // Solo para la UI (la DB se guía por created_at/updated_at)
      fechaCreacion: nowIso,
      ultimaActualizacion: nowIso,
    } as any;

    try {
      setSubmitting(true);

      // ESTE ES EL AWAIT QUE TE FALTABA IDENTIFICAR
      await onTicketCreated(ticket);

      setOpen(false);
      reset();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo crear el ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-xl bg-indigo-600 text-white">
        Crear ticket
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen: boolean) => {
          // mientras está creando, no dejamos cerrar para evitar estados raros
          if (submitting) return;
          setOpen(nextOpen);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo ticket</DialogTitle>
            <DialogDescription>
              Completá los datos para registrar un nuevo ticket de soporte.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Cliente *"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                disabled={submitting}
              />
              <Input
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
              <Input
                placeholder="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                disabled={submitting}
              />

              <Select
                value={prioridad}
                onValueChange={(v: string) => setPrioridad(v as Prioridad)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Asunto *"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              disabled={submitting}
            />

            <Textarea
              placeholder="Descripción *"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="min-h-[120px]"
              disabled={submitting}
            />

            <div className="space-y-2">
              <div className="text-sm text-slate-600">Asignar a</div>

              {techniciansLoading && (
                <div className="text-sm text-slate-500">Cargando técnicos…</div>
              )}

              {!!techniciansError && (
                <div className="text-sm text-red-600">
                  No se pudieron cargar técnicos: {techniciansError}
                </div>
              )}

              <Select
                value={assignedToId}
                onValueChange={(v: string) => setAssignedToId(v)}
                disabled={submitting || techniciansLoading || !!techniciansError}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      techniciansLoading
                        ? "Cargando…"
                        : techniciansError
                        ? "Error técnicos"
                        : "Seleccionar técnico"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (submitting) return;
                  setOpen(false);
                  reset();
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-indigo-600 text-white"
              >
                {submitting ? "Creando..." : "Crear ticket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
