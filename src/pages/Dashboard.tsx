import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import TicketCard from '../components/TicketCard';
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
      resolved: tickets.filter((ticket) => ticket.status === 'Resolvido').length,
    }),
    [tickets],
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
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <header className="mx-auto flex max-w-6xl flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-slate-950/40 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-400">ServiceDesk Pro</p>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Portal de Atendimento</h1>
          <p className="mt-1 text-sm text-slate-400">
            Bem-vindo, {profile?.login ?? 'colaborador'}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isStaff && (
            <Link
              to="/admin"
              className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-200 transition hover:bg-blue-500/20"
            >
              Painel tecnico
            </Link>
          )}
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

        <section className="grid gap-4 md:grid-cols-4">
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
        </section>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Meus chamados</h2>
              <p className="mt-1 text-sm text-slate-400">
                Acompanhe o status das solicitacoes abertas por voce.
              </p>
            </div>

            <button
              onClick={() => {
                clearMessages();
                setIsCreating((current) => !current);
              }}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"
            >
              {isCreating ? 'Fechar formulario' : 'Novo chamado'}
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">Motivo</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={form.motivo}
                    onChange={(event) => setForm((current) => ({ ...current, motivo: event.target.value }))}
                    placeholder="Ex: Impressora sem conexao"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">Categoria</label>
                  <select
                    value={form.categoria}
                    onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value as TicketCategory }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
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
                  <label className="mb-2 block text-sm font-bold text-slate-300">Descricao</label>
                  <textarea
                    required
                    rows={5}
                    maxLength={500}
                    value={form.descricao}
                    onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
                    placeholder="Descreva o problema com detalhes."
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                  <p className="mt-1 text-right text-xs text-slate-500">{form.descricao.length}/500</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={(event) => setForm((current) => ({ ...current, prioridade: event.target.value as TicketPriority }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
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
                  className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-200 transition hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {loading ? 'Abrindo...' : 'Abrir chamado'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 grid gap-4">
            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-8 text-center text-slate-400">
                Nenhum chamado aberto ate o momento.
              </div>
            ) : (
              tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
