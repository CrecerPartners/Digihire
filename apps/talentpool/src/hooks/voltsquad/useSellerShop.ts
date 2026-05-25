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

export function usePublicSellerShop(shopSlug: string | undefined) {
  const profileQuery = useQuery({
    queryKey: ["public-seller-profile", shopSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, bio, shop_name, shop_slug, avatar_url, referral_code, user_id, shop_logo_url, verification_status")
        .eq("shop_slug", shopSlug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!shopSlug,
  });

  const productsQuery = useQuery({
    queryKey: ["public-seller-products", profileQuery.data?.user_id],
    queryFn: async () => {
      const userId = profileQuery.data!.user_id;
      const { data: shopItems, error: siErr } = await supabase
        .from("seller_shop_items")
        .select("product_id")
        .eq("user_id", userId);
      if (siErr) throw siErr;
      if (!shopItems?.length) return [];

      const productIds = shopItems.map((s) => s.product_id);
      const { data: products, error: pErr } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);
      if (pErr) throw pErr;
      return products || [];
    },
    enabled: !!profileQuery.data?.user_id,
  });

  return {
    seller: profileQuery.data,
    products: productsQuery.data || [],
    isLoading: profileQuery.isLoading || productsQuery.isLoading,
    error: profileQuery.error || productsQuery.error,
  };
}
