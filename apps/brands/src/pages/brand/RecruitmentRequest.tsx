import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecruitmentRequests } from '../../hooks/useRecruitmentRequests';
import { useBrandProfile } from '../../hooks/useBrandProfile';
import { CheckCircle2, ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react';
import type { RecruitmentRequest } from '../../types';

type FormData = Omit<RecruitmentRequest, 'id' | 'brand_id' | 'status' | 'applicant_count' | 'shortlist_count' | 'assigned_support' | 'created_at' | 'updated_at'>;

const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-[#2563eb] transition-all';

export default function RecruitmentRequest() {
  const navigate = useNavigate();
  const { profile } = useBrandProfile();
  const { createRequest } = useRecruitmentRequests();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState<FormData>({
    contact_person: profile?.contact_name ?? '',
    hiring_timeline: '',
    location: '',
    industry: profile?.industry ?? '',
    job_title: '',
    num_hires: undefined,
    role_type: '',
    experience_level: '',
    industry_preference: '',
    responsibilities: '',
    required_skills: [],
    salary_min: undefined,
    salary_max: undefined,
    work_type: '',
    job_location: '',
    deadline: '',
    additional_notes: '',
  });

  React.useEffect(() => {
    setForm(p => ({
      ...p,
      contact_person: p.contact_person || profile?.contact_name || '',
      industry: p.industry || profile?.industry || '',
    }));
  }, [profile?.contact_name, profile?.industry]);

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }));

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const skill = skillInput.trim();
      if (skill && !(form.required_skills ?? []).includes(skill)) {
        setForm(p => ({ ...p, required_skills: [...(p.required_skills ?? []), skill] }));
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) =>
    setForm(p => ({ ...p, required_skills: (p.required_skills ?? []).filter(s => s !== skill) }));

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contact_person || !form.hiring_timeline) {
      setError('Contact person and hiring timeline are required.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.job_title) {
      setError('Job title is required.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await createRequest({
        ...form,
        num_hires: form.num_hires ? Number(form.num_hires) : undefined,
        salary_min: form.salary_min ? Number(form.salary_min) : undefined,
        salary_max: form.salary_max ? Number(form.salary_max) : undefined,
      });
      if (err) throw err;
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 p-12 text-center shadow-sm">
        <div className="h-16 w-16 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">Recruitment Request Submitted!</h3>
        <p className="text-sm text-gray-500 mb-8">Our talent team will review your request and be in touch within 48 hours.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/brand/recruitment')} className="rounded-xl bg-violet-600 text-white px-6 py-2.5 text-sm font-normal hover:bg-violet-700 transition-all">
            View Requests
          </button>
          <button onClick={() => { setSubmitted(false); setStep(1); }} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-normal text-[#4a4a4a] hover:bg-gray-50 transition-all">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => step === 1 ? navigate('/brand/recruitment') : setStep(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
            {step === 1 ? <ArrowLeft size={18} /> : <ChevronLeft size={18} />}
          </button>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">Sales Recruitment Request</h2>
            <p className="text-sm text-gray-400">Step {step} of 2 — {step === 1 ? 'Company Details' : 'Talent Requirements'}</p>
          </div>
        </div>
        {/* Step indicator */}
        <div className="flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-violet-500' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-violet-500' : 'bg-gray-200'}`} />
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="p-8 space-y-6">
          <h3 className="font-bold text-[#1a1a1a]">Step 1: Company Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Contact Person *">
              <input required value={form.contact_person ?? ''} onChange={set('contact_person')} placeholder="Full name" className={inputCls} />
            </Field>
            <Field label="Hiring Timeline *">
              <select required value={form.hiring_timeline ?? ''} onChange={set('hiring_timeline')} className={inputCls}>
                <option value="" disabled>Select timeline</option>
                <option>Immediately</option>
                <option>Within 30 days</option>
                <option>1–3 months</option>
                <option>3–6 months</option>
                <option>Just planning</option>
              </select>
            </Field>
            <Field label="Company Location">
              <input value={form.location ?? ''} onChange={set('location')} placeholder="City, Country" className={inputCls} />
            </Field>
            <Field label="Industry">
              <input value={form.industry ?? ''} onChange={set('industry')} placeholder="e.g. SaaS, Fintech" className={inputCls} />
            </Field>
          </div>
          {error && <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 text-sm font-normal text-white hover:bg-violet-700 transition-all">
              Next: Talent Requirements <ArrowRight size={16} />
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h3 className="font-bold text-[#1a1a1a]">Step 2: Talent Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Job Title *">
              <input required value={form.job_title} onChange={set('job_title')} placeholder="e.g. B2B Sales Executive" className={inputCls} />
            </Field>
            <Field label="Number of Hires">
              <input type="number" min={1} value={form.num_hires ?? ''} onChange={set('num_hires')} placeholder="e.g. 3" className={inputCls} />
            </Field>
            <Field label="Role Type">
              <select value={form.role_type ?? ''} onChange={set('role_type')} className={inputCls}>
                <option value="">Select type</option>
                <option>Full-time</option>
                <option>Contract</option>
                <option>Part-time</option>
                <option>Commission-only</option>
              </select>
            </Field>
            <Field label="Experience Level">
              <select value={form.experience_level ?? ''} onChange={set('experience_level')} className={inputCls}>
                <option value="">Select level</option>
                <option>Entry-level (0–2 yrs)</option>
                <option>Mid-level (3–5 yrs)</option>
                <option>Senior (5+ yrs)</option>
                <option>Any level</option>
              </select>
            </Field>
            <Field label="Work Type">
              <select value={form.work_type ?? ''} onChange={set('work_type')} className={inputCls}>
                <option value="">Select work type</option>
                <option>Remote</option>
                <option>Hybrid</option>
                <option>On-site</option>
                <option>Field / External</option>
              </select>
            </Field>
            <Field label="Job Location">
              <input value={form.job_location ?? ''} onChange={set('job_location')} placeholder="City / Region" className={inputCls} />
            </Field>
            <Field label="Salary Min (₦)">
              <input type="number" value={form.salary_min ?? ''} onChange={set('salary_min')} placeholder="e.g. 150000" className={inputCls} />
            </Field>
            <Field label="Salary Max (₦)">
              <input type="number" value={form.salary_max ?? ''} onChange={set('salary_max')} placeholder="e.g. 400000" className={inputCls} />
            </Field>
            <Field label="Application Deadline">
              <input type="date" value={form.deadline ?? ''} onChange={set('deadline')} className={inputCls} />
            </Field>
            <Field label="Industry Preference">
              <input value={form.industry_preference ?? ''} onChange={set('industry_preference')} placeholder="e.g. SaaS, Fintech" className={inputCls} />
            </Field>
            <Field label="Required Skills" className="md:col-span-2">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={addSkill}
                placeholder="Type a skill and press Enter (e.g. Cold calling)"
                className={inputCls}
              />
              {(form.required_skills ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(form.required_skills ?? []).map(skill => (
                    <span key={skill} className="flex items-center gap-1.5 rounded-lg bg-violet-50 border border-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="text-violet-400 hover:text-violet-700 transition-colors">×</button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Key Responsibilities" className="md:col-span-2">
              <textarea value={form.responsibilities ?? ''} onChange={set('responsibilities')} rows={3} placeholder="Describe the main responsibilities of this role..." className={inputCls + ' resize-none'} />
            </Field>
            <Field label="Additional Notes" className="md:col-span-2">
              <textarea value={form.additional_notes ?? ''} onChange={set('additional_notes')} rows={3} placeholder="Any other context for our talent team..." className={inputCls + ' resize-none'} />
            </Field>
          </div>
          {error && <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>}
          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-normal text-gray-400 hover:text-[#1a1a1a] transition-colors">
              <ChevronLeft size={16} /> Back
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 text-sm font-normal text-white hover:bg-violet-700 disabled:opacity-60 transition-all">
              {submitting ? 'Submitting...' : 'Submit Request'} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      {children}
    </div>
  );
}
