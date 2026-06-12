import type { Timestamp } from 'firebase/firestore';

export const ticketStatuses = ['Aberto', 'Em andamento', 'Fechado'] as const;
export const ticketPriorities = ['Baixa', 'Media', 'Alta', 'Urgente'] as const;
export const ticketCategories = ['Hardware', 'Software', 'Rede', 'Acesso', 'Outros'] as const;

export type TicketStatus = (typeof ticketStatuses)[number];
export type TicketPriority = (typeof ticketPriorities)[number];
export type TicketCategory = (typeof ticketCategories)[number];
export type UserRole = 'colaborador' | 'tecnico' | 'admin';

export interface UserProfile {
  uid: string;
  login: string;
  email: string;
  companyId: string;
  role: UserRole;
}

export interface Ticket {
  id: string;
  motivo: string;
  descricao: string;
  categoria: TicketCategory;
  prioridade: TicketPriority;
  status: TicketStatus;
  userId: string;
  userEmail: string;
  userName: string;
  companyId: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  resolvedAt?: Timestamp | null;
  closedAt?: Timestamp | null;
  closedBy?: string;
  tecnicoResponsavel?: string;
}
