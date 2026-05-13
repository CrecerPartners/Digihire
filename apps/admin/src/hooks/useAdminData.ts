import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@digihire/shared";

// ── Queries ──

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminSales() {
  return useQuery({
    queryKey: ["admin-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, products(name, brand, product_type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch seller names
      const userIds = [...new Set(data.map((s) => s.user_id))];
      if (userIds.length === 0) return data;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));
      return data.map((s) => ({ ...s, profiles: profileMap[s.user_id] || null }));
    },
  });
}

export function useAdminPayouts() {
  return useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      // Fetch profile names for each unique user_id
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));
      return data.map((p) => ({ ...p, profile: profileMap[p.user_id] || null }));
    },
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useAdminCourses() {
  return useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("*, training_lessons(*)")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminTalentCourses() {
  return useQuery({
    queryKey: ["admin-talent-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_courses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminTransactions() {
  return useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminReferrals() {
  return useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch referrer names
      const referrerIds = [...new Set(data.map((r) => r.referrer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", referrerIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));
      return data.map((r) => ({ ...r, referrer_name: profileMap[r.referrer_id]?.name || "Unknown" }));
    },
  });
}

export function useAdminLeaderboard() {
  return useQuery({
    queryKey: ["admin-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_view")
        .select("*")
        .order("rank");
      if (error) throw error;
      return data;
    },
  });
}

// ── Mutations ──

export function useUpdateSaleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ saleId, status }: { saleId: string; status: string }) => {
      const { error } = await supabase.from("sales").update({ status }).eq("id", saleId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sales"] });
      qc.invalidateQueries({ queryKey: ["admin-transactions"] });
    },
  });
}

export function useUpdateSaleDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ saleId, updates }: { saleId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("sales").update(updates).eq("id", saleId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sales"] }),
  });
}

export function useUpdateTransactionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ transactionId, status }: { transactionId: string; status: string }) => {
      const { error } = await supabase.from("transactions").update({ status }).eq("id", transactionId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-transactions"] }),
  });
}

export function useUpdatePayoutStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ payoutId, status, notes }: { payoutId: string; status: string; notes?: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === "processed") update.processed_at = new Date().toISOString();
      if (notes !== undefined) update.notes = notes;
      const { error } = await supabase.from("payouts").update(update).eq("id", payoutId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-payouts"] }),
  });
}

export function useUpsertProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Record<string, unknown>) => {
      const { error } = await supabase.from("products").upsert(product as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useInsertLicenseKeys() {
  return useMutation({
    mutationFn: async ({ productId, keys }: { productId: string; keys: string[] }) => {
      const payload = keys.map((key) => ({
        product_id: productId,
        key_value: key,
        is_used: false,
      }));
      const { error } = await supabase.from("license_keys").insert(payload);
      if (error) throw error;
    },
  });
}


export function useUpsertCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (course: Record<string, unknown>) => {
      const { error } = await supabase.from("training_courses").upsert(course as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function useUpsertTalentCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (course: Record<string, unknown>) => {
      const { error } = await supabase.from("talent_courses").upsert(course as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-talent-courses"] }),
  });
}

export function useDeleteTalentCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("talent_courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-talent-courses"] }),
  });
}

export function useUpsertLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lesson: Record<string, unknown>) => {
      const { error } = await supabase.from("training_lessons").upsert(lesson as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function useUpdateUserTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: string }) => {
      const { error } = await supabase.from("profiles").update({ tier }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useUpdateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ referralId, updates }: { referralId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("referrals").update(updates).eq("id", referralId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-referrals"] }),
  });
}


