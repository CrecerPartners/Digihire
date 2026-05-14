import React, { useState, useEffect } from 'react';
import { supabase as _supabase, useAuth } from '@digihire/shared';
import { motion } from 'motion/react';
import { X, MapPin, Briefcase, GraduationCap, DollarSign, Calendar, User, Send, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

interface TalentProfile {
  id: string;
  full_name: string;
  bio?: string;
  skills?: string[];
  role_interest?: string[];
  city?: string;
  country?: string;
  years_of_experience?: number;
  salary_min?: number;
  salary_max?: number;
  availability_status?: string;
  work_preference?: string;
  education?: { degree?: string; institution?: string; summary?: string }[];
  work_history?: { summary?: string }[];
  languages?: string[];
  cv_url?: string;
  status: string;
}

interface TalentScore {
  id: string;
  overall_score: number;
  experience_score: number;
  skills_score: number;
  completeness_score: number;
  education_score: number;
  availability_score: number;
  summary: string;
  strengths: string[];
  suggested_roles: string[];
  ai_tags: string[];
  scored_at: string;
}

interface InternalNote {
  id: string;
  talent_id: string;
  admin_id: string;
  note: string;
  created_at: string;
}

interface Props {
  talent: TalentProfile;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

const scoreTextColor = (s: number) =>
  s >= 75 ? 'text-emerald-600' : s >= 50 ? 'text-amber-500' : 'text-red-500';
const scoreBarColor = (s: number) =>
  s >= 75 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-400' : 'bg-red-400';

export default function TalentDetailsModal({ talent, onClose, onStatusChange }: Props) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [status, setStatus] = useState(talent.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [score, setScore] = useState<TalentScore | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState('');

  useEffect(() => {
    supabase
      .from('talent_admin_notes')
      .select('*')
      .eq('talent_id', talent.id)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: InternalNote[] | null }) => {
        if (data) setNotes(data);
      });

    supabase
      .from('talent_profile_scores')
      .select('*')
      .eq('talent_id', talent.id)
      .maybeSingle()
      .then(({ data }: { data: TalentScore | null }) => {
        if (data) setScore(data);
      });
  }, [talent.id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('talent_profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', talent.id);
      if (error) throw error;
      setStatus(newStatus);
      onStatusChange?.(talent.id, newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from('talent_admin_notes')
        .insert({ talent_id: talent.id, admin_id: user.id, note: newNote.trim() })
        .select()
        .single();
      if (error) throw error;
      if (data) setNotes(prev => [data, ...prev]);
      setNewNote('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunScore = async () => {
    setScoring(true);
    setScoreError('');
    try {
      const { data, error } = await supabase.functions.invoke('score-talent-profile', {
        body: { talent_id: talent.id },
      });
      if (error) throw error;
      if (data?.score) setScore(data.score);
    } catch (err: unknown) {
      setScoreError(err instanceof Error ? err.message : 'Scoring failed. Try again.');
    } finally {
      setScoring(false);
    }
  };

  const salaryDisplay = talent.salary_min && talent.salary_max
    ? `$${talent.salary_min.toLocaleString()} – $${talent.salary_max.toLocaleString()}`
    : talent.salary_min ? `From $${talent.salary_min.toLocaleString()}` : 'Not specified';

  const tabs = [
    { id: 'profile', label: 'Profile Details' },
    { id: 'score', label: 'AI Score', icon: <Sparkles size={13} />, badge: score ? String(score.overall_score) : null },
    { id: 'notes', label: `Notes (${notes.length})` },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl border bg-card shadow-lg flex flex-col md:flex-row"
      >
        {/* ── Left panel ── */}
        <div className="w-full md:w-72 bg-muted/30 border-r border-border p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>

          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                {talent.full_name.charAt(0)}
              </div>
              {score && (
                <span className={`absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold shadow-sm ${scoreBarColor(score.overall_score)} text-white`}>
                  {score.overall_score}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-foreground">{talent.full_name}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                {status}
              </span>
            </div>
          </div>

          {/* Status controls */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Application Status</p>
            {['Under Review', 'Shortlisted', 'Matched', 'Archived'].map(s => (
              <button
                key={s}
                onClick={() => handleUpdateStatus(s)}
                disabled={isUpdating || status === s}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                  status === s
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Quick info */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Info</p>
            {talent.city && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin size={12} className="shrink-0 text-primary" />
                {[talent.city, talent.country].filter(Boolean).join(', ')}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Briefcase size={12} className="shrink-0 text-primary" />
              {talent.years_of_experience ?? 0} years experience
            </div>
            {talent.availability_status && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar size={12} className="shrink-0 text-primary" />
                {talent.availability_status}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="border-b border-border flex items-center justify-between px-6 bg-card sticky top-0 z-10 shrink-0">
            <div className="flex gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-4 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${scoreBarColor(score!.overall_score)} text-white`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ── Profile tab ── */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <section>
                  <SectionLabel icon={<User size={13} />} label="Experience Summary" />
                  <p className="text-sm text-foreground/80 leading-relaxed rounded-lg bg-muted/40 border border-border p-4">
                    {talent.bio || 'No bio provided.'}
                  </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section>
                    <SectionLabel label="Skills & Languages" />
                    <div className="flex flex-wrap gap-1.5">
                      {talent.skills?.map(skill => (
                        <span key={skill} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">{skill}</span>
                      ))}
                      {talent.languages?.map(lang => (
                        <span key={lang} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-semibold border border-border">{lang}</span>
                      ))}
                      {!talent.skills?.length && !talent.languages?.length && (
                        <span className="text-xs text-muted-foreground">None listed</span>
                      )}
                    </div>
                  </section>
                  <section>
                    <SectionLabel label="Role Interests" />
                    <div className="flex flex-wrap gap-1.5">
                      {talent.role_interest?.map(role => (
                        <span key={role} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-semibold border border-border">{role}</span>
                      ))}
                      {!talent.role_interest?.length && (
                        <span className="text-xs text-muted-foreground">None listed</span>
                      )}
                    </div>
                  </section>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoItem icon={<DollarSign size={15} />} label="Salary Expectation" value={salaryDisplay} />
                  <InfoItem icon={<Briefcase size={15} />} label="Work Preference" value={talent.work_preference || 'Any'} />
                  <InfoItem icon={<GraduationCap size={15} />} label="Education" value={talent.education?.[0]?.summary || talent.education?.[0]?.degree || 'No info'} />
                </div>

                {talent.cv_url && (
                  <div className="pt-4 border-t border-border">
                    <a
                      href={talent.cv_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      View / Download CV
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ── AI Score tab ── */}
            {activeTab === 'score' && (
              <div className="space-y-6">
                {!score ? (
                  <div className="text-center py-16">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Sparkles size={24} className="text-primary" />
                    </div>
                    <p className="font-bold text-foreground mb-1">No AI Score Yet</p>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                      Run an AI evaluation to get a scored profile summary, role suggestions, and key strengths.
                    </p>
                    {scoreError && (
                      <div className="flex items-center gap-2 justify-center text-sm text-destructive mb-4">
                        <AlertCircle size={15} /> {scoreError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleRunScore}
                      disabled={scoring}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {scoring ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                      {scoring ? 'Scoring...' : 'Run AI Score'}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Overall score card */}
                    <div className="flex items-center gap-5 p-5 rounded-xl border bg-muted/30">
                      <div className={`h-16 w-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold shrink-0 ${scoreTextColor(score.overall_score)} border-current`}>
                        {score.overall_score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Overall Score</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{score.summary}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          Scored {new Date(score.scored_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div>
                      <SectionLabel label="Score Breakdown" />
                      <div className="space-y-3">
                        {[
                          { label: 'Experience', value: score.experience_score },
                          { label: 'Skills', value: score.skills_score },
                          { label: 'Profile Completeness', value: score.completeness_score },
                          { label: 'Education', value: score.education_score },
                          { label: 'Availability', value: score.availability_score },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                              <div
                                className={`h-full rounded-full ${scoreBarColor(value)}`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold w-7 text-right ${scoreTextColor(value)}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strengths + roles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <SectionLabel label="Strengths" />
                        <div className="space-y-2">
                          {score.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                              <span className="mt-0.5 h-4 w-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <SectionLabel label="Suggested Roles" />
                        <div className="flex flex-wrap gap-1.5">
                          {score.suggested_roles.map((r, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20">{r}</span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {score.ai_tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] border border-border">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Re-score */}
                    <div className="pt-4 border-t border-border flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRunScore}
                        disabled={scoring}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-background text-muted-foreground text-xs font-semibold hover:text-foreground hover:bg-muted/60 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw size={13} className={scoring ? 'animate-spin' : ''} />
                        {scoring ? 'Re-scoring...' : 'Re-score'}
                      </button>
                      {scoreError && (
                        <span className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle size={13} /> {scoreError}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Notes tab ── */}
            {activeTab === 'notes' && (
              <div className="space-y-5">
                <form onSubmit={handleAddNote} className="relative">
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add an internal note about this talent..."
                    className="w-full rounded-lg bg-background border border-border p-4 pr-14 text-sm focus:border-primary focus:outline-none transition-colors h-28 resize-none"
                  />
                  <button
                    type="submit"
                    className="absolute bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Send size={16} />
                  </button>
                </form>

                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="p-4 rounded-lg border bg-card shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded bg-muted text-[10px] flex items-center justify-center font-bold text-muted-foreground">A</div>
                          <span className="text-xs font-semibold text-foreground">Admin</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{note.note}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm">No notes yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SectionLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
      {icon}{label}
    </p>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
      <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xs font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
