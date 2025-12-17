export interface Ticket {
  id: string;
  cliente: string;
  asunto: string;
  estado: "Abierto" | "En Progreso" | "En Espera" | "Resuelto" | "Cerrado";
  prioridad: "Alta" | "Media" | "Baja";
  asignado: string;
  fecha: string;
  descripcion: string;
  email: string;
  telefono: string;
  fechaCreacion: string;
  ultimaActualizacion: string;
  categoria: string;
  comentarios: string[];
}

export const initialTickets: Ticket[] = [
  {
    id: "#1024",
    cliente: "Lucía Fernández",
    asunto: "Problema con la facturación de Septiembre",
    estado: "Abierto",
    prioridad: "Alta",
    asignado: "Sin asignar",
    fecha: "15/09/2025",
    descripcion: "La cliente reporta que su factura de septiembre muestra un monto incorrecto. Según sus registros, debería ser $150 menos de lo facturado. Solicita revisión urgente ya que el pago vence pronto.",
    email: "lucia.fernandez@email.com",
    telefono: "+54 9 11 1234-5678",
    fechaCreacion: "15/09/2025 09:30",
    ultimaActualizacion: "15/09/2025 09:30",
    categoria: "Facturación",
    comentarios: ["Ticket creado automáticamente desde el formulario web"]
  },
  {
    id: "#1023",
    cliente: "Marcos Garrón",
    asunto: "El producto llegó dañado",
    estado: "En Progreso",
    prioridad: "Media",
    asignado: "Tomás Patriarca",
    fecha: "14/09/2025",
    descripcion: "El cliente recibió su pedido #789 pero el producto principal (notebook) tiene la pantalla agrietada. Solicita reemplazo inmediato o reembolso completo.",
    email: "marcos.garcia@email.com",
    telefono: "+54 9 11 8765-4321",
    fechaCreacion: "14/09/2025 14:15",
    ultimaActualizacion: "14/09/2025 16:45",
    categoria: "Producto defectuoso",
    comentarios: [
      "Cliente envió fotos del daño",
      "Juan: Contactando con proveedor para reemplazo",
      "Esperando confirmación de stock"
    ]
  },
  {
    id: "#1021",
    cliente: "Ana Beltrán",
    asunto: "Consulta sobre garantía extendida",
    estado: "Cerrado",
    prioridad: "Baja",
    asignado: "Leandro Mendoza",
    fecha: "12/09/2025",
    descripcion: "La cliente consulta sobre las opciones de garantía extendida para su compra reciente. Quiere saber precios y cobertura disponible para productos electrónicos.",
    email: "ana.beltran@email.com",
    telefono: "+54 9 11 5555-9999",
    fechaCreacion: "12/09/2025 11:20",
    ultimaActualizacion: "13/09/2025 10:30",
    categoria: "Consulta general",
    comentarios: [
      "Información de garantía enviada por email",
      "Cliente satisfecha con la respuesta",
      "Caso cerrado"
    ]
  },
  {
    id: "#1020",
    cliente: "Pedro López",
    asunto: "Error en el sistema de pagos",
    estado: "En Progreso",
    prioridad: "Alta",
    asignado: "Juan Ríos",
    fecha: "11/09/2025",
    descripcion: "El cliente reporta que no puede completar el pago de su pedido. El sistema muestra un error 500 cada vez que intenta procesar la transacción.",
    email: "pedro.lopez@email.com",
    telefono: "+54 9 11 2222-3333",
    fechaCreacion: "11/09/2025 10:15",
    ultimaActualizacion: "11/09/2025 14:30",
    categoria: "Sistema de pagos",
    comentarios: [
      "Error reportado por el cliente",
      "Juan: Revisando logs del sistema",
      "Se encontró el problema en el gateway de pagos"
    ]
  },
  {
    id: "#1019",
    cliente: "María González",
    asunto: "Solicitud de reembolso",
    estado: "Resuelto",
    prioridad: "Media",
    asignado: "Carla Medina",
    fecha: "10/09/2025",
    descripcion: "La cliente solicita el reembolso de su compra #456 ya que el producto no cumple con sus expectativas según la política de devoluciones.",
    email: "maria.gonzalez@email.com",
    telefono: "+54 9 11 4444-5555",
    fechaCreacion: "10/09/2025 16:20",
    ultimaActualizacion: "11/09/2025 09:45",
    categoria: "Reembolso",
    comentarios: [
      "Solicitud de reembolso recibida",
      "Carla: Verificando política de devoluciones",
      "Reembolso aprobado y procesado"
    ]
  },
  {
    id: "#1018",
    cliente: "Carlos Rodríguez",
    asunto: "Problema con el envío",
    estado: "En Progreso",
    prioridad: "Media",
    asignado: "Matías Gómez",
    fecha: "09/09/2025",
    descripcion: "El cliente no ha recibido su pedido #234 que debería haber llegado hace 3 días según el tracking. Solicita información sobre el estado del envío.",
    email: "carlos.rodriguez@email.com",
    telefono: "+54 9 11 6666-7777",
    fechaCreacion: "09/09/2025 08:30",
    ultimaActualizacion: "09/09/2025 15:15",
    categoria: "Envío",
    comentarios: [
      "Cliente consulta por demora en envío",
      "Matías: Contactando con empresa de logística",
      "Paquete en tránsito, llegará mañana"
    ]
  },
  {
    id: "#1017",
    cliente: "Laura Martín",
    asunto: "Consulta técnica sobre producto",
    estado: "Abierto",
    prioridad: "Baja",
    asignado: "Juan Ríos",
    fecha: "08/09/2025",
    descripcion: "La cliente tiene dudas sobre las especificaciones técnicas del producto #789 que está considerando comprar. Necesita asesoramiento técnico.",
    email: "laura.martin@email.com",
    telefono: "+54 9 11 8888-9999",
    fechaCreacion: "08/09/2025 13:45",
    ultimaActualizacion: "08/09/2025 13:45",
    categoria: "Consulta técnica",
    comentarios: ["Consulta técnica recibida"]
  },
  {
    id: "#1016",
    cliente: "Roberto Silva",
    asunto: "Activación de cuenta premium",
    estado: "Cerrado",
    prioridad: "Media",
    asignado: "Carla Medina",
    fecha: "07/09/2025",
    descripcion: "El cliente pagó por la cuenta premium pero no se ha activado automáticamente. Solicita la activación manual de los beneficios premium.",
    email: "roberto.silva@email.com",
    telefono: "+54 9 11 1111-2222",
    fechaCreacion: "07/09/2025 12:00",
    ultimaActualizacion: "07/09/2025 16:30",
    categoria: "Account management",
    comentarios: [
      "Cliente solicita activación de premium",
      "Carla: Verificando pago recibido",
      "Cuenta premium activada correctamente"
    ]
  }
];

export const TECNICOS = ["Sin asignar", "Matías Gómez", "Juan Ríos", "Carla Medina", "Tomás Patriarca", "Leandro Mendoza"] as const;
export type Tecnico = typeof TECNICOS[number];

export const ESTADOS = ["Abierto", "En Progreso", "En Espera", "Resuelto", "Cerrado"] as const;
export type Estado = typeof ESTADOS[number];

export const ESTADO_LABELS = {
  "Abierto": "Abierto",
  "En Progreso": "En Progreso", 
  "En Espera": "En Espera",
  "Resuelto": "Resuelto",
  "Cerrado": "Cerrado"
} as const;