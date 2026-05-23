import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@digihire/supabase";
import { useProfile } from "./useProfile";

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  brand_name: string;
  banner_image_url: string | null;
  join_type: "instant" | "approval";
  status: "draft" | "active" | "paused" | "ended";
  eligibility_type: "open" | "restricted";
  eligibility_criteria: Record<string, unknown> | null;
  commission_type: "percentage" | "flat";
  commission_value: number;
  commission_per: "sale" | "lead" | "activation";
  start_date: string | null;
  end_date: string | null;
  assets: Array<{ label: string; url: string; type: string }>;
  tracking_link_base: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CampaignMembership {
  id: string;
  campaign_id: string;
  seller_id: string;
  status: "pending" | "approved" | "rejected";
  tracking_link: string | null;
  joined_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_note: string | null;
}

export interface CampaignSubmission {
  id: string;
  campaign_id: string;
  seller_id: string;
  membership_id: string;
  submission_type: "manual" | "tracked";
  amount: number;
  evidence_url: string | null;
  notes: string | null;
  status: "pending_review" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface CampaignEarning {
  id: string;
  campaign_id: string;
  seller_id: string;
  submission_id: string | null;
  amount: number;
  status: "pending" | "paid" | "rejected";
  approved_at: string | null;
  approved_by: string | null;
  transaction_id: string | null;
  created_at: string;
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns" as any)
        .select("*")
        .in("status", ["active", "paused", "ended"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Campaign[];
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as Campaign;
    },
    enabled: !!id,
  });
}

export function useMyCampaignMemberships() {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ["campaign-memberships", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_memberships" as any)
        .select("*, campaign:campaigns(*)")
        .eq("seller_id", profile!.id)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Array<CampaignMembership & { campaign: Campaign }>;
    },
    enabled: !!profile?.id,
  });
}

export function useCampaignMembership(campaignId: string) {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ["campaign-membership", campaignId, profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_memberships" as any)
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("seller_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CampaignMembership | null;
    },
    enabled: !!profile?.id && !!campaignId,
  });
}

export function useJoinCampaign() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      if (!profile?.id) throw new Error("Profile not loaded");
      const { data: campaign, error: cErr } = await supabase
        .from("campaigns" as any)
        .select("join_type, tracking_link_base")
        .eq("id", campaignId)
        .single();
      if (cErr) throw cErr;

      const c = campaign as unknown as { join_type: string; tracking_link_base: string | null };
      const isInstant = c.join_type === "instant";
      const trackingLink =
        isInstant && c.tracking_link_base
          ? `${c.tracking_link_base}?ref=${profile!.id}`
          : null;

      const { error } = await supabase.from("campaign_memberships" as any).insert({
        campaign_id: campaignId,
        seller_id: profile!.id,
        status: isInstant ? "approved" : "pending",
        tracking_link: trackingLink,
      });
      if (error) throw error;
    },
    onSuccess: (_data, campaignId) => {
      qc.invalidateQueries({ queryKey: ["campaign-memberships"] });
      qc.invalidateQueries({ queryKey: ["campaign-membership", campaignId] });
    },
  });
}

export function useCampaignSubmissions(campaignId: string) {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ["campaign-submissions", campaignId, profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_submissions" as any)
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("seller_id", profile!.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CampaignSubmission[];
    },
    enabled: !!profile?.id && !!campaignId,
  });
}

export function useSubmitEntry() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: async (input: {
      campaignId: string;
      membershipId: string;
      submissionType: "manual" | "tracked";
      amount: number;
      evidenceUrl?: string;
      notes?: string;
    }) => {
      if (!profile?.id) throw new Error("Profile not loaded");
      const { error } = await supabase.from("campaign_submissions" as any).insert({
        campaign_id: input.campaignId,
        seller_id: profile!.id,
        membership_id: input.membershipId,
        submission_type: input.submissionType,
        amount: input.amount,
        evidence_url: input.evidenceUrl ?? null,
        notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ["campaign-submissions", input.campaignId] });
    },
  });
}

export function useMyCampaignEarnings(campaignId?: string) {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ["campaign-earnings", campaignId ?? "all", profile?.id],
    queryFn: async () => {
      let query = supabase
        .from("campaign_earnings" as any)
        .select("*")
        .eq("seller_id", profile!.id);
      if (campaignId) query = query.eq("campaign_id", campaignId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CampaignEarning[];
    },
    enabled: !!profile?.id,
  });
}


