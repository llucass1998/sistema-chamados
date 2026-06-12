import { describe, expect, it } from 'vitest';
import type { Ticket, TicketComment } from '../types';
import { sortCommentsByDate, sortTicketsByDate } from './tickets';

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
});
