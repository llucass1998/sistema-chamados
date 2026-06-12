import type { Ticket, TicketStatus } from '../types';
import { ticketStatuses } from '../types';
import { formatDate, priorityClasses, statusClasses } from '../utils/tickets';

interface TicketCardProps {
  ticket: Ticket;
  showUser?: boolean;
  onStatusChange?: (ticketId: string, status: TicketStatus) => void;
  onOpenDetails?: (ticket: Ticket) => void;
  updating?: boolean;
}

function TicketCard({ ticket, showUser = false, onStatusChange, onOpenDetails, updating = false }: TicketCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses[ticket.status]}`}>
              {ticket.status}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${priorityClasses[ticket.prioridade]}`}>
              {ticket.prioridade}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
              {ticket.categoria}
            </span>
          </div>

          <h3 className="mt-4 text-lg font-black tracking-tight text-slate-950">{ticket.motivo}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{ticket.descricao}</p>

          <div className="mt-4 grid gap-x-6 gap-y-1 text-sm text-slate-500 sm:grid-cols-2">
            <span>Aberto em: {formatDate(ticket.createdAt)}</span>
            {ticket.updatedAt && <span>Atualizado em: {formatDate(ticket.updatedAt)}</span>}
            {showUser && <span>Solicitante: {ticket.userName}</span>}
            {showUser && <span>E-mail: {ticket.userEmail}</span>}
            {ticket.tecnicoResponsavel && <span>Tecnico: {ticket.tecnicoResponsavel}</span>}
            {ticket.closedAt && <span>Fechado em: {formatDate(ticket.closedAt)}</span>}
            {ticket.closedBy && <span>Fechado por: {ticket.closedBy}</span>}
            <span>Empresa: {ticket.companyId}</span>
          </div>
        </div>

        {(onStatusChange || onOpenDetails) && (
          <div className="flex min-w-48 flex-col gap-2">
            {onOpenDetails && (
              <button
                type="button"
                onClick={() => onOpenDetails(ticket)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
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
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
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
                  className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
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
