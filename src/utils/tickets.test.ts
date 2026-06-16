import { describe, expect, it } from 'vitest';
import type { Ticket, TicketComment } from '../types';
import { calculateSlaDueAt, getTicketSlaInfo, sortCommentsByDate, sortTicketsByDate } from './tickets';

const timestamp = (value: number) =>
  ({
    toMillis: () => value,
    toDate: () => new Date(value),
  }) as Ticket['createdAt'];

describe('ticket utilities', () => {
  it('ordena chamados do mais recente para o mais antigo', () => {
    const tickets = [
      { id: '1', createdAt: timestamp(1000) },
      { id: '2', createdAt: timestamp(3000) },
      { id: '3', createdAt: timestamp(2000) },
    ] as Ticket[];

    expect(sortTicketsByDate(tickets).map((ticket) => ticket.id)).toEqual(['2', '3', '1']);
  });

  it('ordena comentarios do mais antigo para o mais recente', () => {
    const comments = [
      { id: '1', createdAt: timestamp(3000) },
      { id: '2', createdAt: timestamp(1000) },
      { id: '3', createdAt: timestamp(2000) },
    ] as TicketComment[];

    expect(sortCommentsByDate(comments).map((comment) => comment.id)).toEqual(['2', '3', '1']);
  });

  // Protege a regra principal da versao Enterprise 2.0: prioridade define o SLA.
  it('calcula o prazo de SLA com base na prioridade', () => {
    const createdAt = new Date('2026-06-15T10:00:00.000Z');

    expect(calculateSlaDueAt('Urgente', createdAt).toISOString()).toBe('2026-06-15T14:00:00.000Z');
    expect(calculateSlaDueAt('Alta', createdAt).toISOString()).toBe('2026-06-15T18:00:00.000Z');
    expect(calculateSlaDueAt('Media', createdAt).toISOString()).toBe('2026-06-16T10:00:00.000Z');
    expect(calculateSlaDueAt('Baixa', createdAt).toISOString()).toBe('2026-06-17T10:00:00.000Z');
  });

  it('marca SLA vencido quando o chamado aberto passa do prazo', () => {
    const ticket = {
      id: '1',
      prioridade: 'Urgente',
      status: 'Aberto',
      createdAt: timestamp(new Date('2026-06-15T10:00:00.000Z').getTime()),
    } as Ticket;

    const slaInfo = getTicketSlaInfo(ticket, new Date('2026-06-15T16:00:00.000Z'));

    expect(slaInfo.label).toBe('SLA vencido');
    expect(slaInfo.isBreached).toBe(true);
  });

  it('nao marca SLA vencido para chamado fechado', () => {
    const ticket = {
      id: '1',
      prioridade: 'Urgente',
      status: 'Fechado',
      createdAt: timestamp(new Date('2026-06-15T10:00:00.000Z').getTime()),
    } as Ticket;

    const slaInfo = getTicketSlaInfo(ticket, new Date('2026-06-15T16:00:00.000Z'));

    expect(slaInfo.label).toBe('SLA concluido');
    expect(slaInfo.isBreached).toBe(false);
  });
});
