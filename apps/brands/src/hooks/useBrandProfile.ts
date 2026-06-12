import { useState, useEffect } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import type { BrandProfile } from '../types';
import { getFriendlyError } from '@digihire/shared';

const supabase = _supabase as any;

export function useBrandProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error: err }: { data: BrandProfile | null; error: { message: string } | null }) => {
        if (mounted) {
          setProfile(err ? null : data);
          setError(getFriendlyError(err));
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [user?.id]);

  const updateProfile = async (updates: Partial<BrandProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { data, error: err } = await supabase
      .from('brand_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .maybeSingle();
    if (!err && data) setProfile(data);
    return { error: err };
  };

  return { profile, loading, error, setProfile, updateProfile };
}
