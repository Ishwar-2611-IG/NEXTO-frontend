import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isLoading, isLoggedIn, user } = useAuth();
  if (isLoading) return <div className="px-6 py-20 text-center text-sm text-[#7E7C77]">Checking administrator access…</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (!["admin", "support", "inventory_manager"].includes(user?.role ?? "")) return <Navigate to="/" replace />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}
