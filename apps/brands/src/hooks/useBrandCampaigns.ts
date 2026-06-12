import { useState, useEffect, useCallback } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import type { BrandCampaign } from '../types';
import { getFriendlyError } from '@digihire/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

export function useBrandCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('brand_campaigns')
      .select('*')
      .eq('brand_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: BrandCampaign[] | null; error: { message: string } | null }) => {
        setCampaigns(err ? [] : (data ?? []));
        setError(getFriendlyError(err));
        setLoading(false);
      });
  }, [user?.id]);

  useEffect(() => { fetch(); }, [fetch]);

  const createCampaign = async (payload: Omit<BrandCampaign, 'id' | 'brand_id' | 'status' | 'total_sellers' | 'total_conversions' | 'total_leads' | 'tracking_code' | 'created_at' | 'updated_at'>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    const { data, error: err } = await supabase
      .from('brand_campaigns')
      .insert({ ...payload, brand_id: user.id })
      .select()
      .single();
    if (!err && data) setCampaigns(prev => [data, ...prev]);
    return { data, error: err };
  };

  return { campaigns, loading, error, createCampaign, refetch: fetch };
}
