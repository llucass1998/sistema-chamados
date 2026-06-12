import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Ticket } from '../types';
import TicketCard from './TicketCard';

const baseTicket: Ticket = {
  id: 'ticket-1',
  motivo: 'Impressora sem conexao',
  descricao: 'A impressora do financeiro nao aparece na rede.',
  categoria: 'Hardware',
  prioridade: 'Alta',
  status: 'Aberto',
  userId: 'user-1',
  userEmail: 'cliente@empresa.com',
  userName: 'Lucas Souza',
  companyId: 'EMP-2026',
};

describe('TicketCard', () => {
  it('mostra as informacoes principais do chamado', () => {
    render(<TicketCard ticket={baseTicket} showUser />);

    expect(screen.getByText('Impressora sem conexao')).toBeTruthy();
    expect(screen.getByText('Hardware')).toBeTruthy();
    expect(screen.getByText('Alta')).toBeTruthy();
    expect(screen.getByText('Solicitante: Lucas Souza')).toBeTruthy();
  });

  it('exibe a acao de fechar chamado para o painel tecnico', () => {
    render(<TicketCard ticket={baseTicket} onStatusChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Fechar chamado' })).toBeTruthy();
  });

  it('exibe detalhes de fechamento quando o chamado esta fechado', () => {
    render(
      <TicketCard
        ticket={{
          ...baseTicket,
          status: 'Fechado',
          closedBy: 'Tecnico T.I',
        }}
        onStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Chamado fechado' })).toBeTruthy();
    expect(screen.getByText('Fechado por: Tecnico T.I')).toBeTruthy();
  });
});
