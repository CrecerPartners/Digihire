import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { AnimatePresence, motion } from 'motion/react';
import { Users, Search, Filter, MapPin, ChevronRight, ShieldCheck, Star, Archive, Tag } from 'lucide-react';
import TalentDetailsModal from '@/components/TalentDetailsModal';
import { toast } from 'sonner';

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
  status: string;
  updated_at: string;
  industry_experience?: string[];
  talent_profile_scores?: { overall_score: number }[];
  is_verified?: boolean;
  category_tags?: string[];
  cv_url?: string;
  linkedin_url?: string;
}

function calcCompletion(t: TalentProfile): number {
  const checks = [
    !!t.full_name,
    !!t.bio,
    (t.skills?.length ?? 0) > 0,
    (t.role_interest?.length ?? 0) > 0,
    !!t.city,
    !!t.years_of_experience,
    !!t.availability_status,
    !!t.work_preference,
    (t.education?.length ?? 0) > 0,
    !!t.cv_url || !!t.linkedin_url,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

const statusColors: Record<string, string> = {
  'Under Review': 'bg-orange-50 text-orange-700 border-orange-100',
  'Shortlisted': 'bg-blue-50 text-blue-700 border-blue-100',
  'Matched': 'bg-green-50 text-green-700 border-green-100',
  'complete': 'bg-primary/10 text-primary border-primary/20',
  'incomplete': 'bg-muted text-muted-foreground border-border',
  'Archived': 'bg-muted text-muted-foreground border-border',
};

const scoreColor = (s: number) =>
  s >= 75 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-400' : 'bg-red-400';

export default function AdminTalentPool() {
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTalent, setSelectedTalent] = useState<TalentProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [expFilter, setExpFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');

  useEffect(() => {
    supabase
      .from('talent_profiles')
      .select('*, talent_profile_scores(overall_score)')
      .order('updated_at', { ascending: false })
      .then(({ data }: { data: TalentProfile[] | null }) => {
        setTalents(data ?? []);
        setLoading(false);
      });
  }, []);

  const handleStatusChange = (id: string, newStatus: string) => {
    setTalents(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const quickUpdateStatus = async (id: string, newStatus: string, label: string) => {
    setActionLoading(id + newStatus);
    const { error } = await (supabase as any)
      .from('talent_profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setTalents(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      toast.success(`Talent ${label}`);
    } else {
      toast.error('Failed to update');
    }
    setActionLoading(null);
  };

  const toggleVerify = async (talent: TalentProfile) => {
    const newVal = !talent.is_verified;
    setActionLoading(talent.id + 'verify');
    const { error } = await (supabase as any)
      .from('talent_profiles')
      .update({ is_verified: newVal, updated_at: new Date().toISOString() })
      .eq('id', talent.id);
    if (!error) {
      setTalents(prev => prev.map(t => t.id === talent.id ? { ...t, is_verified: newVal } : t));
      toast.success(newVal ? 'Talent verified' : 'Verification removed');
    } else {
      toast.error('Failed to update');
    }
    setActionLoading(null);
  };

  const filtered = talents.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      t.full_name.toLowerCase().includes(q) ||
      t.skills?.some(s => s.toLowerCase().includes(q)) ||
      t.role_interest?.some(r => r.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesRole = roleFilter === 'all' || t.role_interest?.includes(roleFilter);
    const matchesCity = cityFilter === 'all' || t.city === cityFilter;
    const matchesExp = expFilter === 'all' || (
      expFilter === '0-2' ? (t.years_of_experience ?? 0) <= 2 :
      expFilter === '3-5' ? (t.years_of_experience ?? 0) >= 3 && (t.years_of_experience ?? 0) <= 5 :
      expFilter === '5+' ? (t.years_of_experience ?? 0) > 5 : true
    );
    const matchesAvailability = availabilityFilter === 'all' || t.availability_status === availabilityFilter;
    const matchesIndustry = industryFilter === 'all' || t.industry_experience?.includes(industryFilter);
    const matchesWorkType = workTypeFilter === 'all' || t.work_preference === workTypeFilter;
    return matchesSearch && matchesStatus && matchesRole && matchesCity && matchesExp && matchesAvailability && matchesIndustry && matchesWorkType;
  });

  const uniqueCities = Array.from(new Set(talents.map(t => t.city).filter(Boolean)));
  const uniqueIndustries = Array.from(new Set(talents.flatMap(t => t.industry_experience || []).filter(Boolean)));

  const selectCls = "rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Talent Pool</h2>
          <p className="text-muted-foreground text-sm">Curate and match elite sales talent to brand opportunities.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Users className="h-4 w-4" /> {talents.length} Profiles
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Search name, skills, roles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`${selectCls} pl-9 w-full`}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
          <option value="all">All Statuses</option>
          <option value="Under Review">Under Review</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Matched">Matched</option>
          <option value="complete">Complete</option>
          <option value="incomplete">Incomplete</option>
          <option value="Archived">Archived</option>
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectCls}>
          <option value="all">All Roles</option>
          {['B2B Sales', 'Tech Sales', 'SaaS Sales', 'SDR', 'BDR', 'AE'].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className={selectCls}>
          <option value="all">All Cities</option>
          {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={expFilter} onChange={e => setExpFilter(e.target.value)} className={selectCls}>
          <option value="all">Experience</option>
          <option value="0-2">0–2 years</option>
          <option value="3-5">3–5 years</option>
          <option value="5+">5+ years</option>
        </select>
        <select value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)} className={selectCls}>
          <option value="all">Availability</option>
          <option value="available">Available</option>
          <option value="looking">Looking</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className={selectCls}>
          <option value="all">All Industries</option>
          {uniqueIndustries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={workTypeFilter} onChange={e => setWorkTypeFilter(e.target.value)} className={selectCls}>
          <option value="all">Work Type</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">Onsite</option>
        </select>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Filter size={13} /> {filtered.length} results
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading Talent Pool...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No talent profiles match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(talent => {
            const score = talent.talent_profile_scores?.[0]?.overall_score;
            const completion = calcCompletion(talent);
            return (
              <motion.div
                key={talent.id}
                whileHover={{ y: -2 }}
                className="group rounded-xl border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-5 cursor-pointer" onClick={() => setSelectedTalent(talent)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                          {talent.full_name.charAt(0)}
                        </div>
                        {score != null && (
                          <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ${scoreColor(score)} text-white text-[9px] font-bold flex items-center justify-center border-2 border-background`}>
                            {score}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{talent.full_name}</p>
                          {talent.is_verified && (
                            <span title="Verified"><ShieldCheck size={13} className="text-emerald-500 shrink-0" /></span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{talent.role_interest?.slice(0, 1).join(' • ') || 'Sales'} · {talent.years_of_experience ?? 0} yrs</p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${statusColors[talent.status] ?? statusColors['incomplete']}`}>
                      {talent.status}
                    </span>
                  </div>

                  {/* Profile completion bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Profile {completion}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${completion >= 80 ? 'bg-emerald-500' : completion >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>

                  {talent.skills && talent.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {talent.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium border border-border">{skill}</span>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-border flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <MapPin size={11} /> {talent.city || 'Remote'}
                    </div>
                    <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>

                {/* Quick actions row */}
                <div className="border-t border-border px-4 py-2.5 flex items-center gap-1.5 bg-muted/30" onClick={e => e.stopPropagation()}>
                  <button
                    title={talent.is_verified ? 'Remove verification' : 'Verify talent'}
                    onClick={() => toggleVerify(talent)}
                    disabled={actionLoading === talent.id + 'verify'}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border transition-all ${talent.is_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-muted-foreground border-border hover:bg-muted'}`}
                  >
                    <ShieldCheck size={10} /> {talent.is_verified ? 'Verified' : 'Verify'}
                  </button>
                  <button
                    title="Shortlist"
                    onClick={() => quickUpdateStatus(talent.id, 'Shortlisted', 'shortlisted')}
                    disabled={talent.status === 'Shortlisted' || actionLoading === talent.id + 'Shortlisted'}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border border-border text-muted-foreground hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all disabled:opacity-40"
                  >
                    <Star size={10} /> Shortlist
                  </button>
                  <button
                    title="Archive"
                    onClick={() => quickUpdateStatus(talent.id, 'Archived', 'archived')}
                    disabled={talent.status === 'Archived' || actionLoading === talent.id + 'Archived'}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border border-border text-muted-foreground hover:bg-muted transition-all disabled:opacity-40"
                  >
                    <Archive size={10} /> Archive
                  </button>
                  {talent.category_tags && talent.category_tags.length > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <Tag size={10} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{talent.category_tags[0]}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedTalent && (
          <TalentDetailsModal
            talent={selectedTalent}
            onClose={() => setSelectedTalent(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
