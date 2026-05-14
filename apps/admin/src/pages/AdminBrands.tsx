import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@digihire/shared';
import { Building2, Search, Globe, Phone, Mail } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

interface BrandProfile {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  industry?: string;
  website?: string;
  company_size?: string;
  description?: string;
  status?: string;
  updated_at: string;
}

export default function AdminBrands() {
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');

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
    return matchesSearch && matchesIndustry;
  });

  const inputCls = "rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Brand Profiles</h2>
          <p className="text-muted-foreground text-sm">View and manage all registered brand partners.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Building2 className="h-4 w-4" /> {brands.length} Brands
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
            className={`${inputCls} pl-9 w-full`}
          />
        </div>
        <select
          title="Filter by industry"
          value={industryFilter}
          onChange={e => setIndustryFilter(e.target.value)}
          className={inputCls}
        >
          <option value="all">All Industries</option>
          {industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
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
          {filtered.map(brand => (
            <div key={brand.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0">
                    {brand.company_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{brand.company_name}</p>
                    {brand.industry && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{brand.industry}</span>
                    )}
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
                  {brand.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={11} className="shrink-0 text-muted-foreground/60" />
                      <span className="font-medium">{brand.contact_phone}</span>
                    </div>
                  )}
                  {brand.website && (
                    <div className="flex items-center gap-2">
                      <Globe size={11} className="shrink-0 text-muted-foreground/60" />
                      <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{brand.website}</a>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
