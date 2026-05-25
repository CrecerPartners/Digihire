import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { Building2, Search, Globe, Phone, Mail, Edit2, X, Save, Plus, PowerOff, Power } from 'lucide-react';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

interface BrandProfile {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  phone?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  city?: string;
  country?: string;
  description?: string;
  status?: string;
  updated_at: string;
}

type EditState = Partial<Omit<BrandProfile, 'id' | 'updated_at'>>;

const EMPTY_FORM: EditState = {
  company_name: '',
  contact_name: '',
  contact_email: '',
  phone: '',
  website: '',
  industry: '',
  company_size: '',
  city: '',
  country: '',
  description: '',
  status: 'active',
};

const inputCls = "rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary w-full";

function FieldInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-0.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

export default function AdminBrands() {
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditState>({});
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<EditState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase
      .from('brand_profiles')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }: { data: BrandProfile[] | null }) => {
        setBrands(data ?? []);
        setLoading(false);
      });
  }, []);

  const industries = Array.from(new Set(brands.map(b => b.industry).filter(Boolean))) as string[];

  const filtered = brands.filter(b => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      b.company_name.toLowerCase().includes(q) ||
      (b.contact_name ?? '').toLowerCase().includes(q) ||
      (b.industry ?? '').toLowerCase().includes(q);
    const matchesIndustry = industryFilter === 'all' || b.industry === industryFilter;
    const matchesStatus = statusFilter === 'all' || (b.status ?? 'active') === statusFilter;
    return matchesSearch && matchesIndustry && matchesStatus;
  });

  const startEdit = (brand: BrandProfile) => {
    setEditingId(brand.id);
    setEditForm({
      company_name: brand.company_name,
      contact_name: brand.contact_name,
      contact_email: brand.contact_email,
      phone: brand.phone ?? brand.contact_phone,
      website: brand.website,
      industry: brand.industry,
      company_size: brand.company_size,
      city: brand.city,
      country: brand.country,
      description: brand.description,
    });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('brand_profiles')
      .update({ ...editForm, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setBrands(prev => prev.map(b => b.id === id ? { ...b, ...editForm, updated_at: new Date().toISOString() } : b));
      setEditingId(null);
      toast.success('Brand updated');
    } else {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const handleToggleStatus = async (brand: BrandProfile) => {
    const newStatus = (brand.status ?? 'active') === 'active' ? 'inactive' : 'active';
    setToggling(brand.id);
    const { error } = await supabase
      .from('brand_profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', brand.id);
    if (!error) {
      setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, status: newStatus } : b));
      toast.success(`Brand ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } else {
      toast.error('Failed to update status');
    }
    setToggling(null);
  };

  const handleCreate = async () => {
    if (!createForm.company_name?.trim()) {
      toast.error('Company name is required');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from('brand_profiles')
      .insert([{ ...createForm, status: 'active', updated_at: new Date().toISOString() }])
      .select()
      .single();
    if (!error && data) {
      setBrands(prev => [data, ...prev]);
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      toast.success('Brand created');
    } else {
      toast.error(error?.message ?? 'Failed to create brand');
    }
    setCreating(false);
  };

  const fieldSet = [
    { field: 'company_name' as keyof EditState, label: 'Company Name' },
    { field: 'contact_name' as keyof EditState, label: 'Contact Name' },
    { field: 'contact_email' as keyof EditState, label: 'Contact Email' },
    { field: 'phone' as keyof EditState, label: 'Phone' },
    { field: 'website' as keyof EditState, label: 'Website' },
    { field: 'industry' as keyof EditState, label: 'Industry' },
    { field: 'company_size' as keyof EditState, label: 'Company Size' },
    { field: 'city' as keyof EditState, label: 'City' },
    { field: 'country' as keyof EditState, label: 'Country' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Brand Profiles</h2>
          <p className="text-muted-foreground text-sm">View and manage all registered brand partners.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-primary">
            <Building2 className="h-4 w-4" /> {brands.length} Brands
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 transition-all"
          >
            <Plus size={14} /> Add Brand
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Search company, contact, industry..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select
          title="Filter by industry"
          value={industryFilter}
          onChange={e => setIndustryFilter(e.target.value)}
          className={inputCls}
          style={{ width: 'auto' }}
        >
          <option value="all">All Industries</option>
          {industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        <select
          title="Filter by status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={inputCls}
          style={{ width: 'auto' }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-xs font-semibold text-muted-foreground">{filtered.length} results</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading Brand Profiles...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No brand profiles match your search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(brand => {
            const isEditing = editingId === brand.id;
            const isActive = (brand.status ?? 'active') === 'active';
            return (
              <div key={brand.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Edit Brand</p>
                        <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                          <X size={14} />
                        </button>
                      </div>
                      {fieldSet.map(({ field, label }) => (
                        <FieldInput
                          key={field}
                          label={label}
                          value={(editForm[field] as string) ?? ''}
                          onChange={v => setEditForm(p => ({ ...p, [field]: v }))}
                        />
                      ))}
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                        <textarea
                          value={editForm.description ?? ''}
                          onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                          rows={3}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSave(brand.id)}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                          {saving ? 'Saving...' : <><Save size={13} /> Save</>}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0">
                          {brand.company_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground truncate">{brand.company_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {brand.industry && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{brand.industry}</span>
                            )}
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleStatus(brand)}
                            disabled={toggling === brand.id}
                            className={`p-1.5 rounded-lg border transition-all ${isActive ? 'text-red-500 border-red-200 hover:bg-red-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                            title={isActive ? 'Deactivate brand' : 'Activate brand'}
                          >
                            {isActive ? <PowerOff size={13} /> : <Power size={13} />}
                          </button>
                          <button
                            onClick={() => startEdit(brand)}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
                            title="Edit brand"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      </div>

                      {brand.description && (
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{brand.description}</p>
                      )}

                      <div className="space-y-2 text-xs text-muted-foreground">
                        {brand.contact_name && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground/60">Contact:</span>
                            <span className="font-medium text-foreground">{brand.contact_name}</span>
                          </div>
                        )}
                        {brand.contact_email && (
                          <div className="flex items-center gap-2">
                            <Mail size={11} className="shrink-0 text-muted-foreground/60" />
                            <span className="font-medium truncate">{brand.contact_email}</span>
                          </div>
                        )}
                        {(brand.contact_phone || brand.phone) && (
                          <div className="flex items-center gap-2">
                            <Phone size={11} className="shrink-0 text-muted-foreground/60" />
                            <span className="font-medium">{brand.contact_phone ?? brand.phone}</span>
                          </div>
                        )}
                        {brand.website && (
                          <div className="flex items-center gap-2">
                            <Globe size={11} className="shrink-0 text-muted-foreground/60" />
                            <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{brand.website}</a>
                          </div>
                        )}
                        {(brand.city || brand.country) && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground/60">Location:</span>
                            <span className="font-medium text-foreground">{[brand.city, brand.country].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        {brand.company_size && (
                          <span className="text-[10px] text-muted-foreground font-medium">{brand.company_size} employees</span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          Updated {new Date(brand.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Brand Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold">Add New Brand</h3>
              <button onClick={() => setCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {fieldSet.map(({ field, label }) => (
                <FieldInput
                  key={field}
                  label={label}
                  value={(createForm[field] as string) ?? ''}
                  onChange={v => setCreateForm(p => ({ ...p, [field]: v }))}
                />
              ))}
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea
                  value={createForm.description ?? ''}
                  onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3 justify-end">
              <button
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-lg border text-sm text-muted-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {creating ? 'Creating...' : <><Plus size={14} /> Create Brand</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
