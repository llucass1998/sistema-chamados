import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 shadow-2xl">
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
