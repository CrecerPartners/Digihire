import { useQuery } from "@tanstack/react-query";
import { supabase } from "@digihire/shared";
import { useAuth } from "@digihire/shared";

export function useAdminRole() {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["admin-role", user?.id],
    queryFn: async () => {
      // Single source of truth: the has_role RPC (backed by user_roles, with
      // its own DB-level super-admin handling). No client-side bypasses.
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      return data as boolean;
    },
    enabled: !!user,
  });

  return { isAdmin, isLoading };
}


