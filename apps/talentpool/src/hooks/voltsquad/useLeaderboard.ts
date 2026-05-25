import { useQuery } from "@tanstack/react-query";
import { supabase } from "@digihire/shared";
import { useAuth } from "@digihire/shared";

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  university: string;
  total_earnings: number;
  total_sales: number;
  rank: number;
  isCurrentUser?: boolean;
}

export function useLeaderboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_view" as any)
        .select("*")
        .order("rank", { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data as unknown as LeaderboardEntry[]).map((entry) => ({
        ...entry,
        isCurrentUser: entry.user_id === user?.id,
      }));
    },
    enabled: !!user,
  });
}
