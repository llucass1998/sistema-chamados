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
    <div className="auth-page px-4 py-8 text-slate-950">
      <main className="enterprise-panel mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden lg:grid-cols-[360px_1fr]">
        <aside className="enterprise-sidebar p-8 text-white sm:p-10">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 text-sm font-black text-white shadow-lg shadow-blue-950/30">
              SD
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white">ServiceDesk</p>
              <p className="text-xs text-slate-400">Operations Suite</p>
            </div>
          </div>

          <div className="mt-16">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Novo colaborador</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight">Cadastro de acesso</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Depois do cadastro, o usuario entra como colaborador e pode abrir chamados. Perfis tecnico e admin sao definidos no Firestore.
            </p>
          </div>
        </aside>

        <section className="flex items-center p-6 sm:p-10">
          <div className="w-full">
            <div className="mb-8">
              <p className="enterprise-kicker">Solicitar acesso</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Cadastrar colaborador</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Crie sua conta para abrir e acompanhar chamados internos.
              </p>
            </div>

            <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Nome ou login</label>
                <input
                  type="text"
                  name="login"
                  required
                  value={formData.login}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  className="enterprise-input w-full px-4 py-3 placeholder:text-slate-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">E-mail</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@empresa.com"
                  className="enterprise-input w-full px-4 py-3 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  required
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  className="enterprise-input w-full px-4 py-3 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Data de nascimento</label>
                <input
                  type="date"
                  name="birthdate"
                  required
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="enterprise-input w-full px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">ID da empresa</label>
                <input
                  type="text"
                  name="companyId"
                  required
                  value={formData.companyId}
                  onChange={handleChange}
                  placeholder="EMP-2026"
                  className="enterprise-input w-full px-4 py-3 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Senha</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimo 6 caracteres"
                  className="enterprise-input w-full px-4 py-3 placeholder:text-slate-400"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900 md:col-span-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="enterprise-button-primary mt-2 px-4 py-3 disabled:opacity-60 md:col-span-2"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Ja possui conta?{' '}
              <Link to="/" className="font-black text-blue-700 transition hover:text-blue-900">
                Fazer login
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Register;
