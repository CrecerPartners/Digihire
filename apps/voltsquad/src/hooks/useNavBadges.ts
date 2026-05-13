import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import { useProfile } from "@digihire/shared";

export function useNavBadges(): Record<string, number> {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: pendingOrdersCount = 0 } = useQuery({
    queryKey: ["nav-badge-orders", profile?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status")
        .eq("user_id", profile!.user_id)
        .in("status", ["pending", "processing"]);
      if (error) return 0;
      return (data as any[]).length;
    },
    enabled: !!profile?.user_id,
    refetchInterval: 60_000,
  });

  // Realtime: refresh badge when orders change
  useEffect(() => {
    if (!profile?.user_id) return;
    const channel = supabase
      .channel("nav-badge-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${profile.user_id}` },
        () => queryClient.invalidateQueries({ queryKey: ["nav-badge-orders", profile.user_id] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.user_id, queryClient]);

  return { orders: pendingOrdersCount };
}
