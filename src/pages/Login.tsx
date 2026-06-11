import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const navigate = useNavigate();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && firebaseUser) {
      navigate('/dashboard');
    }
  }, [authLoading, firebaseUser, navigate]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (authError) {
      console.error(authError);
      setError('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] px-4 py-8 text-slate-950">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 lg:grid-cols-[1.1fr_440px]">
        <section className="flex flex-col justify-between bg-[#0f172a] p-8 text-white sm:p-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-sm font-black text-[#0f172a]">
                SD
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-300">ServiceDesk</p>
                <p className="text-xs text-slate-400">Operations Suite</p>
              </div>
            </div>

            <div className="mt-16 max-w-xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">Portal corporativo</p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Atendimento interno com rastreabilidade.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-300">
                Organize solicitacoes, priorize chamados e acompanhe o fluxo de suporte com uma experiencia limpa para colaborador e equipe tecnica.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <strong className="block text-white">Status</strong>
              <span className="mt-1 block">Fila visivel por etapa.</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <strong className="block text-white">Prioridade</strong>
              <span className="mt-1 block">Urgencias em destaque.</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <strong className="block text-white">Equipe</strong>
              <span className="mt-1 block">Painel tecnico separado.</span>
            </div>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10">
          <div className="w-full">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Acesso seguro</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Entrar no sistema</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use seu e-mail corporativo para acessar seus chamados.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                placeholder="seu.nome@empresa.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                placeholder="********"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-md bg-[#0f172a] px-4 py-3 font-black text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-60"
            >
              {loading ? 'Autenticando...' : 'Entrar no sistema'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Ainda nao possui acesso?{' '}
            <Link to="/register" className="font-black text-sky-700 transition hover:text-sky-900">
              Criar conta
            </Link>
          </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
