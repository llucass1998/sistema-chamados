import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, secondaryAuth } from '../firebaseConfig';
import type { UserRole } from '../types';

interface StaffForm {
  login: string;
  email: string;
  password: string;
  companyId: string;
  role: Extract<UserRole, 'tecnico' | 'admin'>;
}

const initialForm: StaffForm = {
  login: '',
  email: '',
  password: '',
  companyId: '',
  role: 'tecnico',
};

function StaffAccountForm() {
  const [form, setForm] = useState<StaffForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMessage('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        form.email.trim(),
        form.password,
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        login: form.login.trim(),
        email: form.email.trim(),
        companyId: form.companyId.trim(),
        role: form.role,
        createdAt: serverTimestamp(),
      });

      await signOut(secondaryAuth);

      setForm(initialForm);
      setMessage('Conta tecnica criada com sucesso.');
    } catch (error) {
      const authError = error as FirebaseError;
      console.error('Erro ao criar conta tecnica:', authError);

      if (authError.code === 'auth/email-already-in-use') {
        setErrorMessage('Este e-mail ja esta cadastrado.');
      } else if (authError.code === 'auth/weak-password') {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      } else if (authError.code === 'auth/invalid-email') {
        setErrorMessage('E-mail invalido.');
      } else {
        setErrorMessage('Nao foi possivel criar a conta tecnica.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="enterprise-panel mt-6 overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
        <p className="enterprise-kicker">Area do administrador</p>
        <h2 className="mt-2 text-lg font-black tracking-tight text-slate-950">Criar conta de T.I/admin</h2>
        <p className="mt-1 text-sm text-slate-500">
          Crie acessos internos para a equipe tecnica gerenciar e fechar chamados.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1fr_180px_180px_auto] lg:items-end">
        {message && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 lg:col-span-5">
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900 lg:col-span-5">
            {errorMessage}
          </p>
        )}

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Nome</label>
          <input
            name="login"
            required
            value={form.login}
            onChange={handleChange}
            placeholder="Nome do tecnico"
            className="enterprise-input w-full px-4 py-3 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">E-mail</label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="ti@empresa.com"
            className="enterprise-input w-full px-4 py-3 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Senha</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            value={form.password}
            onChange={handleChange}
            placeholder="Min. 6"
            className="enterprise-input w-full px-4 py-3 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Perfil</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="enterprise-input w-full px-4 py-3"
          >
            <option value="tecnico">Tecnico</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Empresa</label>
          <input
            name="companyId"
            required
            value={form.companyId}
            onChange={handleChange}
            placeholder="EMP-2026"
            className="enterprise-input w-full px-4 py-3 placeholder:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="enterprise-button-primary px-5 py-3 disabled:opacity-60 lg:col-span-5"
        >
          {loading ? 'Criando...' : 'Criar acesso tecnico'}
        </button>
      </form>
    </section>
  );
}

export default StaffAccountForm;
