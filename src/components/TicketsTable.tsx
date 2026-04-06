import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Calendar, User, MessageSquare, Send, X, Loader2, Bot } from "lucide-react";


import { CreateTicket } from "./CreateTicket";
import type { Ticket, Estado } from "../types/ticket";
import { ESTADOS, ESTADO_LABELS } from "../data/tickets";

type TechnicianOption = { id: string; label: string };

const UNASSIGNED = "__unassigned__";

interface TicketsTableProps {
  tickets: Ticket[];
  setTickets: Dispatch<SetStateAction<Ticket[]>>; // lo dejamos por compatibilidad
  technicians: TechnicianOption[];

  techniciansLoading?: boolean;
  techniciansError?: string | null;

  currentUserName: string;

  isAdmin: boolean;
  currentUserId: string;

  updateTicket: (id: string, patch: Partial<Ticket>) => Promise<Ticket>;
  appendComment: (id: string, comment: string) => Promise<Ticket>;
  createTicket: (ticket: Ticket) => Promise<Ticket>;
}

function formatNowEs(): string {
  const now = new Date();
  return (
    now.toLocaleDateString("es-ES") +
    " " +
    now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDisplayDate(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString; // Si por algo falla, devuelve el original
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function TicketsTable({
  tickets,
  setTickets,
  technicians = [],
  techniciansLoading = false,
  techniciansError = null,

  currentUserId,
  currentUserName,
  isAdmin,

  updateTicket,
  appendComment,
  createTicket,
}: TicketsTableProps) {

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [prioridadFilter, setPrioridadFilter] = useState("");

  // "" = sin filtro | "__unassigned__" = sin asignar | "<uuid>" = técnico
  const [asignadoFilter, setAsignadoFilter] = useState("");

  // FILTROS APLICADOS
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedEstado, setAppliedEstado] = useState("");
  const [appliedPrioridad, setAppliedPrioridad] = useState("");
  const [appliedAsignado, setAppliedAsignado] = useState("");

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.id.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        ticket.cliente.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        ticket.asunto.toLowerCase().includes(appliedSearch.toLowerCase());

      const matchesEstado = !appliedEstado || ticket.estado === appliedEstado;
      const matchesPrioridad = !appliedPrioridad || ticket.prioridad === appliedPrioridad;

      const matchesAsignado =
        !appliedAsignado ||
        (appliedAsignado === UNASSIGNED
          ? !ticket.assignedToId
          : ticket.assignedToId === appliedAsignado);

      return matchesSearch && matchesEstado && matchesPrioridad && matchesAsignado;
    });
  }, [tickets, appliedSearch, appliedEstado, appliedPrioridad, appliedAsignado]);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [isChangingState, setIsChangingState] = useState(false);
  const [newEstado, setNewEstado] = useState<Estado | null>(null);

  const [isReassigning, setIsReassigning] = useState(false);
  const [newAssignedTo, setNewAssignedTo] = useState<string>("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  // estados vendibles
  const [savingReply, setSavingReply] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [savingReassign, setSavingReassign] = useState(false);
  const [savingAutoAssign, setSavingAutoAssign] = useState(false);


  const applyFilter = () => {
    setAppliedSearch(searchTerm);
    setAppliedEstado(estadoFilter);
    setAppliedPrioridad(prioridadFilter);
    setAppliedAsignado(asignadoFilter);
  };

  const clearFilter = () => {
    setSearchTerm("");
    setEstadoFilter("");
    setPrioridadFilter("");
    setAsignadoFilter("");

    setAppliedSearch("");
    setAppliedEstado("");
    setAppliedPrioridad("");
    setAppliedAsignado("");
  };

  const meLabel = useMemo(() => {
  const fromList = technicians.find((t) => t.id === currentUserId)?.label;
  return (fromList ?? currentUserName ?? "Técnico").toString();
}, [technicians, currentUserId, currentUserName]);

const isUnassignedSelected = !selectedTicket?.assignedToId;
const isAssignedToMeSelected = !!selectedTicket?.assignedToId && selectedTicket?.assignedToId === currentUserId;

// Reglas vendibles:
const canTechAutoAssignSelected = !isAdmin && !!selectedTicket && isUnassignedSelected;
const canTechWorkSelected = !isAdmin && !!selectedTicket && isAssignedToMeSelected;
const canAdminReassignSelected = isAdmin && !!selectedTicket;


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") applyFilter();
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDialogOpen(true);

    setIsReplying(false);
    setReplyText("");

    setIsChangingState(false);
    setNewEstado(null);

    setIsReassigning(false);
    setNewAssignedTo("");
  };

  const handleReply = () => setIsReplying(true);

  const handleCancelReply = () => {
    if (savingReply) return;
    setIsReplying(false);
    setReplyText("");
  };

  // Responder (persistido)
  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || savingReply) return;

    const formattedDate = formatNowEs();
    const newComment = `[${formattedDate}] Soporte: ${replyText.trim()}`;

    try {
      setSavingReply(true);
      await appendComment(selectedTicket.id, newComment);

      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              comentarios: [...prev.comentarios, newComment],
              ultimaActualizacion: formattedDate,
            }
          : prev
      );

      setIsReplying(false);
      setReplyText("");
      toast.success("Respuesta enviada");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar la respuesta");
    } finally {
      setSavingReply(false);
    }
  };

  // permisos por ticket
