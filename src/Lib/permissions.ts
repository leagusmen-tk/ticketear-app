// src/lib/permissions.ts

export type Role = "admin" | "tech";

// Ajustá estos nombres a tus estados reales
export type TicketStatus = "open" | "in_progress" | "pending" | "resolved" | "closed" | "cancelled";

export type TicketAction =
  | "ticket.create"
  | "ticket.update_status"
  | "ticket.reassign"
  | "ticket.comment"
  | "ticket.edit_core"; // título/desc/prioridad, etc.

// Lo mínimo que necesitamos del ticket para decidir permisos
export type PermissionTicket = {
  id: string;
  status: TicketStatus;
  assignedToId: string | null;
};

export type Actor = {
  role: Role;
  userId: string;
};

const TECH_ALLOWED_STATUS: TicketStatus[] = ["in_progress", "pending", "resolved"]; // ajustable

export function can(actor: Actor, action: TicketAction, ticket?: PermissionTicket) {
  // ADMIN: TODO
  if (actor.role === "admin") return true;

  // TECH: reglas
  switch (action) {
    case "ticket.create":
      return true;

    case "ticket.comment":
      // técnico comenta solo si está asignado a él
      return !!ticket && ticket.assignedToId === actor.userId;

    case "ticket.update_status":
      // técnico cambia estado solo si está asignado a él y solo a estados permitidos
      return !!ticket && ticket.assignedToId === actor.userId;

    case "ticket.reassign":
      return false;

    case "ticket.edit_core":
      return false;

    default:
      return false;
  }
}

export function canSetStatus(actor: Actor, ticket: PermissionTicket, next: TicketStatus) {
  if (actor.role === "admin") return true;

  if (ticket.assignedToId !== actor.userId) return false;
  return TECH_ALLOWED_STATUS.includes(next);
}
