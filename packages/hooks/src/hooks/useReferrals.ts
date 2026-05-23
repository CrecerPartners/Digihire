import { useQuery } from "@tanstack/react-query";
import { supabase } from "@digihire/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface Referral {
  id: string;
  referrer_id: string;
  referred_name: string;
  date: string;
  status: "signed_up" | "active" | "earned";
  earnings: number;
}

export function useReferrals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals" as any)
        .select("*")
        .eq("referrer_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as unknown as Referral[];
    },
    enabled: !!user,
  });
}


