import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@digihire/shared';

// UX redirect only — not a security boundary. Actual data access is enforced by Supabase RLS on the server.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

  // Support both single string (legacy) and array of roles
  const roles: string[] = Array.isArray(user?.user_metadata?.account_types)
    ? user.user_metadata.account_types
    : user?.user_metadata?.account_type
      ? [user.user_metadata.account_type]
      : [];

  if (!user || !roles.includes('talent')) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
