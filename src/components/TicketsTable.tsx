import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Calendar, Clock, User, Flag, MessageSquare, Send, X } from "lucide-react";
import { CreateTicket } from "./CreateTicket";
import { type Ticket, type Estado, type Tecnico, ESTADOS, ESTADO_LABELS, TECNICOS } from "../data/tickets";



interface TicketsTableProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
}

export function TicketsTable({ tickets, setTickets }: TicketsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [prioridadFilter, setPrioridadFilter] = useState("");
  const [asignadoFilter, setAsignadoFilter] = useState("");
  const [filteredTickets, setFilteredTickets] = useState(tickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isChangingState, setIsChangingState] = useState(false);
  const [newEstado, setNewEstado] = useState<Estado | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);
  const [newAsignado, setNewAsignado] = useState<Tecnico | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const applyFilter = () => {
    const filtered = tickets.filter(ticket => {  // Cambio: usar tickets en lugar de initialTickets
      const matchesSearch = 
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.asunto.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEstado = !estadoFilter || ticket.estado === estadoFilter;
      const matchesPrioridad = !prioridadFilter || ticket.prioridad === prioridadFilter;
      const matchesAsignado = !asignadoFilter || ticket.asignado === asignadoFilter;

      return matchesSearch && matchesEstado && matchesPrioridad && matchesAsignado;
    });
    setFilteredTickets(filtered);
  };

  const clearFilter = () => {
    setSearchTerm("");
    setEstadoFilter("");
    setPrioridadFilter("");
    setAsignadoFilter("");
    setFilteredTickets(tickets);  // Cambio: usar tickets en lugar de initialTickets
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilter();
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDialogOpen(true);
    setIsReplying(false);
    setReplyText("");
    setIsChangingState(false);
    setNewEstado(null);
    setIsReassigning(false);
    setNewAsignado(null);
  };

  const handleReply = () => {
    setIsReplying(true);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyText("");
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES') + ' ' + 
                          now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const newComment = `[${formattedDate}] Soporte: ${replyText.trim()}`;

    // Actualizar el ticket en la lista principal
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        return {
          ...ticket,
          comentarios: [...ticket.comentarios, newComment],
          ultimaActualizacion: formattedDate
        };
      }
      return ticket;
    });

    // Actualizar el ticket seleccionado
    const updatedSelectedTicket = {
      ...selectedTicket,
      comentarios: [...selectedTicket.comentarios, newComment],
      ultimaActualizacion: formattedDate
    };

    setTickets(updatedTickets);
    setSelectedTicket(updatedSelectedTicket);
    
    // Aplicar filtros para actualizar la tabla filtrada
    const filtered = updatedTickets.filter(ticket => {
      const matchesSearch = 
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.asunto.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEstado = !estadoFilter || ticket.estado === estadoFilter;
      const matchesPrioridad = !prioridadFilter || ticket.prioridad === prioridadFilter;
      const matchesAsignado = !asignadoFilter || ticket.asignado === asignadoFilter;

      return matchesSearch && matchesEstado && matchesPrioridad && matchesAsignado;
    });
    setFilteredTickets(filtered);

    // Limpiar el formulario de respuesta
    setIsReplying(false);
    setReplyText("");
  };

  const handleChangeState = () => {
    setIsChangingState(true);
    setNewEstado(selectedTicket?.estado || null);
  };

  const handleCancelStateChange = () => {
    setIsChangingState(false);
    setNewEstado(null);
  };

  const handleConfirmStateChange = () => {
    if (!selectedTicket || !newEstado || newEstado === selectedTicket.estado) {
      setIsChangingState(false);
      setNewEstado(null);
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES') + ' ' + 
                          now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const statusChangeComment = `[${formattedDate}] Sistema: Estado cambiado de "${selectedTicket.estado}" a "${newEstado}"`;

    // Actualizar el ticket en la lista principal
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        return {
          ...ticket,
          estado: newEstado,
          comentarios: [...ticket.comentarios, statusChangeComment],
          ultimaActualizacion: formattedDate
        };
      }
      return ticket;
    });

    // Actualizar el ticket seleccionado
    const updatedSelectedTicket = {
      ...selectedTicket,
      estado: newEstado,
      comentarios: [...selectedTicket.comentarios, statusChangeComment],
      ultimaActualizacion: formattedDate
    };

    setTickets(updatedTickets);
    setSelectedTicket(updatedSelectedTicket);
    
    // Aplicar filtros para actualizar la tabla filtrada
    const filtered = updatedTickets.filter(ticket => {
      const matchesSearch = 
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.asunto.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEstado = !estadoFilter || ticket.estado === estadoFilter;
      const matchesPrioridad = !prioridadFilter || ticket.prioridad === prioridadFilter;
      const matchesAsignado = !asignadoFilter || ticket.asignado === asignadoFilter;

      return matchesSearch && matchesEstado && matchesPrioridad && matchesAsignado;
    });
    setFilteredTickets(filtered);

    // Limpiar el formulario de cambio de estado
    setIsChangingState(false);
    setNewEstado(null);
  };

  const handleReassign = () => {
    setIsReassigning(true);
    setNewAsignado(selectedTicket?.asignado as Tecnico || null);
  };

  const handleCancelReassign = () => {
    setIsReassigning(false);
    setNewAsignado(null);
  };

  const handleConfirmReassign = () => {
    if (!selectedTicket || !newAsignado || newAsignado === selectedTicket.asignado) {
      setIsReassigning(false);
      setNewAsignado(null);
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES') + ' ' + 
                          now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const reassignComment = `[${formattedDate}] Sistema: Ticket reasignado de "${selectedTicket.asignado}" a "${newAsignado}"`;

    // Actualizar el ticket en la lista principal
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        return {
          ...ticket,
          asignado: newAsignado,
          comentarios: [...ticket.comentarios, reassignComment],
          ultimaActualizacion: formattedDate
        };
      }
      return ticket;
    });

    // Actualizar el ticket seleccionado
    const updatedSelectedTicket = {
      ...selectedTicket,
      asignado: newAsignado,
      comentarios: [...selectedTicket.comentarios, reassignComment],
      ultimaActualizacion: formattedDate
    };

    setTickets(updatedTickets);
    setSelectedTicket(updatedSelectedTicket);
    
    // Aplicar filtros para actualizar la tabla filtrada
    const filtered = updatedTickets.filter(ticket => {
      const matchesSearch = 
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.asunto.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEstado = !estadoFilter || ticket.estado === estadoFilter;
      const matchesPrioridad = !prioridadFilter || ticket.prioridad === prioridadFilter;
      const matchesAsignado = !asignadoFilter || ticket.asignado === asignadoFilter;

      return matchesSearch && matchesEstado && matchesPrioridad && matchesAsignado;
    });
    setFilteredTickets(filtered);

    // Limpiar el formulario de reasignación
    setIsReassigning(false);
    setNewAsignado(null);
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    // Agregar el nuevo ticket al principio de la lista
    const updatedTickets = [newTicket, ...tickets];
    setTickets(updatedTickets);
    
    // Aplicar filtros para actualizar la tabla filtrada
    const filtered = updatedTickets.filter(ticket => {
      const matchesSearch = 
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.asunto.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEstado = !estadoFilter || ticket.estado === estadoFilter;
      const matchesPrioridad = !prioridadFilter || ticket.prioridad === prioridadFilter;
      const matchesAsignado = !asignadoFilter || ticket.asignado === asignadoFilter;

      return matchesSearch && matchesEstado && matchesPrioridad && matchesAsignado;
    });
    setFilteredTickets(filtered);
  };

  const getPrioridadBadge = (prioridad: string) => {
    const styles = {
      "Alta": "bg-red-100 text-red-800",
      "Media": "bg-yellow-100 text-yellow-800",
      "Baja": "bg-green-100 text-green-800"
    };
    return <Badge className={styles[prioridad as keyof typeof styles]}>{prioridad}</Badge>;
  };

  const getEstadoBadge = (estado: string) => {
    const styles = {
      "Abierto": "bg-red-100 text-red-700",
      "En Progreso": "bg-yellow-100 text-yellow-800",
      "En Espera": "bg-orange-100 text-orange-700",
      "Resuelto": "bg-blue-100 text-blue-700", 
      "Cerrado": "bg-green-100 text-green-700"
    };
    
    const dotStyles = {
      "Abierto": "bg-red-500",
      "En Progreso": "bg-yellow-500",
      "En Espera": "bg-orange-500",
      "Resuelto": "bg-blue-500",
      "Cerrado": "bg-green-500"
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${styles[estado as keyof typeof styles]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[estado as keyof typeof dotStyles]}`}></span>
        {estado}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col gap-4">
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
                <SelectTrigger className="rounded-xl border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 min-w-[120px]">
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
                <SelectTrigger className="rounded-xl border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 min-w-[120px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={asignadoFilter} onValueChange={setAsignadoFilter}>
                <SelectTrigger className="rounded-xl border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 min-w-[120px]">
                  <SelectValue placeholder="Asignado" />
                </SelectTrigger>
                <SelectContent>
                  {TECNICOS.map((tecnico) => (
                    <SelectItem key={tecnico} value={tecnico}>
                      {tecnico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <CreateTicket 
              onTicketCreated={handleTicketCreated}
              existingTicketIds={tickets.map(t => t.id)}
              existingTickets={tickets}
            />
            <div className="flex gap-2">
              <Button 
                onClick={clearFilter} 
                variant="outline"
                className="px-3 py-2.5 rounded-xl border-slate-300 hover:bg-slate-50"
              >
                Limpiar
              </Button>
              <Button 
                onClick={applyFilter}
                className="px-3 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Table Section */}
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
                  <TableCell className="px-4 sm:px-6 py-4 text-slate-900 whitespace-nowrap">
                    {ticket.id}
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {ticket.cliente}
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 max-w-xs truncate">
                    {ticket.asunto}
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {getEstadoBadge(ticket.estado)}
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-600">
                    {ticket.asignado}
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-600">
                    {ticket.fecha}
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => handleViewTicket(ticket)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Ver
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No se encontraron tickets que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </section>

      {/* Ticket Detail Modal */}
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
                <DialogDescription>
                  Detalles completos del ticket de soporte
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Client Information */}
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

                  {/* Description */}
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-slate-600" />
                      Descripción del Problema
                    </h3>
                    <p className="text-slate-700 leading-relaxed">{selectedTicket.descripcion}</p>
                  </div>

                  {/* Comments/Timeline */}
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="mb-4">Historial de Comentarios</h3>
                    <div className="space-y-3 mb-4">
                      {selectedTicket.comentarios.map((comentario, index) => (
                        <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                          <p className="text-slate-700">{comentario}</p>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    {isReplying && (
                      <div className="border-t pt-4 space-y-3">
                        <div>
                          <label className="text-slate-600 mb-2 block">Nueva respuesta:</label>
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe tu respuesta aquí..."
                            className="min-h-[100px] resize-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleSendReply();
                              }
                            }}
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Presiona Ctrl+Enter para enviar rápidamente
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={handleCancelReply}
                            className="flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSendReply}
                            disabled={!replyText.trim()}
                            className="flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Enviar Respuesta
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Status & Priority */}
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="mb-4">Estado del Ticket</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-slate-600 block mb-1">Estado:</label>
                        {isChangingState ? (
                          <div className="space-y-3">
                            <Select value={newEstado || ""} onValueChange={(value) => setNewEstado(value as Estado)}>
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
                                disabled={!newEstado || newEstado === selectedTicket.estado}
                                className="flex-1"
                              >
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelStateChange}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          getEstadoBadge(selectedTicket.estado)
                        )}
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Prioridad:</label>
                        {getPrioridadBadge(selectedTicket.prioridad)}
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Categoría:</label>
                        <Badge variant="outline">{selectedTicket.categoria}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Assignment */}
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-slate-600" />
                      Asignación
                    </h3>
                    <div>
                      <label className="text-slate-600 block mb-1">Asignado a:</label>
                      {isReassigning ? (
                        <div className="space-y-3">
                          <Select value={newAsignado || ""} onValueChange={(value) => setNewAsignado(value as Tecnico)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar técnico" />
                            </SelectTrigger>
                            <SelectContent>
                              {TECNICOS.map((tecnico) => (
                                <SelectItem key={tecnico} value={tecnico}>
                                  {tecnico}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleConfirmReassign}
                              disabled={!newAsignado || newAsignado === selectedTicket.asignado}
                              className="flex-1"
                            >
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelReassign}
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className={selectedTicket.asignado === "Sin asignar" ? "text-slate-400" : "text-slate-900"}>
                          {selectedTicket.asignado}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
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

                  {/* Actions */}
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="mb-4">Acciones</h3>
                    <div className="space-y-2">
                      <Button 
                        className="w-full" 
                        variant={isReplying ? "outline" : "default"}
                        onClick={handleReply}
                        disabled={isReplying || isChangingState || isReassigning}
                      >
                        {isReplying ? "Respondiendo..." : "Responder"}
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={handleChangeState}
                        disabled={isReplying || isChangingState || isReassigning}
                      >
                        {isChangingState ? "Cambiando..." : "Cambiar Estado"}
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={handleReassign}
                        disabled={isReplying || isChangingState || isReassigning}
                      >
                        {isReassigning ? "Reasignando..." : "Reasignar"}
                      </Button>
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