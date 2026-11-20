import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="px-4 py-20 text-center text-sm text-[#7E7C77]">Checking your session…</div>;
  if (!isLoggedIn) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
