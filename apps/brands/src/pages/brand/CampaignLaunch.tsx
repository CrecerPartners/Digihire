import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrandCampaigns } from '../../hooks/useBrandCampaigns';
import { useBrandProfile } from '../../hooks/useBrandProfile';
import { CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import type { BrandCampaign } from '../../types';

type FormData = Omit<BrandCampaign, 'id' | 'brand_id' | 'status' | 'total_sellers' | 'total_conversions' | 'total_leads' | 'tracking_code' | 'created_at' | 'updated_at'>;

export default function CampaignLaunch() {
  const navigate = useNavigate();
  const { profile } = useBrandProfile();
  const { createCampaign } = useBrandCampaigns();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    campaign_name: '',
    brand_name: profile?.company_name ?? '',
    campaign_goal: '',
    product_name: '',
    product_category: '',
    target_audience: '',
    city: '',
    region: '',
    start_date: '',
    end_date: '',
    payout_model: '',
    target_volume: undefined,
    tracking_link: '',
    notes: '',
  });

  React.useEffect(() => {
    if (profile?.company_name) {
      setForm(p => ({ ...p, brand_name: p.brand_name || profile.company_name || '' }));
    }
  }, [profile?.company_name]);

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.campaign_name || !form.campaign_goal || !form.product_name) {
      setError('Campaign name, goal, and product name are required.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await createCampaign({
        ...form,
        target_volume: form.target_volume ? Number(form.target_volume) : undefined,
      });
      if (err) throw err;
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit campaign request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 p-12 text-center shadow-sm">
        <div className="h-16 w-16 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">Campaign Request Submitted!</h3>
        <p className="text-sm text-gray-500 mb-8">Our team will review and activate your campaign within 24–48 hours.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/brand/campaigns')} className="rounded-xl bg-[#2563eb] text-white px-6 py-2.5 text-sm font-normal hover:bg-[#1d4ed8] transition-all">
            View Campaigns
          </button>
          <button onClick={() => { setSubmitted(false); setForm({ campaign_name: '', brand_name: profile?.company_name ?? '', campaign_goal: '', product_name: '', product_category: '', target_audience: '', city: '', region: '', start_date: '', end_date: '', payout_model: '', target_volume: undefined, tracking_link: '', notes: '' }); }} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-normal text-[#4a4a4a] hover:bg-gray-50 transition-all">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-6 flex items-center gap-4">
        <button onClick={() => navigate('/brand/campaigns')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">Launch a VoltSquad Campaign</h2>
          <p className="text-sm text-gray-400">Fill in the details and our team will activate your campaign.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-10">

        {/* Section 1 */}
        <section className="space-y-5">
          <SectionLabel n="1" title="Campaign Basics" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Campaign Name *" required>
              <input required value={form.campaign_name} onChange={set('campaign_name')} placeholder="Summer B2B Push" className={inputCls} />
            </Field>
            <Field label="Brand Name">
              <input value={form.brand_name ?? ''} onChange={set('brand_name')} placeholder="Your company name" className={inputCls} />
            </Field>
            <Field label="Campaign Goal *" className="md:col-span-2">
              <select required value={form.campaign_goal ?? ''} onChange={set('campaign_goal')} className={inputCls}>
                <option value="" disabled>Select goal</option>
                <option>Lead Generation</option>
                <option>Sales / Conversions</option>
                <option>App Sign-ups</option>
                <option>Brand Awareness</option>
                <option>Event Registrations</option>
              </select>
            </Field>
          </div>
        </section>

        <Divider />

        {/* Section 2 */}
        <section className="space-y-5">
          <SectionLabel n="2" title="Product / Service" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Product / Service Name *">
              <input required value={form.product_name ?? ''} onChange={set('product_name')} placeholder="e.g. Acme CRM Pro" className={inputCls} />
            </Field>
            <Field label="Product Category">
              <select value={form.product_category ?? ''} onChange={set('product_category')} className={inputCls}>
                <option value="">Select category</option>
                <option>SaaS / Software</option>
                <option>Fintech / Financial</option>
                <option>E-commerce / Retail</option>
                <option>Health & Wellness</option>
                <option>Education / EdTech</option>
                <option>Logistics / Delivery</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Target Audience" className="md:col-span-2">
              <textarea value={form.target_audience ?? ''} onChange={set('target_audience')} rows={3} placeholder="Describe who your ideal customer is..." className={inputCls + ' resize-none'} />
            </Field>
          </div>
        </section>

        <Divider />

        {/* Section 3 */}
        <section className="space-y-5">
          <SectionLabel n="3" title="Location & Schedule" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="City">
              <input value={form.city ?? ''} onChange={set('city')} placeholder="Lagos" className={inputCls} />
            </Field>
            <Field label="Region">
              <input value={form.region ?? ''} onChange={set('region')} placeholder="South West Nigeria" className={inputCls} />
            </Field>
            <Field label="Start Date">
              <input type="date" value={form.start_date ?? ''} onChange={set('start_date')} className={inputCls} />
            </Field>
            <Field label="End Date">
              <input type="date" value={form.end_date ?? ''} onChange={set('end_date')} className={inputCls} />
            </Field>
          </div>
        </section>

        <Divider />

        {/* Section 4 */}
        <section className="space-y-5">
          <SectionLabel n="4" title="Commercial Terms" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Payout / Commission Model">
              <select value={form.payout_model ?? ''} onChange={set('payout_model')} className={inputCls}>
                <option value="">Select model</option>
                <option>Per Lead</option>
                <option>Per Sale</option>
                <option>Per Sign-up</option>
                <option>Fixed per Seller</option>
                <option>Revenue Share (%)</option>
              </select>
            </Field>
            <Field label="Target Volume">
              <input type="number" min={1} value={form.target_volume ?? ''} onChange={set('target_volume')} placeholder="e.g. 500" className={inputCls} />
            </Field>
            <Field label="Tracking Link / Landing Page" className="md:col-span-2">
              <input type="url" value={form.tracking_link ?? ''} onChange={set('tracking_link')} placeholder="https://yoursite.com/lp" className={inputCls} />
            </Field>
          </div>
        </section>

        <Divider />

        {/* Section 5 */}
        <section className="space-y-5">
          <SectionLabel n="5" title="Assets & Notes" />
          <Field label="Campaign Assets">
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-xs text-gray-400 font-medium">Asset upload will be available in the next update.</p>
              <p className="text-[10px] text-gray-300 mt-1">For now, share links to assets in the notes field below.</p>
            </div>
          </Field>
          <Field label="Notes / Instructions">
            <textarea value={form.notes ?? ''} onChange={set('notes')} rows={4} placeholder="Any specific instructions, asset links, or context for our team..." className={inputCls + ' resize-none'} />
          </Field>
        </section>

        {error && <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="pt-2 flex justify-end">
          <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-[#2563eb] px-8 py-3 text-sm font-normal text-white hover:bg-[#1d4ed8] disabled:opacity-60 transition-all shadow-lg shadow-blue-100">
            {submitting ? 'Submitting...' : 'Submit Campaign Request'} <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-[#2563eb] transition-all';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      {children}
    </div>
  );
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2563eb]/10 text-[#2563eb] text-xs font-black">{n}</span>
      <h3 className="font-bold text-[#1a1a1a]">{title}</h3>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100" />;
}