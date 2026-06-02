import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@digihire/shared";
import { useAuth } from "@digihire/shared";

export function useMyShopItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-shop-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_shop_items")
        .select("product_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []).map((d) => d.product_id);
    },
    enabled: !!user,
  });
}

export function useAddToShop() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("seller_shop_items")
        .insert({ user_id: user!.id, product_id: productId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-shop-items"] });
    },
  });
}

export function useRemoveFromShop() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("seller_shop_items")
        .delete()
        .eq("user_id", user!.id)
        .eq("product_id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-shop-items"] });
    },
  });
}
