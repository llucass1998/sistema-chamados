import type { Ticket, TicketStatus } from '../types';
import { ticketStatuses } from '../types';
import { formatDate, getTicketSlaInfo, priorityClasses, statusClasses, type SlaTone } from '../utils/tickets';

interface TicketCardProps {
  ticket: Ticket;
  showUser?: boolean;
  onStatusChange?: (ticketId: string, status: TicketStatus) => void;
  onOpenDetails?: (ticket: Ticket) => void;
  updating?: boolean;
}

// Mapeia o estado do SLA para estilos visuais do badge.
const slaClasses: Record<SlaTone, string> = {
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  blue: 'border-sky-200 bg-sky-50 text-sky-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  red: 'border-red-200 bg-red-50 text-red-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

function TicketCard({ ticket, showUser = false, onStatusChange, onOpenDetails, updating = false }: TicketCardProps) {
  // A regra fica no utilitario; o card apenas exibe o resultado calculado.
  const slaInfo = getTicketSlaInfo(ticket);

  return (
    <article className="enterprise-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${statusClasses[ticket.status]}`}>
              {ticket.status}
            </span>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${priorityClasses[ticket.prioridade]}`}>
              {ticket.prioridade}
            </span>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${slaClasses[slaInfo.tone]}`}>
              {slaInfo.label}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-slate-700">
              {ticket.categoria}
            </span>
          </div>

          <h3 className="mt-4 text-lg font-black tracking-tight text-slate-950">{ticket.motivo}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{ticket.descricao}</p>

          <div className="mt-5 grid gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:grid-cols-2">
            <span>Aberto em: {formatDate(ticket.createdAt)}</span>
            {ticket.updatedAt && <span>Atualizado em: {formatDate(ticket.updatedAt)}</span>}
            {showUser && <span>Solicitante: {ticket.userName}</span>}
            {showUser && <span>E-mail: {ticket.userEmail}</span>}
            {ticket.tecnicoResponsavel && <span>Tecnico: {ticket.tecnicoResponsavel}</span>}
            <span>SLA: {slaInfo.detail}</span>
            {slaInfo.dueAt && <span>Prazo: {formatDate(slaInfo.dueAt)}</span>}
            {ticket.closedAt && <span>Fechado em: {formatDate(ticket.closedAt)}</span>}
            {ticket.closedBy && <span>Fechado por: {ticket.closedBy}</span>}
            <span>Empresa: {ticket.companyId}</span>
          </div>
        </div>

        {(onStatusChange || onOpenDetails) && (
          <div className="flex min-w-48 flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 lg:w-56">
            {onOpenDetails && (
              <button
                type="button"
                onClick={() => onOpenDetails(ticket)}
                className="enterprise-button-secondary px-3 py-2 text-sm"
              >
                Ver detalhes
              </button>
            )}
            {onStatusChange && (
              <>
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Atualizar status
                </label>
                <select
                  value={ticket.status}
                  disabled={updating}
                  onChange={(event) => onStatusChange(ticket.id, event.target.value as TicketStatus)}
                  className="enterprise-input px-3 py-2 text-sm font-bold disabled:opacity-60"
                >
                  {ticketStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={updating || ticket.status === 'Fechado'}
                  onClick={() => onStatusChange(ticket.id, 'Fechado')}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {ticket.status === 'Fechado' ? 'Chamado fechado' : 'Fechar chamado'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default TicketCard;
