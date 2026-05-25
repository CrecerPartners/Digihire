import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { MessageSquare, Phone, Mail, Plus, X, Save, Search, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

interface BrandOption {
  id: string;
  company_name: string;
}

interface CommNote {
  id: string;
  brand_id: string;
  channel: 'whatsapp' | 'call' | 'email' | 'internal';
  note: string;
  followup_date?: string;
  followup_action?: string;
  created_at: string;
  created_by?: string;
  brand_profiles?: { company_name?: string };
}

const CHANNEL_CONFIG = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-50 text-green-700 border-green-200' },
  call:     { label: 'Call',     icon: Phone,         color: 'bg-blue-50 text-blue-700 border-blue-200' },
  email:    { label: 'Email',    icon: Mail,           color: 'bg-purple-50 text-purple-700 border-purple-200' },
  internal: { label: 'Internal', icon: MessageSquare,  color: 'bg-gray-50 text-gray-600 border-gray-200' },
} as const;

type Channel = keyof typeof CHANNEL_CONFIG;

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary";

export default function AdminCommunication() {
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [notes, setNotes] = useState<CommNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    brand_id: '',
    channel: 'whatsapp' as Channel,
    note: '',
    followup_date: '',
    followup_action: '',
  });

  useEffect(() => {
    Promise.all([
      supabase.from('brand_profiles').select('id, company_name').order('company_name'),
      supabase
        .from('brand_communication_notes')
        .select('*, brand_profiles(company_name)')
        .order('created_at', { ascending: false })
        .limit(200),
    ]).then(([{ data: bdata }, { data: ndata, error: nerr }]) => {
      setBrands(bdata ?? []);
      if (nerr) {
        // Table may not exist yet — show empty state
        setNotes([]);
      } else {
        setNotes(ndata ?? []);
      }
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    if (!form.brand_id || !form.note.trim()) {
      toast.error('Brand and note are required');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('brand_communication_notes')
      .insert([{
        brand_id: form.brand_id,
        channel: form.channel,
        note: form.note.trim(),
        followup_date: form.followup_date || null,
        followup_action: form.followup_action.trim() || null,
      }])
      .select('*, brand_profiles(company_name)')
      .single();
    if (!error && data) {
      setNotes(prev => [data, ...prev]);
      setForm({ brand_id: '', channel: 'whatsapp', note: '', followup_date: '', followup_action: '' });
      setAddOpen(false);
      toast.success('Communication note added');
    } else {
      toast.error(error?.message ?? 'Failed to save. Ensure brand_communication_notes table exists.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('brand_communication_notes').delete().eq('id', id);
    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success('Note deleted');
    } else {
      toast.error('Failed to delete');
    }
  };

  const filtered = notes.filter(n => {
    const brandName = n.brand_profiles?.company_name ?? '';
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || brandName.toLowerCase().includes(q) || n.note.toLowerCase().includes(q);
    const matchBrand = selectedBrand === 'all' || n.brand_id === selectedBrand;
    const matchChannel = channelFilter === 'all' || n.channel === channelFilter;
    return matchSearch && matchBrand && matchChannel;
  });

  const upcomingFollowups = notes.filter(n => {
    if (!n.followup_date) return false;
    const due = new Date(n.followup_date);
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return due >= now && due <= threeDays;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand Communication Log</h1>
          <p className="text-muted-foreground text-sm">Track notes from WhatsApp, calls, emails, and internal comments per brand.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 transition-all"
        >
          <Plus size={14} /> Add Note
        </button>
      </div>

      {/* Upcoming follow-ups alert */}
      {upcomingFollowups.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Bell size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{upcomingFollowups.length} follow-up{upcomingFollowups.length > 1 ? 's' : ''} due within 3 days</p>
            <ul className="mt-1 space-y-0.5">
              {upcomingFollowups.map(n => (
                <li key={n.id} className="text-xs text-amber-700">
                  <span className="font-medium">{n.brand_profiles?.company_name}</span>
                  {' — '}{n.followup_action || n.note.slice(0, 50)}
                  {' · '}{new Date(n.followup_date!).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Search brand or note..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className={inputCls} style={{ width: 'auto' }}>
          <option value="all">All Brands</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.company_name}</option>)}
        </select>
        <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} className={inputCls} style={{ width: 'auto' }}>
          <option value="all">All Channels</option>
          {(Object.keys(CHANNEL_CONFIG) as Channel[]).map(ch => (
            <option key={ch} value={ch}>{CHANNEL_CONFIG[ch].label}</option>
          ))}
        </select>
        <span className="text-xs font-semibold text-muted-foreground">{filtered.length} notes</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading communication log...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          No communication notes yet. Add the first one using the button above.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => {
            const ch = CHANNEL_CONFIG[n.channel] ?? CHANNEL_CONFIG.internal;
            const Icon = ch.icon;
            const isExpanded = expanded === n.id;
            return (
              <div key={n.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div
                  className="flex items-start justify-between p-4 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : n.id)}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className={`mt-0.5 flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase shrink-0 ${ch.color}`}>
                      <Icon size={10} /> {ch.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-primary truncate">
                        {n.brand_profiles?.company_name ?? n.brand_id}
                      </p>
                      <p className="text-sm text-foreground mt-0.5 line-clamp-2">{n.note}</p>
                      {n.followup_date && (
                        <p className="text-xs text-amber-600 mt-1">
                          Follow-up: {new Date(n.followup_date).toLocaleDateString()}
                          {n.followup_action && ` · ${n.followup_action}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                    {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-border p-4 bg-muted/20 flex items-center justify-between gap-4">
                    <p className="text-sm text-foreground/80 flex-1">{n.note}</p>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Note Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold">Add Communication Note</h3>
              <button onClick={() => setAddOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Brand *</label>
                <select value={form.brand_id} onChange={e => setForm(p => ({ ...p, brand_id: e.target.value }))} className={inputCls}>
                  <option value="">Select brand...</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.company_name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Channel *</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(CHANNEL_CONFIG) as Channel[]).map(ch => {
                    const cfg = CHANNEL_CONFIG[ch];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={ch}
                        onClick={() => setForm(p => ({ ...p, channel: ch }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${form.channel === ch ? cfg.color + ' ring-2 ring-offset-1 ring-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                      >
                        <Icon size={12} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Note / Summary *</label>
                <textarea
                  rows={4}
                  placeholder="Describe what was discussed, agreed, or noted..."
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Follow-up Date</label>
                  <input type="date" value={form.followup_date} onChange={e => setForm(p => ({ ...p, followup_date: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Follow-up Action</label>
                  <input
                    type="text"
                    placeholder="e.g. Send proposal, Call back"
                    value={form.followup_action}
                    onChange={e => setForm(p => ({ ...p, followup_action: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3 justify-end">
              <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-lg border text-sm text-muted-foreground hover:bg-muted transition-all">Cancel</button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {saving ? 'Saving...' : <><Save size={14} /> Save Note</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
