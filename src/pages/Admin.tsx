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
import { getTicketSlaInfo, sortTicketsByDate, ticketFromDoc } from '../utils/tickets';

function Admin() {
  const navigate = useNavigate();
  const { profile, isStaff } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'Todos'>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'Todas'>('Todas');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'Todas'>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
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
      // Indicadores de SLA ajudam o tecnico a priorizar o que precisa de acao primeiro.
      slaBreached: tickets.filter((ticket) => getTicketSlaInfo(ticket).isBreached).length,
      slaAtRisk: tickets.filter((ticket) => getTicketSlaInfo(ticket).isAtRisk).length,
    }),
    [tickets],
  );

  // Busca simples no lado do cliente para facilitar triagem sem criar novos indices no Firestore.
  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === 'Todos' || ticket.status === statusFilter;
      const matchesCategory = categoryFilter === 'Todas' || ticket.categoria === categoryFilter;
      const matchesPriority = priorityFilter === 'Todas' || ticket.prioridade === priorityFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          ticket.id,
          ticket.motivo,
          ticket.descricao,
          ticket.userName,
          ticket.userEmail,
          ticket.companyId,
          ticket.tecnicoResponsavel ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
    });
  }, [categoryFilter, priorityFilter, searchTerm, statusFilter, tickets]);

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
      <div className="auth-page flex min-h-screen items-center justify-center px-4 py-6 text-slate-950">
        <main className="enterprise-panel mx-auto max-w-xl p-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Acesso restrito</p>
          <h1 className="mt-3 text-2xl font-black tracking-tight">Area tecnica indisponivel</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Esta area e exclusiva para usuarios com papel de tecnico ou administrador.
          </p>
          <Link
            to="/dashboard"
            className="enterprise-button-primary mt-6 px-5 py-3"
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
          className="enterprise-button-secondary px-4 py-2 text-sm"
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

      <section className="grid gap-4 md:grid-cols-7">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Abertos" value={metrics.open} tone="blue" />
        <MetricCard label="Em andamento" value={metrics.progress} tone="amber" />
        <MetricCard label="Fechados" value={metrics.closed} tone="emerald" />
        <MetricCard label="Urgentes" value={metrics.urgent} tone="red" />
        <MetricCard label="SLA vencido" value={metrics.slaBreached} tone="red" />
        <MetricCard label="SLA em risco" value={metrics.slaAtRisk} tone="amber" />
      </section>

      {profile?.role === 'admin' ? (
        <StaffAccountForm />
      ) : (
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 px-5 py-4 shadow-sm">
          <p className="text-sm font-black text-amber-950">Criacao de contas restrita ao admin</p>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            Sua conta atual consegue acompanhar e fechar chamados como tecnico. Para criar novos usuarios de T.I/admin,
            entre com uma conta que tenha <strong>role: admin</strong> no Firestore.
          </p>
        </section>
      )}

      <section className="enterprise-panel mt-6 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">Fila de chamados</h2>
            <p className="mt-1 text-sm text-slate-500">Visualize solicitante, prioridade, categoria e status.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Busca</label>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Chamado, solicitante ou e-mail"
                className="enterprise-input px-4 py-2.5 text-sm font-bold placeholder:text-slate-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as TicketStatus | 'Todos')}
                className="enterprise-input px-4 py-2.5 text-sm font-bold"
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
                className="enterprise-input px-4 py-2.5 text-sm font-bold"
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
                className="enterprise-input px-4 py-2.5 text-sm font-bold"
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
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center text-sm font-semibold text-slate-500">
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
