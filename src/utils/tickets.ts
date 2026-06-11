import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../types';
import { ticketCategories, ticketPriorities, ticketStatuses } from '../types';

const isTicketStatus = (value: unknown): value is TicketStatus =>
  ticketStatuses.includes(value as TicketStatus);

const isTicketPriority = (value: unknown): value is TicketPriority =>
  ticketPriorities.includes(value as TicketPriority);

const isTicketCategory = (value: unknown): value is TicketCategory =>
  ticketCategories.includes(value as TicketCategory);

export const ticketFromDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): Ticket => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    motivo: String(data.motivo ?? 'Chamado sem titulo'),
    descricao: String(data.descricao ?? 'Sem descricao informada.'),
    categoria: isTicketCategory(data.categoria) ? data.categoria : 'Outros',
    prioridade: isTicketPriority(data.prioridade) ? data.prioridade : 'Media',
    status: isTicketStatus(data.status) ? data.status : 'Aberto',
    userId: String(data.userId ?? ''),
    userEmail: String(data.userEmail ?? 'Sem e-mail'),
    userName: String(data.userName ?? 'Colaborador'),
    companyId: String(data.companyId ?? 'Sem empresa'),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    resolvedAt: data.resolvedAt ?? null,
    tecnicoResponsavel: data.tecnicoResponsavel,
  };
};

export const formatDate = (value: Ticket['createdAt']) => {
  if (!value) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value.toDate());
};

export const sortTicketsByDate = (tickets: Ticket[]) =>
  [...tickets].sort((first, second) => {
    const firstDate = first.createdAt?.toMillis() ?? 0;
    const secondDate = second.createdAt?.toMillis() ?? 0;

    return secondDate - firstDate;
  });

export const statusClasses: Record<TicketStatus, string> = {
  Aberto: 'border-sky-200 bg-sky-50 text-sky-800',
  'Em andamento': 'border-amber-200 bg-amber-50 text-amber-800',
  Resolvido: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export const priorityClasses: Record<TicketPriority, string> = {
  Baixa: 'border-slate-200 bg-slate-50 text-slate-700',
  Media: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  Alta: 'border-orange-200 bg-orange-50 text-orange-800',
  Urgente: 'border-red-200 bg-red-50 text-red-800',
};
