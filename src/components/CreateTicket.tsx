import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { TECNICOS, type Ticket } from "../data/tickets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Plus, X } from "lucide-react";

interface CreateTicketProps {
  onTicketCreated: (ticket: Ticket) => void;
  existingTicketIds: string[];
  existingTickets: Ticket[];
}

const PRIORIDADES = ["Alta", "Media", "Baja"] as const;
const CATEGORIAS = [
  "Facturación",
  "Producto defectuoso",
  "Consulta general",
  "Soporte técnico",
  "Garantía",
  "Envío y entrega",
  "Devolución",
  "Información de producto",
  "Otro"
] as const;

export function CreateTicket({ onTicketCreated, existingTicketIds, existingTickets }: CreateTicketProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form data
  const [cliente, setCliente] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<"Alta" | "Media" | "Baja">("Media");
  const [categoria, setCategoria] = useState("");
  const [asignado, setAsignado] = useState<string>("Sin asignar");

  const generateTicketId = () => {
    // Extraer números de los IDs existentes y encontrar el siguiente
    const numbers = existingTicketIds
      .map(id => parseInt(id.replace('#', '')))
      .filter(num => !isNaN(num))
      .sort((a, b) => b - a);
    
    const nextNumber = numbers.length > 0 ? numbers[0] + 1 : 1025;
    return `#${nextNumber}`;
  };

  const getAutoAssignedTechnician = (prioridad: "Alta" | "Media" | "Baja") => {
    // Filtrar técnicos excluyendo "Sin asignar"
    const availableTechnicians = TECNICOS.filter(tecnico => tecnico !== "Sin asignar");
    
    // Si no hay técnicos disponibles, mantener sin asignar
    if (availableTechnicians.length === 0) {
      return "Sin asignar";
    }
    
    // Contar tickets por técnico
    const ticketCounts = availableTechnicians.map(tecnico => {
      const totalTickets = existingTickets.filter(ticket => 
        ticket.asignado === tecnico && 
        ticket.estado !== "Cerrado" && 
        ticket.estado !== "Resuelto"
      ).length;
      
      // Si es prioridad alta, priorizar técnicos con menos tickets de alta prioridad
      const highPriorityTickets = existingTickets.filter(ticket =>
        ticket.asignado === tecnico &&
        ticket.prioridad === "Alta" &&
        ticket.estado !== "Cerrado" &&
        ticket.estado !== "Resuelto"
      ).length;
      
      return {
        tecnico,
        totalTickets,
        highPriorityTickets
      };
    });

    // Si es un ticket de prioridad alta, primero considerar la carga de tickets de alta prioridad
    if (prioridad === "Alta") {
      const minHighPriorityCount = Math.min(...ticketCounts.map(t => t.highPriorityTickets));
      const candidatesWithLeastHighPriority = ticketCounts.filter(t => t.highPriorityTickets === minHighPriorityCount);
      
      // Si hay empate en tickets de alta prioridad, usar carga total
      if (candidatesWithLeastHighPriority.length > 1) {
        const minTotalInHighPriorityCandidates = Math.min(...candidatesWithLeastHighPriority.map(t => t.totalTickets));
        const finalCandidates = candidatesWithLeastHighPriority.filter(t => t.totalTickets === minTotalInHighPriorityCandidates);
        
        // Selección aleatoria entre los candidatos finales
        const randomIndex = Math.floor(Math.random() * finalCandidates.length);
        return finalCandidates[randomIndex].tecnico;
      } else {
        return candidatesWithLeastHighPriority[0].tecnico;
      }
    }
    
    // Para prioridad media y baja, usar solo la carga total
    const minTotalCount = Math.min(...ticketCounts.map(t => t.totalTickets));
    const candidatesWithLeastTotal = ticketCounts.filter(t => t.totalTickets === minTotalCount);
    
    // Selección aleatoria si hay empate
    const randomIndex = Math.floor(Math.random() * candidatesWithLeastTotal.length);
    return candidatesWithLeastTotal[randomIndex].tecnico;
  };

  const resetForm = () => {
    setCliente("");
    setEmail("");
    setTelefono("");
    setAsunto("");
    setDescripcion("");
    setPrioridad("Media");
    setCategoria("");
    setAsignado("Sin asignar");
  };

  const handleCancel = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    // Simular una pequeña demora
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES');
    const formattedDateTime = now.toLocaleDateString('es-ES') + ' ' + 
                            now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // Asignación automática si no se asignó específicamente
    const finalAsignado = asignado === "Sin asignar" ? getAutoAssignedTechnician(prioridad) : asignado;
    const wasAutoAssigned = asignado === "Sin asignar" && finalAsignado !== "Sin asignar";

    const newTicket: Ticket = {
      id: generateTicketId(),
      cliente: cliente.trim(),
      asunto: asunto.trim(),
      estado: "Abierto",
      prioridad,
      asignado: finalAsignado,
      fecha: formattedDate,
      descripcion: descripcion.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      fechaCreacion: formattedDateTime,
      ultimaActualizacion: formattedDateTime,
      categoria: categoria || "Otro",
      comentarios: [
        `[${formattedDateTime}] Sistema: Ticket creado por administrador (Matías Gómez)`,
        ...(wasAutoAssigned ? [`[${formattedDateTime}] Sistema: Asignado automáticamente a ${finalAsignado} (menor carga de trabajo)`] : [])
      ]
    };

    onTicketCreated(newTicket);
    resetForm();
    setIsOpen(false);
    setIsCreating(false);
  };

  const isFormValid = cliente.trim() && email.trim() && asunto.trim() && descripcion.trim();

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Crear Ticket
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Crear Nuevo Ticket
            </DialogTitle>
            <DialogDescription>
              Complete la información para crear un ticket en nombre del cliente
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Cliente */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-4">
              <h3 className="font-medium text-slate-900">Información del Cliente</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Nombre completo *</Label>
                  <Input
                    id="cliente"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej: juan.perez@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: +54 9 11 1234-5678"
                />
              </div>
            </div>

            {/* Información del Ticket */}
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900">Información del Ticket</h3>
              
              <div className="space-y-2">
                <Label htmlFor="asunto">Asunto *</Label>
                <Input
                  id="asunto"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Ej: Problema con el producto recibido"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción del problema *</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe detalladamente el problema o consulta del cliente..."
                  className="min-h-[100px] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select value={prioridad} onValueChange={(value) => setPrioridad(value as "Alta" | "Media" | "Baja")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map((prioridad) => (
                        <SelectItem key={prioridad} value={prioridad}>
                          {prioridad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asignado">Asignar a</Label>
                  <Select value={asignado} onValueChange={setAsignado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TECNICOS.map((tecnico) => (
                        <SelectItem key={tecnico} value={tecnico}>
                          {tecnico === "Sin asignar" ? "Sin asignar (automático)" : tecnico}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {asignado === "Sin asignar" && (
                    <p className="text-sm text-slate-500">
                      Se asignará automáticamente al técnico con menor carga de trabajo
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isCreating}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isCreating ? "Creando..." : "Crear Ticket"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}