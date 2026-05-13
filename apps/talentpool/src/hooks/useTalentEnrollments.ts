import { useState, useEffect } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import type { TalentEnrollment } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

export function useTalentEnrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<TalentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    supabase
      .from('talent_enrollments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: TalentEnrollment[] | null; error: { message: string } | null }) => {
        if (mounted) {
          setEnrollments(err ? [] : (data ?? []));
          setError(err?.message ?? null);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [user?.id]);

  const enroll = async (courseId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { data, error: err } = await supabase
      .from('talent_enrollments')
      .insert({ user_id: user.id, course_id: courseId, progress: 0, completed_modules: [] })
      .select()
      .single();
    if (!err && data) setEnrollments(prev => [...prev, data]);
    return { error: err };
  };

  const updateProgress = async (courseId: string, completedModules: number[], progress: number) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error: err } = await supabase
      .from('talent_enrollments')
      .update({ completed_modules: completedModules, progress })
      .match({ user_id: user.id, course_id: courseId });
    if (!err) {
      setEnrollments(prev => prev.map(e => e.course_id === courseId ? { ...e, completed_modules: completedModules, progress } : e));
    }
    return { error: err };
  };

  return { enrollments, loading, error, enroll, updateProgress };
}