const isAssignedToMe =
  (selectedTicket?.assignedToId ?? "") === currentUserId ||
  ((selectedTicket?.asignado ?? "").trim() !== "" &&
    (selectedTicket?.asignado ?? "").trim() === (currentUserName ?? "").trim());

const canChangeState = isAdmin || isAssignedToMe;
const canReassign = isAdmin;


  const handleChangeState = () => {
    if (!canChangeState) return;
    setIsChangingState(true);
    setNewEstado(selectedTicket?.estado || null);
  };

  const handleCancelStateChange = () => {
    if (savingState) return;
    setIsChangingState(false);
    setNewEstado(null);
  };

  // Cambiar estado (persistido)
  const handleConfirmStateChange = async () => {
    if (!selectedTicket || !newEstado || newEstado === selectedTicket.estado || savingState) {
      setIsChangingState(false);
      setNewEstado(null);
      return;
    }

    if (!canChangeState) {
      toast.error("No tenés permisos para cambiar el estado de este ticket");
      setIsChangingState(false);
      setNewEstado(null);
      return;
    }

    const formattedDate = formatNowEs();
    const statusChangeComment = `[${formattedDate}] Sistema: Estado cambiado de "${selectedTicket.estado}" a "${newEstado}"`;

    try {
      setSavingState(true);

      await updateTicket(selectedTicket.id, {
        estado: newEstado,
        ultimaActualizacion: formattedDate,
      });

      await appendComment(selectedTicket.id, statusChangeComment);

      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              estado: newEstado,
              comentarios: [...prev.comentarios, statusChangeComment],
              ultimaActualizacion: formattedDate,
            }
          : prev
      );

      toast.success("Estado actualizado");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo actualizar el estado");
    } finally {
      setSavingState(false);
      setIsChangingState(false);
      setNewEstado(null);
    }
  };

const handleReassign = () => {
  if (!isAdmin) {
    toast.info("Solo un administrador puede reasignar tickets.");
    return;
  }
  setIsReassigning(true);
  setNewAssignedTo(selectedTicket?.assignedToId ?? UNASSIGNED);
};


  const handleCancelReassign = () => {
    if (savingReassign) return;
    setIsReassigning(false);
    setNewAssignedTo("");
  };

  // Reasignar (persistido)
  const handleConfirmReassign = async () => {
    if (!isAdmin) {
  toast.info("Solo un administrador puede reasignar tickets.");
  return;
}

    if (!selectedTicket || !newAssignedTo || savingReassign) return;

    if (!canReassign) {
      toast.error("Solo un administrador puede reasignar tickets");
      return;
    }

    const resolvedAssignedToId = newAssignedTo === UNASSIGNED ? null : newAssignedTo;

    const label =
      resolvedAssignedToId === null
        ? "Sin asignar"
        : technicians.find((t) => t.id === resolvedAssignedToId)?.label ?? "Técnico";

    const formattedDate = formatNowEs();
    const reassignComment = `[${formattedDate}] Sistema: Ticket reasignado a "${label}"`;

    try {
      setSavingReassign(true);

      await updateTicket(
        selectedTicket.id,
        {
          asignado: label,
          assignedToId: resolvedAssignedToId,
          ultimaActualizacion: formattedDate,
        } as any
      );

      await appendComment(selectedTicket.id, reassignComment);

      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              asignado: label,
              assignedToId: resolvedAssignedToId,
              comentarios: [...prev.comentarios, reassignComment],
              ultimaActualizacion: formattedDate,
            }
          : prev
      );

      toast.success("Ticket reasignado");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo reasignar el ticket");
    } finally {
      setSavingReassign(false);
      setIsReassigning(false);
      setNewAssignedTo("");
    }
  };

  const handleAutoAssign = async () => {
  if (!selectedTicket || savingAutoAssign) return;
  if (isAdmin) return; // Admin no trabaja tickets
  if (selectedTicket.assignedToId) {
    toast.info("Este ticket ya está asignado.");
    return;
  }

  const formattedDate = formatNowEs();
  const comment = `[${formattedDate}] Sistema: Ticket autoasignado a "${meLabel}"`;

  try {
    setSavingAutoAssign(true);

    await updateTicket(
      selectedTicket.id,
      {
        asignado: meLabel,
        assignedToId: currentUserId,
        ultimaActualizacion: formattedDate,
      } as any
    );

    await appendComment(selectedTicket.id, comment);

    setSelectedTicket((prev) =>
      prev
        ? {
            ...prev,
            asignado: meLabel,
            assignedToId: currentUserId,
            comentarios: [...prev.comentarios, comment],
            ultimaActualizacion: formattedDate,
          }
        : prev
    );

    toast.success("Ticket asignado a vos");
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    // Evita el “feo” de 0 rows afectadas:
    if (msg.toLowerCase().includes("0 rows") || msg.toLowerCase().includes("0 fila")) {
      toast.error("No tenés permisos para autoasignarte este ticket.");
    } else {
      toast.error(msg || "No se pudo autoasignar el ticket");
    }
  } finally {
    setSavingAutoAssign(false);
  }
};


