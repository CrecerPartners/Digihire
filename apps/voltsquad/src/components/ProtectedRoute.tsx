import { useAuth } from "@digihire/shared";
import { Navigate } from "react-router-dom";

// Resolves an account_types array from user metadata, supporting both
// the new array format ('account_types') and the legacy string ('account_type').
function getRoles(user: ReturnType<typeof useAuth>["user"]): string[] {
  const meta = user?.user_metadata ?? {};
  if (Array.isArray(meta.account_types)) return meta.account_types;
  if (typeof meta.account_type === "string") return [meta.account_type];
  return [];
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const roles = getRoles(user);
  // Admin users bypass the role check — they can access every app
  const isAdmin = roles.includes("admin");
  const isVoltsquad = roles.includes("voltsquad");

  if (!isAdmin && !isVoltsquad) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
