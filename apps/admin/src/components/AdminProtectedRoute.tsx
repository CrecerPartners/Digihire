import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@digihire/shared";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isLoading } = useAdminRole();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !isLoading && user && !isAdmin) {
      toast.error("Access denied. Admin privileges required.", {
        description: "You've been signed out of this session."
      });
      signOut({ skipRedirect: true });
    }
  }, [authLoading, isLoading, user, isAdmin, signOut]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) {
    return null;
  }
  return <>{children}</>;
}


