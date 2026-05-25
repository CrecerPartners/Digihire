import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { Zap, Search, ChevronDown, ChevronUp, Save, Filter } from 'lucide-react';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

interface VoltSquadSeller {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  tier: string;
  created_at: string;
  campaigns_joined: number;
  approved_campaigns: number;
}

const TIER_OPTIONS = [
  { value: 'Bronze', label: 'Bronze' },
  { value: 'Silver', label: 'Silver' },
  { value: 'Gold',   label: 'Gold' },
  { value: 'Platinum', label: 'Platinum' },
];

const TIER_COLOR: Record<string, string> = {
  Bronze:   'bg-amber-50 text-amber-700 border-amber-200',
  Silver:   'bg-gray-50 text-gray-500 border-gray-200',
  Gold:     'bg-yellow-50 text-yellow-600 border-yellow-200',
  Platinum: 'bg-blue-50 text-blue-600 border-blue-100',
};

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary";

export default function AdminVoltSquad() {
  const [sellers, setSellers] = useState<VoltSquadSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { tier: string }>>({});

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id, user_id, name, email, tier, created_at').order('created_at', { ascending: false }),
      supabase.from('campaign_memberships').select('seller_id, status'),
    ]).then(([profilesRes, membershipsRes]) => {
      if (profilesRes.error) {
        setFetchError(profilesRes.error.message);
        setLoading(false);
        return;
      }
      const memberships: { seller_id: string; status: string }[] = membershipsRes.data ?? [];
      const rows: VoltSquadSeller[] = (profilesRes.data ?? []).map((p: { id: string; user_id?: string; name: string; email: string; tier: string; created_at: string }) => {
        const mine = memberships.filter(m => m.seller_id === p.id);
        return {
          ...p,
          campaigns_joined: mine.length,
          approved_campaigns: mine.filter(m => m.status === 'approved').length,
        };
      });
      initSellers(rows);
      setLoading(false);
    });
  }, []);

  const initSellers = (rows: VoltSquadSeller[]) => {
    setSellers(rows);
    const initialEdits: Record<string, { tier: string }> = {};
    rows.forEach(s => { initialEdits[s.id] = { tier: s.tier ?? 'Bronze' }; });
    setEdits(initialEdits);
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    const edit = edits[id];
    const { error } = await supabase
      .from('profiles')
      .update({ tier: edit.tier })
      .eq('id', id);
    if (!error) {
      setSellers(prev => prev.map(s => s.id === id ? { ...s, tier: edit.tier } : s));
      toast.success('Seller tier updated');
    } else {
      toast.error('Failed to update');
    }
    setSaving(null);
  };

  const filtered = sellers.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchTier = tierFilter === 'all' || s.tier === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">VoltSquad Sellers</h1>
          <p className="text-muted-foreground text-sm">Manage all talent who have joined VoltSquad and their campaign activity.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Zap className="h-4 w-4" /> {sellers.length} Sellers
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sellers', value: sellers.length, color: 'text-primary' },
          { label: 'Gold+', value: sellers.filter(s => s.tier === 'Gold' || s.tier === 'Platinum').length, color: 'text-yellow-600' },
          { label: 'Active Campaigns', value: sellers.reduce((acc, s) => acc + s.approved_campaigns, 0), color: 'text-emerald-600' },
          { label: 'Total Memberships', value: sellers.reduce((acc, s) => acc + s.campaigns_joined, 0), color: 'text-blue-500' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Search seller name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className={inputCls} style={{ width: 'auto' }}>
          <option value="all">All Tiers</option>
          {TIER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Filter size={13} /> {filtered.length} results
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading VoltSquad sellers...</div>
      ) : fetchError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 text-sm space-y-2">
          <p className="font-semibold">Failed to load sellers</p>
          <p className="text-xs">{fetchError}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No sellers match your search.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const edit = edits[s.id] ?? { tier: s.tier ?? 'Bronze' };
            const isExpanded = expanded === s.id;
            return (
              <div key={s.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : s.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      <span className="font-bold text-foreground">{s.campaigns_joined}</span> memberships
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase ${TIER_COLOR[s.tier] ?? TIER_COLOR.Bronze}`}>
                      {s.tier}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-5 bg-muted/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <Detail label="Campaigns Joined" value={s.campaigns_joined.toString()} />
                      <Detail label="Approved Campaigns" value={s.approved_campaigns.toString()} />
                      <Detail label="Joined" value={new Date(s.created_at).toLocaleDateString()} />
                      <Detail label="Tier" value={s.tier} />
                    </div>

                    <div className="border-t border-border pt-4 flex items-end gap-4">
                      <div className="space-y-1 max-w-xs flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tier</label>
                        <select value={edit.tier} onChange={e => setEdits(p => ({ ...p, [s.id]: { tier: e.target.value } }))} className={inputCls}>
                          {TIER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <button onClick={() => handleSave(s.id)} disabled={saving === s.id} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                        {saving === s.id ? 'Saving...' : <><Save className="h-4 w-4" /> Save</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || '—'}</p>
    </div>
  );
}
