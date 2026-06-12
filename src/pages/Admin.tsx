import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import AppShell from '../components/AppShell';
import MetricCard from '../components/MetricCard';
import StaffAccountForm from '../components/StaffAccountForm';
import StatusAlert from '../components/StatusAlert';
import TicketCard from '../components/TicketCard';
import TicketDetailsModal from '../components/TicketDetailsModal';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../types';
import { ticketCategories, ticketPriorities, ticketStatuses } from '../types';
import { sortTicketsByDate, ticketFromDoc } from '../utils/tickets';

function Admin() {
  const navigate = useNavigate();
  const { profile, isStaff } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'Todos'>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'Todas'>('Todas');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'Todas'>('Todas');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
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
      closed: tickets.filter((ticket) => ticket.status === 'Fechado').length,
      urgent: tickets.filter((ticket) => ticket.prioridade === 'Urgente').length,
    }),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'Todos') {
      return tickets.filter((ticket) => {
        const matchesCategory = categoryFilter === 'Todas' || ticket.categoria === categoryFilter;
        const matchesPriority = priorityFilter === 'Todas' || ticket.prioridade === priorityFilter;

        return matchesCategory && matchesPriority;
      });
    }

    return tickets.filter((ticket) => {
      const matchesStatus = ticket.status === statusFilter;
      const matchesCategory = categoryFilter === 'Todas' || ticket.categoria === categoryFilter;
      const matchesPriority = priorityFilter === 'Todas' || ticket.prioridade === priorityFilter;

      return matchesStatus && matchesCategory && matchesPriority;
    });
  }, [categoryFilter, priorityFilter, statusFilter, tickets]);

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
        ...(status === 'Fechado'
          ? {
              closedAt: serverTimestamp(),
              closedBy: profile?.login ?? 'Tecnico',
              resolvedAt: serverTimestamp(),
            }
          : {
              closedAt: null,
              closedBy: null,
              resolvedAt: null,
            }),
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
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] px-4 py-6 text-slate-950">
        <main className="mx-auto max-w-xl rounded-lg border border-red-200 bg-white p-8 text-center shadow-xl shadow-red-100/60">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Acesso restrito</p>
          <h1 className="mt-3 text-2xl font-black tracking-tight">Area tecnica indisponivel</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Esta area e exclusiva para usuarios com papel de tecnico ou administrador.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-md bg-[#0f172a] px-5 py-3 font-black text-white transition hover:bg-slate-800"
          >
            Voltar ao portal
          </Link>
        </main>
      </div>
    );
  }

  return (
    <AppShell
      title="Gestao de chamados"
      description="Atualize o andamento da fila, acompanhe urgencias e mantenha o atendimento visivel para o colaborador."
      userName={profile?.login}
      userRole={profile?.role}
      isStaff={isStaff}
      onLogout={handleLogout}
      actions={
        <Link
          to="/dashboard"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Portal
        </Link>
      }
    >
      {selectedTicket && (
        <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}

      <StatusAlert message={message} type="success" />
      <StatusAlert message={errorMessage} type="error" />

      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Abertos" value={metrics.open} tone="blue" />
        <MetricCard label="Em andamento" value={metrics.progress} tone="amber" />
        <MetricCard label="Fechados" value={metrics.closed} tone="emerald" />
        <MetricCard label="Urgentes" value={metrics.urgent} tone="red" />
      </section>

      {profile?.role === 'admin' && <StaffAccountForm />}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">Fila de chamados</h2>
            <p className="mt-1 text-sm text-slate-500">Visualize solicitante, prioridade, categoria e status.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as TicketStatus | 'Todos')}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            >
              <option value="Todos">Todos</option>
              {ticketStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Categoria</label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as TicketCategory | 'Todas')}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            >
              <option value="Todas">Todas</option>
              {ticketCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Prioridade</label>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as TicketPriority | 'Todas')}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            >
              <option value="Todas">Todas</option>
              {ticketPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
          </div>
        </div>

        <div className="grid gap-3 p-5">
          {filteredTickets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
              Nenhum chamado encontrado para este filtro.
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                showUser
                updating={updatingId === ticket.id}
                onOpenDetails={setSelectedTicket}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}

export default Admin;
