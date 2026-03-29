import type { Ticket } from "../types/ticket";
export const initialTickets: Ticket[] = [
  {
    id: "TCK-001",
    cliente: "Juan Pérez",
    asunto: "No puedo ingresar",
    estado: "Abierto",
    prioridad: "Alta",
    asignado: "Sin asignar",
    fecha: "2025-12-17",
    descripcion: "Me falla el login",
    email: "juan@mail.com",
    telefono: "123",
    fechaCreacion: "2025-12-17",
    ultimaActualizacion: "2025-12-17",
    categoria: "Acceso",
    comentarios: []
  }
];
