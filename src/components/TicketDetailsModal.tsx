import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import type { Ticket, TicketComment } from '../types';
import { commentFromDoc, formatDate, sortCommentsByDate } from '../utils/tickets';

interface TicketDetailsModalProps {
  ticket: Ticket;
  onClose: () => void;
}

const maxAttachmentSize = 5 * 1024 * 1024;

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

function TicketDetailsModal({ ticket, onClose }: TicketDetailsModalProps) {
  const { firebaseUser, profile } = useAuth();

  const [comments, setComments] = useState<TicketComment[]>([]);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const commentsRef = collection(db, 'tickets', ticket.id, 'comments');

    const unsubscribe = onSnapshot(
      commentsRef,
      (snapshot) => {
        setComments(sortCommentsByDate(snapshot.docs.map(commentFromDoc)));
      },
      (error) => {
        console.error('Erro ao carregar comentarios:', error);
        setErrorMessage('Nao foi possivel carregar a conversa do chamado.');
      },
    );

    return unsubscribe;
  }, [ticket.id]);

  const canSubmit = useMemo(() => message.trim().length > 0 || Boolean(file), [file, message]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!firebaseUser || !profile) {
      setErrorMessage('Sessao expirada. Faca login novamente.');
      return;
    }

    if (!canSubmit) {
      setErrorMessage('Escreva uma resposta ou selecione um anexo.');
      return;
    }

    if (file && file.size > maxAttachmentSize) {
      setErrorMessage('O anexo deve ter no maximo 5MB.');
      return;
    }

    setLoading(true);

    try {
      let attachmentData = {};

      if (file) {
        const filePath = `ticket-attachments/${ticket.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const attachmentRef = ref(storage, filePath);

        await uploadBytes(attachmentRef, file, {
          contentType: file.type,
        });

        const attachmentUrl = await getDownloadURL(attachmentRef);

        attachmentData = {
          attachmentName: file.name,
          attachmentPath: filePath,
          attachmentType: file.type,
          attachmentUrl,
        };
      }

      await addDoc(collection(db, 'tickets', ticket.id, 'comments'), {
        message: message.trim(),
        authorId: firebaseUser.uid,
        authorName: profile.login,
        authorRole: profile.role,
        createdAt: serverTimestamp(),
        ...attachmentData,
      });

      await updateDoc(doc(db, 'tickets', ticket.id), {
        updatedAt: serverTimestamp(),
      });

      setMessage('');
      setFile(null);
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      setErrorMessage('Nao foi possivel enviar a resposta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm">
      <section className="enterprise-panel flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden">
        <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="enterprise-kicker">Detalhes do chamado</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">{ticket.motivo}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {ticket.status} - {ticket.categoria} - {ticket.prioridade}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="enterprise-button-secondary px-4 py-2 text-sm"
          >
            Fechar
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[1fr_320px]">
          <div className="min-h-0 overflow-y-auto px-5 py-4">
            <p className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700">
              {ticket.descricao}
            </p>

            <div className="mt-5 grid gap-3">
              {comments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                  Nenhuma resposta registrada ainda.
                </div>
              ) : (
                comments.map((comment) => (
                  <article key={comment.id} className="enterprise-card p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <strong className="text-sm font-black text-slate-950">{comment.authorName}</strong>
                      <span className="text-xs font-semibold text-slate-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      {comment.authorRole}
                    </p>
                    {comment.message && <p className="mt-3 text-sm leading-6 text-slate-700">{comment.message}</p>}
                    {comment.attachmentUrl && (
                      <a
                        href={comment.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-black text-blue-800 transition hover:bg-blue-100"
                      >
                        Abrir anexo: {comment.attachmentName ?? 'arquivo'}
                      </a>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-slate-50/80 p-5 lg:border-l lg:border-t-0">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Responder</h3>

            {errorMessage && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
                {errorMessage}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Mensagem</label>
                <textarea
                  rows={6}
                  maxLength={700}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Escreva uma resposta para o chamado."
                  className="enterprise-input w-full resize-none px-4 py-3 text-sm placeholder:text-slate-400"
                />
                <p className="mt-1 text-right text-xs text-slate-500">{message.length}/700</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Anexo</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">Aceita imagens ou PDF de ate 5MB.</p>
              </div>

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="enterprise-button-primary px-4 py-3 text-sm disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:shadow-none"
              >
                {loading ? 'Enviando...' : 'Enviar resposta'}
              </button>
            </form>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default TicketDetailsModal;
