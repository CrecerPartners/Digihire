import { useQuery } from "@tanstack/react-query";
import { supabase } from "@digihire/shared";
import { useAuth } from "@digihire/shared";

const SUPER_ADMINS = [
  "admin@voltafrica.com",
  "admin@digihire.ng",
  "crecerpartnersllc@gmail.com",
  "crecerpartnerllc@gmail.com"
];
const SUPER_ADMIN_PASS = "volt_admin_2026";

export function useAdminRole() {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["admin-role", user?.id],
    queryFn: async () => {
      // Bypasses for specific super admins
      if (user?.email && SUPER_ADMINS.includes(user.email)) return true;
      if (user?.id === "8a2e2dbe-cecb-4868-8641-f48e073e5d43") return true;
      if (user?.id === "1c5183ec-d53a-4a4e-8531-fc19e8343354") return true;
      
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


