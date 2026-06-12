import { useState, useEffect } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import type { RecruitmentRequest } from '../types';
import { getFriendlyError } from '@digihire/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

export function useRecruitmentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    supabase
      .from('recruitment_requests')
      .select('*')
      .eq('brand_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: RecruitmentRequest[] | null; error: { message: string } | null }) => {
        setRequests(err ? [] : (data ?? []));
        setError(getFriendlyError(err));
        setLoading(false);
      });
  }, [user?.id]);

  const createRequest = async (payload: Omit<RecruitmentRequest, 'id' | 'brand_id' | 'status' | 'applicant_count' | 'shortlist_count' | 'assigned_support' | 'created_at' | 'updated_at'>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    const { data, error: err } = await supabase
      .from('recruitment_requests')
      .insert({ ...payload, brand_id: user.id })
      .select()
      .single();
    if (!err && data) setRequests(prev => [data, ...prev]);
    return { data, error: err };
  };

  return { requests, loading, error, createRequest };
}
