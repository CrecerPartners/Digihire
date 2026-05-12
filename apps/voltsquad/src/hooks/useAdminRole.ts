import { useQuery } from "@tanstack/react-query";
import { supabase } from "@digihire/shared";
import { useAuth } from "@digihire/shared";

export function useAdminRole() {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["admin-role", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user,
  });

  return { isAdmin, isLoading };
}
