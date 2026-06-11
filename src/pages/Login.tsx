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
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">ServiceDesk Pro</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
            Sistema de chamados para suporte interno.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Abra solicitacoes, acompanhe o atendimento e organize o fluxo de suporte tecnico em um painel simples e direto.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/50">
          <div className="mb-8">
            <h2 className="text-2xl font-black">Entrar</h2>
            <p className="mt-2 text-sm text-slate-400">Acesse o portal com seu e-mail corporativo.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                placeholder="seu.nome@empresa.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                placeholder="********"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-blue-600 px-4 py-3 font-black text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Autenticando...' : 'Entrar no sistema'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Ainda nao possui acesso?{' '}
            <Link to="/register" className="font-bold text-blue-300 transition hover:text-blue-200">
              Criar conta
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export default Login;
