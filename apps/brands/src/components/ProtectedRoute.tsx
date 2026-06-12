import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@digihire/shared';

// UX redirect only — not a security boundary. Actual data access is enforced by Supabase RLS on the server.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

  // Roles come from app_metadata (server-controlled, mirrored at signup by
  // the before_auth_user_created_mirror_roles trigger) — user_metadata is
  // client-editable and must not be trusted. Supports legacy single string.
  const meta = (user?.app_metadata ?? {}) as { account_types?: string[]; account_type?: string };
  const roles: string[] = Array.isArray(meta.account_types)
    ? meta.account_types
    : meta.account_type
      ? [meta.account_type]
      : [];

  if (!user || !roles.includes('brand')) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
