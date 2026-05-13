import { useState, useEffect } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

export interface TalentWebinar {
  id: string;
  title: string;
  description?: string;
  host_name?: string;
  host_title?: string;
  host_photo_url?: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url?: string;
  cover_color: string;
  category: string;
  max_registrations?: number;
  is_published: boolean;
  created_at?: string;
}

export interface WebinarRegistration {
  id: string;
  webinar_id: string;
  user_id: string;
  registered_at: string;
}

export function useTalentWebinars() {
  const [webinars, setWebinars] = useState<TalentWebinar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('talent_webinars')
      .select('*')
      .eq('is_published', true)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .then(({ data }: { data: TalentWebinar[] | null }) => {
        if (mounted) {
          setWebinars(data ?? []);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  return { webinars, loading };
}

export function useWebinarRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<WebinarRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let mounted = true;
    supabase
      .from('talent_webinar_registrations')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }: { data: WebinarRegistration[] | null }) => {
        if (mounted) {
          setRegistrations(data ?? []);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [user?.id]);

  const register = async (webinarId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { data, error } = await supabase
      .from('talent_webinar_registrations')
      .insert({ webinar_id: webinarId, user_id: user.id })
      .select()
      .single();
    if (!error && data) setRegistrations(prev => [...prev, data]);
    return { error };
  };

  const unregister = async (webinarId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase
      .from('talent_webinar_registrations')
      .delete()
      .match({ webinar_id: webinarId, user_id: user.id });
    if (!error) setRegistrations(prev => prev.filter(r => r.webinar_id !== webinarId));
    return { error };
  };

  return { registrations, loading, register, unregister };
}
