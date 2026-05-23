import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@digihire/supabase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export interface Sale {
  id: string;
  user_id: string;
  product_id: string | null;
  date: string;
  customer: string;
  quantity: number;
  amount: number;
  commission: number;
  status: "confirmed" | "pending" | "cancelled";
  conversion_status: string | null;
  proof_file_url: string | null;
  notes: string | null;
  created_at: string;
  product_name?: string;
  category?: string;
  product_type?: string;
}

export function useSales() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sales", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, products:product_id(name, category, product_type)")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((s) => ({
        ...s,
        product_name: s.products?.name || "Unknown",
        category: s.products?.category || "",
        product_type: s.products?.product_type || "Physical",
      })) as Sale[];
    },
    enabled: !!user,
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (saleId: string) => {
      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("id", saleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Sale deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete sale"),
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const { error } = await supabase
        .from("sales")
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Sale updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update sale"),
  });
}


