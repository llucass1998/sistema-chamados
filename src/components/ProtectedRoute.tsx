import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] p-6 text-slate-950">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-sm font-bold shadow-xl shadow-slate-200/70">
          Carregando acesso...
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
