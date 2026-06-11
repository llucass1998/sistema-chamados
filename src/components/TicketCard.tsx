import type { Ticket, TicketStatus } from '../types';
import { ticketStatuses } from '../types';
import { formatDate, priorityClasses, statusClasses } from '../utils/tickets';

interface TicketCardProps {
  ticket: Ticket;
  showUser?: boolean;
  onStatusChange?: (ticketId: string, status: TicketStatus) => void;
  updating?: boolean;
}

function TicketCard({ ticket, showUser = false, onStatusChange, updating = false }: TicketCardProps) {
  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[ticket.status]}`}>
              {ticket.status}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityClasses[ticket.prioridade]}`}>
              {ticket.prioridade}
            </span>
            <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200">
              {ticket.categoria}
            </span>
          </div>

          <h3 className="mt-4 text-lg font-bold text-white">{ticket.motivo}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{ticket.descricao}</p>

          <div className="mt-4 grid gap-1 text-sm text-slate-400 sm:grid-cols-2">
            <span>Aberto em: {formatDate(ticket.createdAt)}</span>
            {ticket.updatedAt && <span>Atualizado em: {formatDate(ticket.updatedAt)}</span>}
            {showUser && <span>Solicitante: {ticket.userName}</span>}
            {showUser && <span>E-mail: {ticket.userEmail}</span>}
            {ticket.tecnicoResponsavel && <span>Tecnico: {ticket.tecnicoResponsavel}</span>}
            <span>Empresa: {ticket.companyId}</span>
          </div>
        </div>

        {onStatusChange && (
          <div className="flex min-w-48 flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Atualizar status
            </label>
            <select
              value={ticket.status}
              disabled={updating}
              onChange={(event) => onStatusChange(ticket.id, event.target.value as TicketStatus)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-blue-500 disabled:opacity-60"
            >
              {ticketStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </article>
  );
}

export default TicketCard;
