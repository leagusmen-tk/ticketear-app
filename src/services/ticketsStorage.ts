import type { Ticket } from "../types/ticket";
import { initialTickets } from "../mocks/tickets";

const KEY = "ticketearg:tickets:v1";

export function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialTickets;
    return JSON.parse(raw) as Ticket[];
  } catch {
    return initialTickets;
  }
}

export function saveTickets(tickets: Ticket[]) {
  localStorage.setItem(KEY, JSON.stringify(tickets));
}

export function resetTickets() {
  localStorage.removeItem(KEY);
}