// Crear ticket (persistido)
  const handleTicketCreated = async (newTicket: Ticket) => {
    try {
      const created = await createTicket(newTicket); 
      toast.success(`Ticket ${created.id} creado`);
      return created;
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo crear el ticket");
      throw e;
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    const styles = {
      Alta: "bg-red-100 text-red-800",
      Media: "bg-yellow-100 text-yellow-800",
      Baja: "bg-green-100 text-green-800",
    };
    return <Badge className={styles[prioridad as keyof typeof styles]}>{prioridad}</Badge>;
  };

  const getEstadoBadge = (estado: string) => {
    const styles = {
      Abierto: "bg-red-100 text-red-700",
      "En Progreso": "bg-yellow-100 text-yellow-800",
      "En Espera": "bg-orange-100 text-orange-700",
      Resuelto: "bg-blue-100 text-blue-700",
      Cerrado: "bg-green-100 text-green-700",
    };

    const dotStyles = {
      Abierto: "bg-red-500",
      "En Progreso": "bg-yellow-500",
      "En Espera": "bg-orange-500",
      Resuelto: "bg-blue-500",
      Cerrado: "bg-green-500",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
          styles[estado as keyof typeof styles]
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[estado as keyof typeof dotStyles]}`} />
        {estado}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col gap-4">
          {techniciansLoading && <div className="text-sm text-slate-500">Cargando técnicos…</div>}

          {!!techniciansError && (
            <div className="text-sm text-red-600">
              No se pudieron cargar los técnicos: {techniciansError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Buscar tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-xl border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="rounded-xl border-slate-300 px-3 py-2.5 min-w-[120px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abierto">Abierto</SelectItem>
                  <SelectItem value="En Progreso">En Progreso</SelectItem>
                  <SelectItem value="En Espera">En Espera</SelectItem>
                  <SelectItem value="Resuelto">Resuelto</SelectItem>
                  <SelectItem value="Cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                <SelectTrigger className="rounded-xl border-slate-300 px-3 py-2.5 min-w-[120px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={asignadoFilter}
                onValueChange={setAsignadoFilter}
                disabled={techniciansLoading || !!techniciansError}
              >
                <SelectTrigger className="rounded-xl border-slate-300 px-3 py-2.5 min-w-[160px]">
                  <SelectValue
                    placeholder={techniciansLoading ? "Cargando…" : techniciansError ? "Error técnicos" : "Asignado"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
                  {(technicians ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <CreateTicket
              onTicketCreated={handleTicketCreated}
              existingTicketIds={tickets.map((t) => t.id)}
              existingTickets={tickets}
              technicians={technicians}
              techniciansLoading={techniciansLoading}
              techniciansError={techniciansError}
            />

            <div className="flex gap-2">
              <Button onClick={clearFilter} variant="outline" className="px-3 py-2.5 rounded-xl">
                Limpiar
              </Button>
              <Button onClick={applyFilter} className="px-3 py-2.5 rounded-xl bg-indigo-600 text-white">
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="text-left text-[11px] sm:text-xs uppercase tracking-wide text-slate-500">
                <TableHead className="px-4 sm:px-6 py-3">ID</TableHead>
                <TableHead className="px-4 sm:px-6 py-3">Cliente</TableHead>
                <TableHead className="px-4 sm:px-6 py-3">Asunto</TableHead>
                <TableHead className="px-4 sm:px-6 py-3">Estado</TableHead>
                <TableHead className="px-4 sm:px-6 py-3">Asignado a</TableHead>
                <TableHead className="px-4 sm:px-6 py-3">Fecha</TableHead>
                <TableHead className="px-4 sm:px-6 py-3 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100 text-sm">
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-slate-50">
                  <TableCell className="px-4 sm:px-6 py-4 text-slate-900 whitespace-nowrap">{ticket.id}</TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">{ticket.cliente}</TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 max-w-xs truncate">{ticket.asunto}</TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">{getEstadoBadge(ticket.estado)}</TableCell>

                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-600">
                    {ticket.assignedToId
                      ? technicians.find((t) => t.id === ticket.assignedToId)?.label ??
                        ticket.asignado ??
                        "Técnico"
                      : "Sin asignar"}
                  </TableCell>

                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-600">
                    {ticket.fecha}
                  </TableCell>

                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleViewTicket(ticket)} className="text-indigo-600 hover:text-indigo-800">
                      Ver
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-slate-500">No se encontraron tickets.</div>
          )}
        </div>
      </section>

{/* Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] w-[95vw] max-h-[90vh] overflow-y-auto bg-slate-50 p-4 sm:p-8 border-slate-200 shadow-2xl rounded-2xl">
          {selectedTicket && (
            <>
              <DialogHeader className="mb-2">
                <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                  <span className="text-indigo-600 font-bold bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200">
                    {selectedTicket.id}
                  </span>
                  <span className="text-slate-800 font-semibold">{selectedTicket.asunto}</span>
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-2 text-base">
                  Detalles operativos del ticket
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                
                {/* COLUMNA PRINCIPAL (Izquierda) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Tarjeta: Info del Cliente */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="flex items-center gap-2 mb-6 text-base font-bold text-slate-800">
                      <User className="w-5 h-5 text-indigo-500" />
                      Información del Cliente
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nombre</label>
                        <p className="text-slate-900 font-medium">{selectedTicket.cliente}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Email</label>
                        <p>
                          {selectedTicket.email ? (
                            <a href={`mailto:${selectedTicket.email}`} className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline break-all">
                              {selectedTicket.email}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">No provisto</span>
                          )}
                        </p>
                      </div>
                      <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Teléfono</label>
                        <p className="text-slate-900 font-medium">{selectedTicket.telefono || <span className="text-slate-400 italic">No provisto</span>}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta: Descripción */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="flex items-center gap-2 mb-4 text-base font-bold text-slate-800">
                      <MessageSquare className="w-5 h-5 text-indigo-500" />
                      Descripción del Problema
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-sm">
                      <p className="text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                        {selectedTicket.descripcion}
                      </p>
                    </div>
                  </div>

                  {/* Tarjeta: Comentarios */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-5">Historial de Comentarios</h3>
                    <div className="space-y-4 mb-6">
                      {selectedTicket.comentarios.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                          <p className="text-sm text-slate-500 italic">No hay comentarios aún en este ticket.</p>
                        </div>
                      ) : (
                        selectedTicket.comentarios.map((comentario, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="mt-2">
                              <div className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-50" />
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm">
                              <p className="text-[14px] text-slate-800 whitespace-pre-wrap leading-relaxed">{comentario}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Caja de respuesta */}
                    {isReplying && (
                      <div className="border-t border-slate-100 pt-5 mt-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Escribir respuesta:</label>
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Ingresá los detalles de la resolución o el mensaje para el cliente..."
                          className="min-h-[120px] resize-none focus:ring-2 focus:ring-indigo-500 rounded-xl bg-white border-slate-200 text-slate-800"
                          disabled={savingReply}
                        />
                        <div className="flex gap-3 justify-end mt-4">
                          <Button variant="outline" onClick={handleCancelReply} disabled={savingReply} className="px-5">
                            <X className="w-4 h-4 mr-2" /> Cancelar
                          </Button>
                          <Button onClick={handleSendReply} disabled={!replyText.trim() || savingReply} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 px-6">
                            {savingReply ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            {savingReply ? "Guardando..." : "Enviar Respuesta"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              {/* BARRA LATERAL (Derecha) */}
                <div className="space-y-6">
                  
                  {/* Tarjeta: Estado y Prioridad */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-5">Estado & Prioridad</h3>
                    
                    <div className="space-y-5">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Estado Actual</label>
                        {isChangingState ? (
                          <div className="space-y-3 mt-2">
                            <Select value={newEstado ?? ""} onValueChange={(v: string) => setNewEstado(v as Estado)} disabled={savingState}>
                              <SelectTrigger className="w-full rounded-lg bg-white border-slate-200"><SelectValue placeholder="Estado" /></SelectTrigger>
                              <SelectContent>
                                {ESTADOS.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABELS[e]}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            {/* MODIFICADO: Grilla de 2 columnas estricta */}
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <Button size="sm" onClick={handleConfirmStateChange} disabled={!newEstado || newEstado === selectedTicket.estado || savingState} className="bg-indigo-600 text-white border-0 hover:bg-indigo-700 w-full">
                                Confirmar
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelStateChange} disabled={savingState} className="w-full bg-white">
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1">{getEstadoBadge(selectedTicket.estado)}</div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Nivel de Prioridad</label>
                        <div className="mt-1">{getPrioridadBadge(selectedTicket.prioridad)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta: Asignación */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Asignación</h3>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Técnico Responsable</label>
                    
                    {!isReassigning ? (
                      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-sm shrink-0">
                          {selectedTicket.assignedToId ? 
                            (technicians.find((t) => t.id === selectedTicket.assignedToId)?.label.charAt(0) ?? "T") 
                            : "?"}
                        </div>
                        <p className={`font-semibold text-[15px] ${selectedTicket.assignedToId ? "text-slate-900" : "text-slate-500 italic"}`}>
                          {selectedTicket.assignedToId
                            ? technicians.find((t) => t.id === selectedTicket.assignedToId)?.label ?? selectedTicket.asignado ?? "Técnico"
                            : "Ticket sin asignar"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                        <Select value={newAssignedTo} onValueChange={setNewAssignedTo} disabled={techniciansLoading || !!techniciansError || savingReassign}>
                          <SelectTrigger className="w-full rounded-lg bg-white border-slate-200">
                            <SelectValue placeholder={techniciansLoading ? "Cargando…" : "Elegir técnico..."} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
                            {(technicians ?? []).map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* MODIFICADO: Grilla de 2 columnas estricta */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button size="sm" onClick={handleConfirmReassign} disabled={!newAssignedTo || savingReassign} className="bg-indigo-600 text-white border-0 hover:bg-indigo-700 w-full">
                            Confirmar
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelReassign} disabled={savingReassign} className="w-full bg-white">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tarjeta: Fechas */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-5">
                      <Calendar className="w-5 h-5 text-indigo-500" /> Registro de Tiempos
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Creado</label>
                        <p className="text-sm font-semibold text-slate-900">{formatDisplayDate(selectedTicket.fechaCreacion)}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actualizado</label>
                        <p className="text-sm font-semibold text-slate-900">{formatDisplayDate(selectedTicket.ultimaActualizacion)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta: Panel de Acciones Rapidas */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Bot className="w-5 h-5 text-indigo-500" />
                      Acciones Rápidas
                    </h3>

                    {/* MODIFICADO: Lógica condicional limpia para Admin vs Técnico */}
                    {isAdmin ? (
                      <div className="space-y-4">
                        <div className="bg-indigo-50 text-indigo-800 text-[13px] p-4 rounded-xl border border-indigo-100 leading-relaxed">
                          <strong>Modo Administrador:</strong> Tenés control para reasignar la carga de trabajo, pero la gestión directa del ticket corresponde al técnico.
                        </div>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11 transition-colors" onClick={handleReassign} disabled={!canAdminReassignSelected}>
                          {isReassigning ? "Cargando..." : "Reasignar Técnico"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {!isAssignedToMeSelected && (
                          <div className="text-[13px] text-slate-600 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                            {isUnassignedSelected
                              ? "Este ticket está libre. Podés autoasignártelo para empezar a trabajarlo."
                              : "Solo el técnico asignado puede responder o cambiar el estado."}
                          </div>
                        )}

                        <Button className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200 font-semibold h-11 border border-slate-200 transition-colors" onClick={handleAutoAssign} disabled={!canTechAutoAssignSelected || savingAutoAssign}>
                          {savingAutoAssign ? "Asignando..." : "Autoasignarme este ticket"}
                        </Button>

                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 border-0 text-white font-semibold h-11 transition-colors" onClick={handleReply} disabled={!canTechWorkSelected}>
                          Responder al Cliente
                        </Button>

                        <Button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold h-11 transition-colors" onClick={handleChangeState} disabled={!canTechWorkSelected}>
                          Cambiar Estado
                        </Button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
