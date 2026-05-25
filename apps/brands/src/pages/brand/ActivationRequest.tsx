import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivationRequests } from '../../hooks/useActivationRequests';
import { useBrandProfile } from '../../hooks/useBrandProfile';
import { FileText, Calendar } from 'lucide-react';

const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-[#2563eb] transition-all';

const ACTIVATION_TYPES = ['Brand Activation', 'Field Marketing', 'Campus Activation', 'Pop-up / Experience', 'Product Demo', 'B2B Roadshow', 'Other'];

const TALENT_TYPE_OPTIONS = [
  'Promoters',
  'Merchandisers',
  'Skaters / Flyer Distributors',
  'In-store Promoters',
  'Field Marketers',
  'Shop Floor Staff',
  'Activation Staff',
];

const MEETING_SLOTS = [
  'Mon 9:00 AM WAT', 'Mon 11:00 AM WAT', 'Mon 2:00 PM WAT',
  'Tue 9:00 AM WAT', 'Tue 11:00 AM WAT', 'Tue 2:00 PM WAT',
  'Wed 9:00 AM WAT', 'Wed 11:00 AM WAT', 'Wed 2:00 PM WAT',
  'Thu 9:00 AM WAT', 'Thu 11:00 AM WAT', 'Thu 2:00 PM WAT',
  'Fri 9:00 AM WAT', 'Fri 11:00 AM WAT',
];

export default function ActivationRequest() {
  const navigate = useNavigate();
  const { profile } = useBrandProfile();
  const { createRequest } = useActivationRequests();
  const [mode, setMode] = useState<'form' | 'book'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    company_name: profile?.company_name ?? '',
    contact_person: profile?.contact_name ?? '',
    email: '',
    phone: profile?.phone ?? '',
    activation_type: '',
    location: '',
    preferred_start_date: '',
    preferred_end_date: '',
    goals: '',
    approximate_scale: '',
    notes: '',
    num_talents: '' as string | number,
    talent_duties: '',
    budget_details: '',
  });
  const [selectedTalentTypes, setSelectedTalentTypes] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');

  React.useEffect(() => {
    setForm(p => ({
      ...p,
      company_name: p.company_name || profile?.company_name || '',
      contact_person: p.contact_person || profile?.contact_name || '',
      phone: p.phone || profile?.phone || '',
    }));
  }, [profile?.company_name, profile?.contact_name, profile?.phone]);

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'book' && !selectedSlot) {
      setError('Please select a meeting slot.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = mode === 'form'
        ? {
            ...form,
            booking_type: 'form' as const,
            num_talents: form.num_talents !== '' ? Number(form.num_talents) : undefined,
            talent_types: selectedTalentTypes.length > 0 ? selectedTalentTypes : undefined,
          }
        : { ...form, booking_type: 'meeting' as const, meeting_slot: selectedSlot, num_talents: undefined, talent_types: undefined };
      const { error: err } = await createRequest(payload);
      if (err) throw err;
      navigate('/brand/activations');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-normal text-[#1a1a1a]">New Activation Request</h2>
        <p className="text-sm text-gray-400">Request field marketing support or book a strategy call.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-2xl bg-white border border-gray-100 p-1.5 shadow-sm w-fit gap-1">
        <button
          onClick={() => setMode('form')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-normal transition-all ${mode === 'form' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-400 hover:text-[#1a1a1a]'}`}
        >
          <FileText size={15} /> Submit Request
        </button>
        <button
          onClick={() => setMode('book')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-normal transition-all ${mode === 'book' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-400 hover:text-[#1a1a1a]'}`}
        >
          <Calendar size={15} /> Book a Meeting
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Shared fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Company Name">
              <input value={form.company_name} onChange={set('company_name')} placeholder="Your company" className={inputCls} />
            </Field>
            <Field label="Contact Person">
              <input value={form.contact_person} onChange={set('contact_person')} placeholder="Full name" className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" className={inputCls} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+234 800 000 0000" className={inputCls} />
            </Field>
          </div>

          {mode === 'form' ? (
            <>
              <div className="h-px bg-gray-100" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Activation Type">
                  <select value={form.activation_type} onChange={set('activation_type')} className={inputCls}>
                    <option value="">Select type</option>
                    {ACTIVATION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Location">
                  <input value={form.location} onChange={set('location')} placeholder="City / Venue" className={inputCls} />
                </Field>
                <Field label="Preferred Start Date">
                  <input type="date" value={form.preferred_start_date} onChange={set('preferred_start_date')} className={inputCls} />
                </Field>
                <Field label="Preferred End Date">
                  <input type="date" value={form.preferred_end_date} onChange={set('preferred_end_date')} className={inputCls} />
                </Field>
                <Field label="Approximate Scale" className="md:col-span-2">
                  <select value={form.approximate_scale} onChange={set('approximate_scale')} className={inputCls}>
                    <option value="">Select scale</option>
                    <option>Small (&lt;50 people / 1 location)</option>
                    <option>Medium (50–200 people / 2–5 locations)</option>
                    <option>Large (200+ people / multi-city)</option>
                  </select>
                </Field>
                <Field label="Number of Talents Needed">
                  <input type="number" min={1} value={form.num_talents as string} onChange={set('num_talents')} placeholder="e.g. 10" className={inputCls} />
                </Field>
                <Field label="Goals" className="md:col-span-2">
                  <textarea value={form.goals} onChange={set('goals')} rows={3} placeholder="What do you want to achieve?" className={inputCls + ' resize-none'} />
                </Field>
                <Field label="Type of Talents Required" className="md:col-span-2">
                  <div className="flex flex-wrap gap-2 pt-1">
                    {TALENT_TYPE_OPTIONS.map(opt => {
                      const selected = selectedTalentTypes.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedTalentTypes(prev =>
                            selected ? prev.filter(t => t !== opt) : [...prev, opt]
                          )}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-normal transition-all ${
                            selected
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-300'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="What Will the Talents Be Doing?" className="md:col-span-2">
                  <textarea value={form.talent_duties} onChange={set('talent_duties')} rows={3} placeholder="Describe the specific duties and responsibilities..." className={inputCls + ' resize-none'} />
                </Field>
                <Field label="Payment / Budget Details" className="md:col-span-2">
                  <textarea value={form.budget_details} onChange={set('budget_details')} rows={3} placeholder="Describe the payment structure, daily rate, or total budget..." className={inputCls + ' resize-none'} />
                </Field>
                <Field label="Additional Notes" className="md:col-span-2">
                  <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Anything else our team should know..." className={inputCls + ' resize-none'} />
                </Field>
              </div>
            </>
          ) : (
            <>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-xs font-normal uppercase tracking-wider text-gray-400 mb-3">Select Available Slot (WAT)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MEETING_SLOTS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-normal transition-all ${
                        selectedSlot === slot
                          ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-[#4a4a4a] hover:border-[#2563eb]/40 hover:bg-blue-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3 text-sm font-normal text-white hover:bg-amber-600 disabled:opacity-60 transition-all shadow-sm">
              {submitting ? 'Submitting...' : mode === 'form' ? 'Submit Request' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-normal uppercase tracking-wider text-gray-400">{label}</label>
      {children}
    </div>
  );
}
