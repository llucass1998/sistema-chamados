import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function Dashboard() {
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);

  const [motivo, setMotivo] = useState('');
  const [descricao, setDescricao] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error(error);
      setErrorMessage('Erro ao sair da conta.');
    }
  };

  const limparMensagens = () => {
    setMessage('');
    setErrorMessage('');
  };

  const handleAbrirChamado = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    limparMensagens();

    // Validação simples
    if (!motivo.trim() || !descricao.trim()) {
      setErrorMessage('Preencha todos os campos.');
      return;
    }

    if (descricao.length < 10) {
      setErrorMessage('Descreva melhor o problema.');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'tickets'), {
        motivo: motivo.trim(),
        descricao: descricao.trim(),
        status: 'Aberto',
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });

      setMotivo('');
      setDescricao('');
      setIsCreating(false);

      setMessage('Chamado aberto com sucesso!');
    } catch (error) {
      console.error('Erro ao abrir chamado:', error);
      setErrorMessage('Erro ao abrir o chamado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex justify-between items-center bg-[#1e293b] p-4 rounded-2xl shadow-lg border border-slate-700 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">
            ServiceDesk Pro
          </h1>
          <p className="text-sm text-slate-400">
            Portal de Atendimento
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300 font-semibold transition"
        >
          Sair
        </button>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto">

        {/* Mensagens */}
        {message && (
          <div className="mb-4 bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        {!isCreating ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Meus Chamados
              </h2>

              <button
                onClick={() => {
                  limparMensagens();
                  setIsCreating(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-lg"
              >
                <span className="text-xl">+</span>
                Novo Chamado
              </button>
            </div>

            <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700 text-center text-slate-400">
              Nenhum chamado aberto no momento.
            </div>
          </div>
        ) : (
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 border-b border-slate-600 pb-2">
              Abertura de Chamado
            </h2>

            <form
              onSubmit={handleAbrirChamado}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Motivo do Chamado
                </label>

                <input
                  type="text"
                  required
                  maxLength={80}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Impressora sem conexão na rede"
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  O que está acontecendo?
                </label>

                <textarea
                  required
                  rows={5}
                  maxLength={500}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o problema..."
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 resize-none"
                />

                <p className="text-right text-xs text-slate-500 mt-1">
                  {descricao.length}/500
                </p>
              </div>

              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 font-bold py-3 rounded-lg transition"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Abrindo...' : 'Finalizar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;