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
  Aberto: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
  'Em andamento': 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  Resolvido: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
};

export const priorityClasses: Record<TicketPriority, string> = {
  Baixa: 'border-slate-500/40 bg-slate-500/10 text-slate-200',
  Media: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
  Alta: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  Urgente: 'border-red-500/40 bg-red-500/10 text-red-200',
};
