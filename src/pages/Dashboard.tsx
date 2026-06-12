import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import AppShell from '../components/AppShell';
import MetricCard from '../components/MetricCard';
import StatusAlert from '../components/StatusAlert';
import TicketCard from '../components/TicketCard';
import TicketDetailsModal from '../components/TicketDetailsModal';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import type { Ticket, TicketCategory, TicketPriority } from '../types';
import { ticketCategories, ticketPriorities } from '../types';
import { sortTicketsByDate, ticketFromDoc } from '../utils/tickets';

interface TicketForm {
  motivo: string;
  descricao: string;
  categoria: TicketCategory;
  prioridade: TicketPriority;
}

const initialForm: TicketForm = {
  motivo: '',
  descricao: '',
  categoria: 'Hardware',
  prioridade: 'Media',
};

function Dashboard() {
  const navigate = useNavigate();
  const { firebaseUser, profile, isStaff } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<TicketForm>(initialForm);
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'Todas'>('Todas');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'Todas'>('Todas');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!firebaseUser) {
      return undefined;
    }

    const ticketsQuery = query(collection(db, 'tickets'), where('userId', '==', firebaseUser.uid));

    const unsubscribe = onSnapshot(
      ticketsQuery,
      (snapshot) => {
        setTickets(sortTicketsByDate(snapshot.docs.map(ticketFromDoc)));
      },
      (error) => {
        console.error('Erro ao carregar chamados:', error);
        setErrorMessage('Nao foi possivel carregar seus chamados.');
      },
    );

    return unsubscribe;
  }, [firebaseUser]);

  const metrics = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === 'Aberto').length,
      progress: tickets.filter((ticket) => ticket.status === 'Em andamento').length,
      closed: tickets.filter((ticket) => ticket.status === 'Fechado').length,
    }),
    [tickets],
  );

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const matchesCategory = categoryFilter === 'Todas' || ticket.categoria === categoryFilter;
        const matchesPriority = priorityFilter === 'Todas' || ticket.prioridade === priorityFilter;

        return matchesCategory && matchesPriority;
      }),
    [categoryFilter, priorityFilter, tickets],
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error(error);
      setErrorMessage('Erro ao sair da conta.');
    }
  };

  const clearMessages = () => {
    setMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (!firebaseUser || !profile) {
      setErrorMessage('Sessao expirada. Faca login novamente.');
      return;
    }

    if (!form.motivo.trim() || !form.descricao.trim()) {
      setErrorMessage('Preencha todos os campos.');
      return;
    }

    if (form.descricao.trim().length < 10) {
      setErrorMessage('Descreva melhor o problema para agilizar o atendimento.');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'tickets'), {
        motivo: form.motivo.trim(),
        descricao: form.descricao.trim(),
        categoria: form.categoria,
        prioridade: form.prioridade,
        status: 'Aberto',
        userId: firebaseUser.uid,
        userEmail: profile.email,
        userName: profile.login,
        companyId: profile.companyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setForm(initialForm);
      setIsCreating(false);
      setMessage('Chamado aberto com sucesso.');
    } catch (error) {
      console.error('Erro ao abrir chamado:', error);
      setErrorMessage('Erro ao abrir o chamado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Portal de Atendimento"
      description={`Bem-vindo, ${profile?.login ?? 'colaborador'}. Acompanhe solicitacoes, prazos e andamento dos seus chamados.`}
      userName={profile?.login}
      userRole={profile?.role}
      isStaff={isStaff}
      onLogout={handleLogout}
      actions={
        isStaff ? (
          <Link
            to="/admin"
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-sky-800"
          >
            Painel tecnico
          </Link>
        ) : null
      }
    >
      {selectedTicket && (
        <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}

      <StatusAlert message={message} type="success" />
      <StatusAlert message={errorMessage} type="error" />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Abertos" value={metrics.open} tone="blue" />
        <MetricCard label="Em andamento" value={metrics.progress} tone="amber" />
        <MetricCard label="Fechados" value={metrics.closed} tone="emerald" />
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">Meus chamados</h2>
            <p className="mt-1 text-sm text-slate-500">Acompanhe cada solicitacao aberta por voce.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Categoria
              </label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as TicketCategory | 'Todas')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 sm:w-40"
              >
                <option value="Todas">Todas</option>
                {ticketCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Prioridade
              </label>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as TicketPriority | 'Todas')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 sm:w-40"
              >
                <option value="Todas">Todas</option>
                {ticketPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                clearMessages();
                setIsCreating((current) => !current);
              }}
              className="rounded-md bg-[#0f172a] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              {isCreating ? 'Fechar formulario' : 'Novo chamado'}
            </button>
          </div>
        </div>

        {isCreating && (
          <form onSubmit={handleSubmit} className="grid gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Motivo</label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={form.motivo}
                  onChange={(event) => setForm((current) => ({ ...current, motivo: event.target.value }))}
                  placeholder="Ex: Impressora sem conexao"
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Categoria</label>
                <select
                  value={form.categoria}
                  onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value as TicketCategory }))}
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                >
                  {ticketCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Descricao</label>
                <textarea
                  required
                  rows={5}
                  maxLength={500}
                  value={form.descricao}
                  onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
                  placeholder="Descreva o problema com detalhes."
                  className="w-full resize-none rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
                <p className="mt-1 text-right text-xs text-slate-500">{form.descricao.length}/500</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Prioridade</label>
                <select
                  value={form.prioridade}
                  onChange={(event) => setForm((current) => ({ ...current, prioridade: event.target.value as TicketPriority }))}
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                >
                  {ticketPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-md border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-sky-700 px-5 py-3 font-black text-white shadow-sm transition hover:bg-sky-800 disabled:opacity-60"
              >
                {loading ? 'Abrindo...' : 'Abrir chamado'}
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-3 p-5">
          {filteredTickets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
              Nenhum chamado encontrado para os filtros atuais.
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onOpenDetails={setSelectedTicket} />
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}

export default Dashboard;
