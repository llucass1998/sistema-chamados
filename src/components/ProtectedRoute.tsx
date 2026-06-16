import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page flex min-h-screen items-center justify-center p-6 text-slate-950">
        <div className="enterprise-card px-6 py-5 text-sm font-bold">
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
