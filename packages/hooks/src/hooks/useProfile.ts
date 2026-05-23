import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@digihire/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  university: string;
  whatsapp: string;
  bank_name: string;
  account_number: string;
  tier: string;
  referral_code: string;
  avatar_url: string;
  bio: string;
  shop_name: string;
  shop_slug: string | null;
  shop_logo_url: string;
  account_type: string;
  id_document_url: string;
  verification_status: string;
  transaction_pin?: string;
  bank_code?: string;
  bank_account_verified?: boolean;
  security_locked_until?: string;
  nin?: string;
  bvn?: string;
  proof_of_address_url?: string;
  social_links: { tiktok?: string; snapchat?: string; instagram?: string; twitter?: string };
  income_target_amount?: number;
  income_target_timeframe?: 'weekly' | 'monthly';
  income_target_items?: { productId: string; quantity: number }[];
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as unknown as Profile;
    },
    enabled: !!user,
  });

  return query;
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { error } = await supabase
        .from("profiles" as any)
        .update(updates as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user!.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatar_url = urlData.publicUrl + "?t=" + Date.now();

      const { error: updateError } = await supabase
        .from("profiles" as any)
        .update({ avatar_url } as any)
        .eq("user_id", user!.id);
      if (updateError) throw updateError;

      return avatar_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}


