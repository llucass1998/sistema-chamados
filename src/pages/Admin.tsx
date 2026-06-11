import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import TicketCard from '../components/TicketCard';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import type { Ticket, TicketStatus } from '../types';
import { sortTicketsByDate, ticketFromDoc } from '../utils/tickets';

function Admin() {
  const navigate = useNavigate();
  const { profile, isStaff } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'Todos'>('Todos');
  const [updatingId, setUpdatingId] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isStaff) {
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'tickets'),
      (snapshot) => {
        setTickets(sortTicketsByDate(snapshot.docs.map(ticketFromDoc)));
      },
      (error) => {
        console.error('Erro ao carregar chamados:', error);
        setErrorMessage('Nao foi possivel carregar os chamados.');
      },
    );

    return unsubscribe;
  }, [isStaff]);

  const metrics = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === 'Aberto').length,
      progress: tickets.filter((ticket) => ticket.status === 'Em andamento').length,
      resolved: tickets.filter((ticket) => ticket.status === 'Resolvido').length,
      urgent: tickets.filter((ticket) => ticket.prioridade === 'Urgente').length,
    }),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'Todos') {
      return tickets;
    }

    return tickets.filter((ticket) => ticket.status === statusFilter);
  }, [statusFilter, tickets]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    setUpdatingId(ticketId);
    setMessage('');
    setErrorMessage('');

    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status,
        updatedAt: serverTimestamp(),
        tecnicoResponsavel: profile?.login ?? 'Tecnico',
        ...(status === 'Resolvido' ? { resolvedAt: serverTimestamp() } : { resolvedAt: null }),
      });

      setMessage('Status atualizado com sucesso.');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setErrorMessage('Erro ao atualizar o chamado.');
    } finally {
      setUpdatingId('');
    }
  };

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-white">
        <main className="mx-auto max-w-xl rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-black">Acesso restrito</h1>
          <p className="mt-3 text-red-100">
            Esta area e exclusiva para usuarios com papel de tecnico ou administrador.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-slate-200"
          >
            Voltar ao portal
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <header className="mx-auto flex max-w-6xl flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-slate-950/40 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-400">Painel tecnico</p>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Gestao de chamados</h1>
          <p className="mt-1 text-sm text-slate-400">
            Atualize o andamento dos chamados e acompanhe a fila de atendimento.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-slate-800"
          >
            Portal
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/20"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-6xl">
        {message && (
          <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 font-semibold text-emerald-200">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 font-semibold text-red-200">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total</p>
            <strong className="mt-2 block text-3xl">{metrics.total}</strong>
          </div>
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
            <p className="text-sm text-blue-200">Abertos</p>
            <strong className="mt-2 block text-3xl">{metrics.open}</strong>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-200">Em andamento</p>
            <strong className="mt-2 block text-3xl">{metrics.progress}</strong>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="text-sm text-emerald-200">Resolvidos</p>
            <strong className="mt-2 block text-3xl">{metrics.resolved}</strong>
          </div>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="text-sm text-red-200">Urgentes</p>
            <strong className="mt-2 block text-3xl">{metrics.urgent}</strong>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Fila de chamados</h2>
              <p className="mt-1 text-sm text-slate-400">
                Visualize solicitante, prioridade, categoria e status.
              </p>
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as TicketStatus | 'Todos')}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-500"
            >
              <option value="Todos">Todos</option>
              <option value="Aberto">Aberto</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Resolvido">Resolvido</option>
            </select>
          </div>

          <div className="mt-6 grid gap-4">
            {filteredTickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-8 text-center text-slate-400">
                Nenhum chamado encontrado para este filtro.
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  showUser
                  updating={updatingId === ticket.id}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Admin;
