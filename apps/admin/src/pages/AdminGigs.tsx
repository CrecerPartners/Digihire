import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { Briefcase, Search, Filter, MapPin, Tag, Save } from 'lucide-react';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

interface GigProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  role_type?: string;
  availability?: string;
  deployment_readiness?: string;
  work_preference?: string;
  skills?: string[];
  bio?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

const READINESS_OPTIONS = [
  { value: 'ready',        label: 'Ready to Deploy', color: 'bg-green-50 text-green-700 border-green-100' },
  { value: 'available',    label: 'Available',        color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'unavailable',  label: 'Unavailable',      color: 'bg-gray-50 text-gray-500 border-gray-200' },
  { value: 'on_assignment', label: 'On Assignment',   color: 'bg-orange-50 text-orange-700 border-orange-100' },
];

const ROLE_TYPES = ['Merchandiser', 'Field Agent', 'Event Staff', 'Brand Ambassador', 'Promoter', 'Demonstrator'];
const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary";

export default function AdminGigs() {
  const [profiles, setProfiles] = useState<GigProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState('all');
  const [saving, setSaving] = useState<string | null>(null);
  const [readinessEdits, setReadinessEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    // Try gig_profiles table, fall back to talent_profiles with gig/field roles
    supabase
      .from('gig_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: GigProfile[] | null; error: { message: string } | null }) => {
        if (err) {
          // Fall back to talent_profiles filtered by gig-type roles
          supabase
            .from('talent_profiles')
            .select('*')
            .or("role_interest.cs.{Merchandiser},role_interest.cs.{Field Agent},role_interest.cs.{Event Staff},work_preference.eq.gig")
            .order('created_at', { ascending: false })
            .then(({ data: d2, error: e2 }: { data: GigProfile[] | null; error: { message: string } | null }) => {
              if (e2) {
                setFetchError(`No gig_profiles table found. Create it or tag talent_profiles with gig role types. Error: ${e2.message}`);
              } else {
                initProfiles(d2 ?? []);
              }
              setLoading(false);
            });
          return;
        }
        initProfiles(data ?? []);
        setLoading(false);
      });
  }, []);

  const initProfiles = (rows: GigProfile[]) => {
    setProfiles(rows);
    const edits: Record<string, string> = {};
    rows.forEach(r => { edits[r.id] = r.deployment_readiness ?? 'available'; });
    setReadinessEdits(edits);
  };

  const handleSaveReadiness = async (id: string) => {
    setSaving(id);
    const newVal = readinessEdits[id];
    const { error } = await supabase
      .from('gig_profiles')
      .update({ deployment_readiness: newVal, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, deployment_readiness: newVal } : p));
      toast.success('Readiness updated');
    } else {
      toast.error('Failed to update');
    }
    setSaving(null);
  };

  const uniqueCities = Array.from(new Set(profiles.map(p => p.city).filter(Boolean))) as string[];

  const filtered = profiles.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || p.full_name.toLowerCase().includes(q) || (p.city ?? '').toLowerCase().includes(q);
    const matchCity = cityFilter === 'all' || p.city === cityFilter;
    const matchRole = roleFilter === 'all' || p.role_type === roleFilter;
    const matchAvail = availFilter === 'all' || (p.deployment_readiness ?? 'available') === availFilter;
    return matchSearch && matchCity && matchRole && matchAvail;
  });

  const getReadinessColor = (val: string) =>
    READINESS_OPTIONS.find(r => r.value === val)?.color ?? 'bg-muted text-muted-foreground border-border';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Short-Term Gigs / Activation Talent</h1>
          <p className="text-muted-foreground text-sm">Manage field, merchandising, and event talent available for short-term deployments.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Briefcase className="h-4 w-4" /> {profiles.length} Profiles
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {READINESS_OPTIONS.map(r => (
          <div key={r.value} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{r.label}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">
              {profiles.filter(p => (p.deployment_readiness ?? 'available') === r.value).length}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Search name or city..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className={inputCls} style={{ width: 'auto' }}>
          <option value="all">All Cities</option>
          {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={inputCls} style={{ width: 'auto' }}>
          <option value="all">All Role Types</option>
          {ROLE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={availFilter} onChange={e => setAvailFilter(e.target.value)} className={inputCls} style={{ width: 'auto' }}>
          <option value="all">All Readiness</option>
          {READINESS_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Filter size={13} /> {filtered.length} results
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading gig profiles...</div>
      ) : fetchError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-700 text-sm space-y-2">
          <p className="font-semibold">DB table not yet created</p>
          <p className="text-xs">{fetchError}</p>
          <p className="text-xs mt-2">
            Create a <code>gig_profiles</code> table with: id, full_name, email, phone, city, state, role_type, availability, deployment_readiness, skills, bio, status, created_at
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No gig profiles match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const readiness = readinessEdits[p.id] ?? p.deployment_readiness ?? 'available';
            return (
              <div key={p.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        {p.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{p.full_name}</p>
                        {p.role_type && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {p.role_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${getReadinessColor(readiness)}`}>
                      {READINESS_OPTIONS.find(r => r.value === readiness)?.label ?? readiness}
                    </span>
                  </div>

                  {p.skills && p.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {p.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium border border-border">{skill}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <MapPin size={11} /> {[p.city, p.state].filter(Boolean).join(', ') || 'No location'}
                  </div>

                  {/* Readiness control */}
                  <div className="border-t border-border pt-3 flex items-center gap-2">
                    <Tag size={12} className="text-muted-foreground shrink-0" />
                    <select
                      value={readiness}
                      onChange={e => setReadinessEdits(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="flex-1 rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                    >
                      {READINESS_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button
                      onClick={() => handleSaveReadiness(p.id)}
                      disabled={saving === p.id || readiness === (p.deployment_readiness ?? 'available')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      <Save size={11} /> Tag
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
