import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { Ticket, TicketCategory, TicketComment, TicketPriority, TicketStatus, UserRole } from '../types';
import { ticketCategories, ticketPriorities, ticketStatuses } from '../types';

// Politica base de SLA: cada prioridade vira um prazo maximo de atendimento.
export const slaHoursByPriority: Record<TicketPriority, number> = {
  Baixa: 48,
  Media: 24,
  Alta: 8,
  Urgente: 4,
};

export type SlaTone = 'slate' | 'blue' | 'amber' | 'red' | 'emerald';

export interface TicketSlaInfo {
  dueAt: Date | null;
  hours: number;
  label: string;
  detail: string;
  tone: SlaTone;
  isBreached: boolean;
  isAtRisk: boolean;
}

const isTicketStatus = (value: unknown): value is TicketStatus =>
  ticketStatuses.includes(value as TicketStatus);

const isTicketPriority = (value: unknown): value is TicketPriority =>
  ticketPriorities.includes(value as TicketPriority);

const isTicketCategory = (value: unknown): value is TicketCategory =>
  ticketCategories.includes(value as TicketCategory);

const normalizeStatus = (value: unknown): TicketStatus => {
  if (value === 'Resolvido') {
    return 'Fechado';
  }

  return isTicketStatus(value) ? value : 'Aberto';
};

// Converte o documento do Firestore para o formato usado pela interface.
export const ticketFromDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): Ticket => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    motivo: String(data.motivo ?? 'Chamado sem titulo'),
    descricao: String(data.descricao ?? 'Sem descricao informada.'),
    categoria: isTicketCategory(data.categoria) ? data.categoria : 'Outros',
    prioridade: isTicketPriority(data.prioridade) ? data.prioridade : 'Media',
    status: normalizeStatus(data.status),
    userId: String(data.userId ?? ''),
    userEmail: String(data.userEmail ?? 'Sem e-mail'),
    userName: String(data.userName ?? 'Colaborador'),
    companyId: String(data.companyId ?? 'Sem empresa'),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    slaDueAt: data.slaDueAt ?? null,
    slaHours: typeof data.slaHours === 'number' ? data.slaHours : undefined,
    slaPolicy: data.slaPolicy,
    resolvedAt: data.resolvedAt ?? null,
    closedAt: data.closedAt ?? data.resolvedAt ?? null,
    closedBy: data.closedBy,
    tecnicoResponsavel: data.tecnicoResponsavel,
  };
};

const normalizeRole = (value: unknown): UserRole => {
  if (value === 'admin' || value === 'tecnico') {
    return value;
  }

  return 'colaborador';
};

export const commentFromDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): TicketComment => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    message: String(data.message ?? ''),
    authorId: String(data.authorId ?? ''),
    authorName: String(data.authorName ?? 'Usuario'),
    authorRole: normalizeRole(data.authorRole),
    createdAt: data.createdAt ?? null,
    attachmentName: data.attachmentName,
    attachmentUrl: data.attachmentUrl,
    attachmentPath: data.attachmentPath,
    attachmentType: data.attachmentType,
  };
};

// Calcula o vencimento do SLA somando as horas da prioridade na data de abertura.
export const calculateSlaDueAt = (priority: TicketPriority, createdAt = new Date()) => {
  const hours = slaHoursByPriority[priority];

  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
};

// Normaliza Date e Timestamp do Firestore para facilitar comparacoes e formatacao.
const toDate = (value: Ticket['createdAt'] | Date | null | undefined) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  return value.toDate();
};

// Chamados antigos podem nao ter slaDueAt; nesse caso calculamos pelo createdAt + prioridade.
export const getTicketSlaDueAt = (ticket: Ticket) => {
  const explicitDueDate = toDate(ticket.slaDueAt);

  if (explicitDueDate) {
    return explicitDueDate;
  }

  const createdAt = toDate(ticket.createdAt);

  if (!createdAt) {
    return null;
  }

  return calculateSlaDueAt(ticket.prioridade, createdAt);
};

const formatHours = (hours: number) => {
  if (hours < 1) {
    return 'menos de 1h';
  }

  if (hours === 1) {
    return '1h';
  }

  return `${hours}h`;
};

// Resume o SLA em dados prontos para a UI: texto, cor, vencido ou em risco.
export const getTicketSlaInfo = (ticket: Ticket, now = new Date()): TicketSlaInfo => {
  const dueAt = getTicketSlaDueAt(ticket);
  const hours = ticket.slaHours ?? slaHoursByPriority[ticket.prioridade];

  if (!dueAt) {
    return {
      dueAt: null,
      hours,
      label: 'SLA indefinido',
      detail: `Politica padrao: ${formatHours(hours)}`,
      tone: 'slate',
      isBreached: false,
      isAtRisk: false,
    };
  }

  if (ticket.status === 'Fechado') {
    return {
      dueAt,
      hours,
      label: 'SLA concluido',
      detail: `Prazo era ${formatDate(dueAt)}`,
      tone: 'emerald',
      isBreached: false,
      isAtRisk: false,
    };
  }

  const diffInMinutes = Math.round((dueAt.getTime() - now.getTime()) / 60000);

  if (diffInMinutes < 0) {
    const overdueHours = Math.ceil(Math.abs(diffInMinutes) / 60);

    return {
      dueAt,
      hours,
      label: 'SLA vencido',
      detail: `Venceu ha ${formatHours(overdueHours)}`,
      tone: 'red',
      isBreached: true,
      isAtRisk: false,
    };
  }

  const remainingHours = Math.ceil(diffInMinutes / 60);
  const riskWindowHours = Math.max(2, Math.ceil(hours * 0.2));

  if (remainingHours <= riskWindowHours) {
    return {
      dueAt,
      hours,
      label: 'SLA em risco',
      detail: `Vence em ${formatHours(remainingHours)}`,
      tone: 'amber',
      isBreached: false,
      isAtRisk: true,
    };
  }

  return {
    dueAt,
    hours,
    label: 'Dentro do SLA',
    detail: `Vence em ${formatHours(remainingHours)}`,
    tone: 'blue',
    isBreached: false,
    isAtRisk: false,
  };
};

// Aceita Timestamp do Firestore ou Date do JavaScript para reutilizar em telas e testes.
export const formatDate = (value: Ticket['createdAt'] | Date | null | undefined) => {
  if (!value) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(toDate(value) ?? new Date());
};

export const sortTicketsByDate = (tickets: Ticket[]) =>
  [...tickets].sort((first, second) => {
    const firstDate = first.createdAt?.toMillis() ?? 0;
    const secondDate = second.createdAt?.toMillis() ?? 0;

    return secondDate - firstDate;
  });

export const sortCommentsByDate = (comments: TicketComment[]) =>
  [...comments].sort((first, second) => {
    const firstDate = first.createdAt?.toMillis() ?? 0;
    const secondDate = second.createdAt?.toMillis() ?? 0;

    return firstDate - secondDate;
  });

export const statusClasses: Record<TicketStatus, string> = {
  Aberto: 'border-sky-200 bg-sky-50 text-sky-800',
  'Em andamento': 'border-amber-200 bg-amber-50 text-amber-800',
  Fechado: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export const priorityClasses: Record<TicketPriority, string> = {
  Baixa: 'border-slate-200 bg-slate-50 text-slate-700',
  Media: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  Alta: 'border-orange-200 bg-orange-50 text-orange-800',
  Urgente: 'border-red-200 bg-red-50 text-red-800',
};
