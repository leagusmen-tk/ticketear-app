import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Calendar, User, MessageSquare, Send, X, Loader2 } from "lucide-react";

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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-indigo-600">{selectedTicket.id}</span>
                  <span className="text-slate-600">-</span>
                  <span>{selectedTicket.asunto}</span>
                </DialogTitle>
                <DialogDescription>Detalles completos del ticket de soporte</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-slate-600" />
                      Información del Cliente
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-600">Nombre:</label>
                        <p>{selectedTicket.cliente}</p>
                      </div>
                      <div>
                        <label className="text-slate-600">Email:</label>
                        <p className="text-indigo-600">{selectedTicket.email}</p>
                      </div>
                      <div>
                        <label className="text-slate-600">Teléfono:</label>
                        <p>{selectedTicket.telefono}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-slate-600" />
                      Descripción del Problema
                    </h3>
                    <p className="text-slate-700 leading-relaxed">{selectedTicket.descripcion}</p>
                  </div>

                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="mb-4">Historial de Comentarios</h3>
                    <div className="space-y-3 mb-4">
                      {selectedTicket.comentarios.map((comentario, index) => (
                        <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                          <p className="text-slate-700">{comentario}</p>
                        </div>
                      ))}
                    </div>

                    {isReplying && (
                      <div className="border-t pt-4 space-y-3">
                        <label className="text-slate-600 mb-2 block">Nueva respuesta:</label>
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escribe tu respuesta aquí..."
                          className="min-h-[100px] resize-none"
                          disabled={savingReply}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={handleCancelReply}
                            className="flex items-center gap-2"
                            disabled={savingReply}
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSendReply}
                            disabled={!replyText.trim() || savingReply}
                            className="flex items-center gap-2"
                          >
                            {savingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {savingReply ? "Enviando..." : "Enviar"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="mb-4">Estado del Ticket</h3>

                    <label className="text-slate-600 block mb-1">Estado:</label>
                    {isChangingState ? (
                      <div className="space-y-3">
                        <Select
                          value={newEstado ?? ""}
                          onValueChange={(v: string) => setNewEstado(v as Estado)}
                          disabled={savingState}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS.map((estado) => (
                              <SelectItem key={estado} value={estado}>
                                {ESTADO_LABELS[estado]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleConfirmStateChange}
                            disabled={!newEstado || newEstado === selectedTicket.estado || savingState}
                            className="flex-1"
                          >
                            {savingState ? "Guardando..." : "Confirmar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelStateChange}
                            className="flex-1"
                            disabled={savingState}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      getEstadoBadge(selectedTicket.estado)
                    )}

                    <div className="mt-4">
                      <label className="text-slate-600 block mb-1">Prioridad:</label>
                      {getPrioridadBadge(selectedTicket.prioridad)}
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-slate-600" />
                      Asignación
                    </h3>

                    <label className="text-slate-600 block mb-1">Asignado a:</label>
                    {!isReassigning ? (
                      <p className={selectedTicket.assignedToId ? "text-slate-900" : "text-slate-400"}>
                        {selectedTicket.assignedToId
                          ? technicians.find((t) => t.id === selectedTicket.assignedToId)?.label ??
                            selectedTicket.asignado ??
                            "Técnico"
                          : "Sin asignar"}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <Select
                          value={newAssignedTo}
                          onValueChange={setNewAssignedTo}
                          disabled={techniciansLoading || !!techniciansError || savingReassign}
                        >
                          <SelectTrigger className="w-full">
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
                            {(technicians ?? []).map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={handleConfirmReassign}
                            disabled={!newAssignedTo || savingReassign}
                          >
                            {savingReassign ? "Guardando..." : "Confirmar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={handleCancelReassign}
                            disabled={savingReassign}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      Fechas
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-600 block mb-1">Creado:</label>
                        <p className="text-sm">{selectedTicket.fechaCreacion}</p>
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Última actualización:</label>
                        <p className="text-sm">{selectedTicket.ultimaActualizacion}</p>
                      </div>
                    </div>
                  </div>

                 <div className="bg-white border rounded-xl p-6">
  <h3 className="mb-4">Acciones</h3>

  {/* Mensajes guía (vendible) */}
  {!isAdmin && selectedTicket && !isAssignedToMeSelected && (
    <div className="text-xs text-slate-500 mb-3">
      {isUnassignedSelected
        ? "Este ticket está sin asignar. Podés autoasignártelo para trabajarlo."
        : "Solo el técnico asignado puede responder o cambiar el estado."}
    </div>
  )}

  {isAdmin && (
    <div className="text-xs text-slate-500 mb-3">
      El administrador gestiona la asignación. No responde ni cambia estados.
    </div>
  )}

  <div className="space-y-2">
    {/* Técnico: autoasignación solo si está sin asignar */}
    {!isAdmin && (
      <Button
        className="w-full"
        onClick={handleAutoAssign}
        disabled={
          !canTechAutoAssignSelected ||
          savingAutoAssign ||
          techniciansLoading ||
          !!techniciansError
        }
        title={
          !selectedTicket
            ? "Seleccioná un ticket"
            : !isUnassignedSelected
            ? "Solo disponible si el ticket está sin asignar"
            : undefined
        }
      >
        {savingAutoAssign ? "Asignando..." : "Autoasignarme"}
      </Button>
    )}

    {/* Técnico: trabajar ticket SOLO si está asignado a él */}
    <Button
      className="w-full"
      variant={isReplying ? "outline" : "default"}
      onClick={handleReply}
      disabled={isAdmin || !canTechWorkSelected}
      title={
        isAdmin
          ? "El administrador no responde tickets"
          : !canTechWorkSelected
          ? isUnassignedSelected
            ? "Autoasignate el ticket para poder responder"
            : "Solo el técnico asignado puede responder"
          : undefined
      }
    >
      {isReplying ? "Respondiendo..." : "Responder"}
    </Button>

    <Button
      className="w-full"
      variant="outline"
      onClick={handleChangeState}
      disabled={isAdmin || !canTechWorkSelected}
      title={
        isAdmin
          ? "El administrador no cambia estados"
          : !canTechWorkSelected
          ? isUnassignedSelected
            ? "Autoasignate el ticket para poder cambiar el estado"
            : "Solo el técnico asignado puede cambiar el estado"
          : undefined
      }
    >
      {isChangingState ? "Cambiando..." : "Cambiar Estado"}
    </Button>

    {/* Admin: reasignar */}
    {isAdmin && (
      <Button
        className="w-full"
        variant="outline"
        onClick={handleReassign}
        disabled={!canAdminReassignSelected || techniciansLoading || !!techniciansError}
        title={techniciansLoading ? "Cargando técnicos…" : techniciansError ? "Error cargando técnicos" : undefined}
      >
        {isReassigning ? "Reasignando..." : "Reasignar"}
      </Button>
    )}
  </div>
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
