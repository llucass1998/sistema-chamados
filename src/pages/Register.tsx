import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

interface FormData {
  login: string;
  email: string;
  cpf: string;
  birthdate: string;
  companyId: string;
  password: string;
}

const initialForm: FormData = {
  login: '',
  email: '',
  cpf: '',
  birthdate: '',
  companyId: '',
  password: '',
};

function Register() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>(initialForm);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        login: formData.login.trim(),
        email: formData.email.trim(),
        cpf: formData.cpf.trim(),
        birthdate: formData.birthdate,
        companyId: formData.companyId.trim(),
        role: 'colaborador',
        createdAt: serverTimestamp(),
      });

      navigate('/dashboard');
    } catch (error) {
      const authError = error as FirebaseError;
      console.error('Firebase Error:', authError.code);

      switch (authError.code) {
        case 'auth/email-already-in-use':
          setError('Este e-mail ja esta cadastrado.');
          break;
        case 'auth/invalid-email':
          setError('E-mail invalido.');
          break;
        case 'auth/weak-password':
          setError('A senha deve possuir pelo menos 6 caracteres.');
          break;
        case 'auth/network-request-failed':
          setError('Erro de conexao. Verifique sua internet.');
          break;
        case 'auth/invalid-api-key':
        case 'auth/api-key-not-valid':
          setError('API Key do Firebase invalida. Verifique o arquivo .env.');
          break;
        default:
          setError('Erro ao criar conta. Tente novamente.');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/50 sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-400">Novo acesso</p>
            <h1 className="mt-3 text-3xl font-black">Cadastrar colaborador</h1>
            <p className="mt-2 text-sm text-slate-400">
              Crie sua conta para abrir e acompanhar chamados internos.
            </p>
          </div>

          <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-300">Nome ou login</label>
              <input
                type="text"
                name="login"
                required
                value={formData.login}
                onChange={handleChange}
                placeholder="Seu nome"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-300">E-mail</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="email@empresa.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">CPF</label>
              <input
                type="text"
                name="cpf"
                required
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">Data de nascimento</label>
              <input
                type="date"
                name="birthdate"
                required
                value={formData.birthdate}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">ID da empresa</label>
              <input
                type="text"
                name="companyId"
                required
                value={formData.companyId}
                onChange={handleChange}
                placeholder="EMP-2026"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">Senha</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimo 6 caracteres"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 md:col-span-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-blue-600 px-4 py-3 font-black text-white transition hover:bg-blue-500 disabled:opacity-60 md:col-span-2"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Ja possui conta?{' '}
            <Link to="/" className="font-bold text-blue-300 transition hover:text-blue-200">
              Fazer login
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export default Register;
