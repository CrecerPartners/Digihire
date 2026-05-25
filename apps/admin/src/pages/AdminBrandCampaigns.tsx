import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { Megaphone, ChevronDown, ChevronUp, Save, Plus, X, MessageSquare, Users, BarChart3, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

interface BrandCampaign {
  id: string;
  brand_id: string;
  campaign_name: string;
  brand_name?: string;
  campaign_goal?: string;
  product_name?: string;
  product_category?: string;
  target_audience?: string;
  city?: string;
  region?: string;
  start_date?: string;
  end_date?: string;
  payout_model?: string;
  notes?: string;
  status: string;
  total_sellers: number;
  total_conversions: number;
  total_leads: number;
  admin_notes?: string;
  assigned_sellers?: string;
  manual_results?: string;
  created_at: string;
  brand_profiles?: { company_name?: string };
}

interface BrandOption {
  id: string;
  company_name: string;
}

const STATUS_OPTIONS = [
  { value: 'pending',   label: 'Pending Review' },
  { value: 'active',    label: 'Active' },
  { value: 'paused',    label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  active:    'bg-green-50 text-green-700 border-green-100',
  paused:    'bg-orange-50 text-orange-700 border-orange-100',
  completed: 'bg-gray-50 text-gray-500 border-gray-100',
};

type EditRecord = {
  status: string;
  total_sellers: number;
  total_conversions: number;
  total_leads: number;
  admin_notes: string;
  assigned_sellers: string;
  manual_results: string;
};

type CampaignForm = {
  brand_id: string;
  campaign_name: string;
  campaign_goal: string;
  product_name: string;
  product_category: string;
  target_audience: string;
  city: string;
  region: string;
  start_date: string;
  end_date: string;
  payout_model: string;
  notes: string;
  status: string;
};

const EMPTY_FORM: CampaignForm = {
  brand_id: '', campaign_name: '', campaign_goal: '', product_name: '',
  product_category: '', target_audience: '', city: '', region: '',
  start_date: '', end_date: '', payout_model: '', notes: '', status: 'pending',
};

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary";

export default function AdminBrandCampaigns() {
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, EditRecord>>({});
  const [notesOpen, setNotesOpen] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<BrandCampaign | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase
        .from('brand_campaigns')
        .select('*, brand_profiles(company_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('brand_profiles')
        .select('id, company_name')
        .order('company_name'),
    ]).then(([{ data: cdata, error: cerr }, { data: bdata }]) => {
      if (cerr) { setFetchError(cerr.message); setLoading(false); return; }
      const rows: BrandCampaign[] = cdata ?? [];
      setCampaigns(rows);
      setBrands(bdata ?? []);
      const initialEdits: Record<string, EditRecord> = {};
      rows.forEach(c => {
        initialEdits[c.id] = {
          status: c.status,
          total_sellers: c.total_sellers,
          total_conversions: c.total_conversions,
          total_leads: c.total_leads,
          admin_notes: c.admin_notes ?? '',
          assigned_sellers: c.assigned_sellers ?? '',
          manual_results: c.manual_results ?? '',
        };
      });
      setEdits(initialEdits);
      setLoading(false);
    });
  }, []);

  const handleSave = async (id: string) => {
    setSaving(id);
    const edit = edits[id];
    const { error } = await supabase
      .from('brand_campaigns')
      .update({
        status: edit.status,
        total_sellers: Number(edit.total_sellers),
        total_conversions: Number(edit.total_conversions),
        total_leads: Number(edit.total_leads),
        admin_notes: edit.admin_notes || null,
        assigned_sellers: edit.assigned_sellers || null,
        manual_results: edit.manual_results || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (!error) {
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...edit } : c));
      toast.success('Campaign saved');
    } else {
      toast.error('Failed to save');
    }
    setSaving(null);
  };

  const openCreate = () => {
    setEditingCampaign(null);
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  };

  const openEdit = (c: BrandCampaign) => {
    setEditingCampaign(c);
    setForm({
      brand_id: c.brand_id,
      campaign_name: c.campaign_name,
      campaign_goal: c.campaign_goal ?? '',
      product_name: c.product_name ?? '',
      product_category: c.product_category ?? '',
      target_audience: c.target_audience ?? '',
      city: c.city ?? '',
      region: c.region ?? '',
      start_date: c.start_date ?? '',
      end_date: c.end_date ?? '',
      payout_model: c.payout_model ?? '',
      notes: c.notes ?? '',
      status: c.status,
    });
    setCreateOpen(true);
  };

  const handleFormSave = async () => {
    if (!form.campaign_name.trim() || !form.brand_id) {
      toast.error('Brand and campaign name are required');
      return;
    }
    setFormSaving(true);
    if (editingCampaign) {
      const { error } = await supabase
        .from('brand_campaigns')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', editingCampaign.id);
      if (!error) {
        setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? { ...c, ...form } : c));
        setCreateOpen(false);
        toast.success('Campaign updated');
      } else {
        toast.error(error.message);
      }
    } else {
      const { data, error } = await supabase
        .from('brand_campaigns')
        .insert([{ ...form, total_sellers: 0, total_conversions: 0, total_leads: 0 }])
        .select('*, brand_profiles(company_name)')
        .single();
      if (!error && data) {
        setCampaigns(prev => [data, ...prev]);
        setEdits(p => ({
          ...p,
          [data.id]: { status: data.status, total_sellers: 0, total_conversions: 0, total_leads: 0, admin_notes: '', assigned_sellers: '', manual_results: '' },
        }));
        setCreateOpen(false);
        toast.success('Campaign created');
      } else {
        toast.error(error?.message ?? 'Failed');
      }
    }
    setFormSaving(false);
  };

  const setEdit = (id: string, field: keyof EditRecord, value: string | number) =>
    setEdits(p => ({ ...p, [id]: { ...p[id], [field]: value } }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand Campaigns</h1>
          <p className="text-muted-foreground text-sm">Review and manage campaigns launched by brands via VoltSquad.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-primary">
            <Megaphone className="h-4 w-4" /> {campaigns.length} Campaigns
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 transition-all"
          >
            <Plus size={14} /> New Campaign
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : fetchError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 text-sm">{fetchError}</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No brand campaigns yet.</div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const edit = edits[c.id] ?? { status: c.status, total_sellers: c.total_sellers, total_conversions: c.total_conversions, total_leads: c.total_leads, admin_notes: '', assigned_sellers: '', manual_results: '' };
            const isExpanded = expanded === c.id;
            return (
              <div key={c.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5">
                  <div
                    className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">{c.campaign_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.brand_profiles?.company_name ?? c.brand_id}
                        {c.product_name && ` · ${c.product_name}`}
                        {c.city && ` · ${c.city}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span><span className="font-bold text-foreground">{edit.total_sellers}</span> sellers</span>
                      <span><span className="font-bold text-green-600">{edit.total_conversions}</span> conv</span>
                      <span><span className="font-bold text-blue-600">{edit.total_leads}</span> leads</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase ${STATUS_COLOR[c.status] ?? STATUS_COLOR.pending}`}>
                      {c.status}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(c); }}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-all"
                      title="Edit campaign details"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setExpanded(isExpanded ? null : c.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-5 bg-muted/20">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <Detail label="Campaign Goal" value={c.campaign_goal} />
                      <Detail label="Product Category" value={c.product_category} />
                      <Detail label="Target Audience" value={c.target_audience} />
                      <Detail label="Region" value={c.region} />
                      <Detail label="Payout Model" value={c.payout_model} />
                      <Detail label="Start Date" value={c.start_date ? new Date(c.start_date).toLocaleDateString() : undefined} />
                      <Detail label="End Date" value={c.end_date ? new Date(c.end_date).toLocaleDateString() : undefined} />
                      <Detail label="Submitted" value={new Date(c.created_at).toLocaleDateString()} />
                    </div>
                    {c.notes && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Brand Notes</p>
                        <p className="text-sm text-foreground/80">{c.notes}</p>
                      </div>
                    )}

                    {/* Admin Controls */}
                    <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Status */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                        <select value={edit.status} onChange={e => setEdit(c.id, 'status', e.target.value)} className={inputCls}>
                          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>

                      {/* Assigned Sellers */}
                      <div className="space-y-1">
                        <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <Users size={11} /> Assigned Sellers
                        </label>
                        <input
                          value={edit.assigned_sellers}
                          onChange={e => setEdit(c.id, 'assigned_sellers', e.target.value)}
                          placeholder="Seller names or IDs (comma separated)..."
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Manual Results */}
                    <div>
                      <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        <BarChart3 size={11} /> Manual Performance Results
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Total Sellers</label>
                          <input type="number" min={0} value={edit.total_sellers} onChange={e => setEdit(c.id, 'total_sellers', Number(e.target.value))} className={inputCls} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Conversions</label>
                          <input type="number" min={0} value={edit.total_conversions} onChange={e => setEdit(c.id, 'total_conversions', Number(e.target.value))} className={inputCls} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Leads</label>
                          <input type="number" min={0} value={edit.total_leads} onChange={e => setEdit(c.id, 'total_leads', Number(e.target.value))} className={inputCls} />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="text-[10px] text-muted-foreground block mb-1">Additional Results / Report Summary</label>
                        <textarea
                          rows={2}
                          placeholder="Paste manual report summary, additional metrics..."
                          value={edit.manual_results}
                          onChange={e => setEdit(c.id, 'manual_results', e.target.value)}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <button
                        onClick={() => setNotesOpen(notesOpen === c.id ? null : c.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
                      >
                        <MessageSquare size={13} />
                        Internal Admin Notes {notesOpen === c.id ? '▲' : '▼'}
                      </button>
                      {notesOpen === c.id && (
                        <textarea
                          rows={3}
                          placeholder="WhatsApp, call, email notes, follow-ups, internal context..."
                          value={edit.admin_notes}
                          onChange={e => setEdit(c.id, 'admin_notes', e.target.value)}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      )}
                      {edit.admin_notes && notesOpen !== c.id && (
                        <p className="text-xs text-muted-foreground italic line-clamp-1">Note: {edit.admin_notes}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => handleSave(c.id)} disabled={saving === c.id} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                        {saving === c.id ? 'Saving...' : <><Save className="h-4 w-4" /> Save</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Campaign Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h3>
              <button onClick={() => setCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Brand *</label>
                <select value={form.brand_id} onChange={e => setForm(p => ({ ...p, brand_id: e.target.value }))} className={inputCls}>
                  <option value="">Select brand...</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.company_name}</option>)}
                </select>
              </div>
              {([
                { f: 'campaign_name', l: 'Campaign Name *' },
                { f: 'campaign_goal', l: 'Campaign Goal' },
                { f: 'product_name', l: 'Product Name' },
                { f: 'product_category', l: 'Product Category' },
                { f: 'target_audience', l: 'Target Audience' },
                { f: 'city', l: 'City' },
                { f: 'region', l: 'Region' },
                { f: 'payout_model', l: 'Payout Model' },
                { f: 'start_date', l: 'Start Date', type: 'date' },
                { f: 'end_date', l: 'End Date', type: 'date' },
              ] as { f: keyof CampaignForm; l: string; type?: string }[]).map(({ f, l, type }) => (
                <div key={f} className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{l}</label>
                  <input
                    type={type ?? 'text'}
                    value={form[f] as string}
                    onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3 justify-end">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border text-sm text-muted-foreground hover:bg-muted transition-all">Cancel</button>
              <button
                onClick={handleFormSave}
                disabled={formSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {formSaving ? 'Saving...' : editingCampaign ? <><Save size={14} /> Update</> : <><Plus size={14} /> Create</>}
              </button>
            </div>
          </div>
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
