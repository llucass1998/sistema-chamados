
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { FirebaseError } from 'firebase/app';

import { auth, db } from '../firebaseConfig';

interface FormData {
  login: string;
  email: string;
  cpf: string;
  birthdate: string;
  companyId: string;
  password: string;
}

function Register() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<FormData>({
    login: '',
    email: '',
    cpf: '',
    birthdate: '',
    companyId: '',
    password: '',
  });

  // Atualiza os campos do formulário
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Cadastro do usuário
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      // Cria usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Salva dados adicionais no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        login: formData.login,
        email: formData.email,
        cpf: formData.cpf,
        birthdate: formData.birthdate,
        companyId: formData.companyId,
        role: 'colaborador',
        createdAt: serverTimestamp(),
      });

      // Redireciona para login
      navigate('/');
    } catch (error) {
      const authError = error as FirebaseError;

      console.error('Firebase Error:', authError.code);
      console.error('Mensagem:', authError.message);

      switch (authError.code) {
        case 'auth/email-already-in-use':
          setError('Este e-mail já está cadastrado.');
          break;

        case 'auth/invalid-email':
          setError('E-mail inválido.');
          break;

        case 'auth/weak-password':
          setError('A senha deve possuir pelo menos 6 caracteres.');
          break;

        case 'auth/network-request-failed':
          setError('Erro de conexão. Verifique sua internet.');
          break;

        case 'auth/invalid-api-key':
        case 'auth/api-key-not-valid':
          setError(
            'API Key do Firebase inválida. Verifique o arquivo .env.'
          );
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
    <div className="min-h-screen flex items-center justify-center p-4 py-10 bg-[#0f172a]">
      <div className="bg-[#1e293b] p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Novo Colaborador
          </h1>

          <p className="text-slate-400 mt-2">
            Preencha os dados para criar sua conta
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* LOGIN */}
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-1">
              Login
            </label>

            <input
              type="text"
              name="login"
              required
              value={formData.login}
              onChange={handleChange}
              placeholder="Seu login"
              className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* EMAIL */}
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-1">
              E-mail
            </label>

            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="email@empresa.com"
              className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* CPF */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              CPF
            </label>

            <input
              type="text"
              name="cpf"
              required
              value={formData.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* NASCIMENTO */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Data de Nascimento
            </label>

            <input
              type="date"
              name="birthdate"
              required
              value={formData.birthdate}
              onChange={handleChange}
              className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* EMPRESA */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              ID Empresa
            </label>

            <input
              type="text"
              name="companyId"
              required
              value={formData.companyId}
              onChange={handleChange}
              placeholder="EMP-2026"
              className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* SENHA */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Senha
            </label>

            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* ERRO */}
          {error && (
            <p className="text-red-400 text-sm font-medium md:col-span-2">
              {error}
            </p>
          )}

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 rounded-lg mt-4 md:col-span-2 disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Finalizar Cadastro'}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-6 text-sm">
          Já possui conta?{' '}
          <Link
            to="/"
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

