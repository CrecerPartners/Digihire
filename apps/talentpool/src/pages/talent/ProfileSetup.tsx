import React, { useState, useRef, useMemo, useEffect } from 'react';
import { TalentProfile } from '../../types';
import { useNavigate } from 'react-router-dom';
import { supabase as _supabase } from '@digihire/shared';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;
import { motion } from 'motion/react';
import { Save, User, MapPin, Briefcase, GraduationCap, Link as LinkIcon, Camera, Upload, CheckCircle, AlertCircle, FileText, Settings, Heart, Sparkles, Loader2, X } from 'lucide-react';
import { parseCvWithClaude, CV_SESSION_KEY, CV_NAME_SESSION_KEY, LINKEDIN_SESSION_KEY } from '../../lib/cv-parser';

interface Props {
  profile: TalentProfile | null;
  onUpdate: (profile: TalentProfile) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfileSetup({ profile, onUpdate }: Props) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<TalentProfile>>(profile || {});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  // CV auto-fill state
  const [pendingCvName, setPendingCvName] = useState<string | null>(null);
  const [cvParsing, setCvParsing] = useState(false);
  const [cvFillSuccess, setCvFillSuccess] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-fill LinkedIn URL from signup
    const pendingLinkedin = sessionStorage.getItem(LINKEDIN_SESSION_KEY);
    if (pendingLinkedin && !formData.linkedin_url) {
      setFormData(prev => ({ ...prev, linkedin_url: pendingLinkedin }));
    }
    // Detect pending CV
    const cvName = sessionStorage.getItem(CV_NAME_SESSION_KEY);
    if (cvName && sessionStorage.getItem(CV_SESSION_KEY)) {
      setPendingCvName(cvName);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCvAutoFill = async () => {
    const cvBase64 = sessionStorage.getItem(CV_SESSION_KEY);
    if (!cvBase64) return;
    setCvParsing(true);
    setCvError(null);
    try {
      const parsed = await parseCvWithClaude(cvBase64);
      setFormData(prev => ({
        ...prev,
        ...(parsed.full_name && !prev.full_name ? { full_name: parsed.full_name } : {}),
        ...(parsed.phone && !prev.phone ? { phone: parsed.phone } : {}),
        ...(parsed.city && !prev.city ? { city: parsed.city } : {}),
        ...(parsed.state && !prev.state ? { state: parsed.state } : {}),
        ...(parsed.country && !prev.country ? { country: parsed.country } : {}),
        ...(parsed.bio && !prev.bio ? { bio: parsed.bio } : {}),
        ...(parsed.experience_years && !prev.experience_years ? { experience_years: parsed.experience_years } : {}),
        ...(parsed.skills?.length && !prev.skills?.length ? { skills: parsed.skills } : {}),
        ...(parsed.languages?.length && !prev.languages?.length ? { languages: parsed.languages } : {}),
        ...(parsed.work_history?.length && !prev.work_history?.length ? { work_history: parsed.work_history } : {}),
        ...(parsed.education?.length && !prev.education?.length ? { education: parsed.education } : {}),
        ...(parsed.linkedin_url && !prev.linkedin_url ? { linkedin_url: parsed.linkedin_url } : {}),
        ...(parsed.role_interests?.length && !prev.role_interests?.length ? { role_interests: parsed.role_interests } : {}),
        ...(parsed.industry_experience?.length && !prev.industry_experience?.length ? { industry_experience: parsed.industry_experience } : {}),
      }));
      sessionStorage.removeItem(CV_SESSION_KEY);
      sessionStorage.removeItem(CV_NAME_SESSION_KEY);
      sessionStorage.removeItem(LINKEDIN_SESSION_KEY);
      setPendingCvName(null);
      setCvFillSuccess(true);
      setTimeout(() => setCvFillSuccess(false), 5000);
    } catch (err: unknown) {
      setCvError(err instanceof Error ? err.message : 'CV analysis failed');
    } finally {
      setCvParsing(false);
    }
  };

  const dismissCvBanner = () => {
    sessionStorage.removeItem(CV_SESSION_KEY);
    sessionStorage.removeItem(CV_NAME_SESSION_KEY);
    setPendingCvName(null);
  };

  // Completion Progress Calculation
  const progress = useMemo(() => {
    const fields: (keyof TalentProfile)[] = [
      'full_name', 'phone', 'gender', 'bio', 'city', 'state', 'country',
      'work_preference', 'experience_years', 'salary_min', 'job_type_preference',
      'role_interests', 'skills', 'linkedin_url', 'cv_url', 'profile_photo_url', 'industry_experience'
    ];
    const filledFields = fields.filter(field => {
      const val = formData[field];
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'number') return val > 0;
      return !!val;
    });
    return Math.round((filledFields.length / fields.length) * 100);
  }, [formData]);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <User size={18} /> },
    { id: 'location', label: 'Location', icon: <MapPin size={18} /> },
    { id: 'experience', label: 'Experience', icon: <Briefcase size={18} /> },
    { id: 'preferences', label: 'Preferences', icon: <Heart size={18} /> },
    { id: 'links', label: 'Links & CV', icon: <LinkIcon size={18} /> },
  ];

  const handleSubmit = async (e: React.FormEvent, isFinishLater = false) => {
    e.preventDefault();
    if (!profile?.id) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const { error } = await supabase
        .from('talent_profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          preferred_work_location: formData.preferred_work_location,
          work_preference: formData.work_preference,
          job_type_preference: formData.job_type_preference,
          role_interests: formData.role_interests,
          experience_years: formData.experience_years,
          industry_experience: formData.industry_experience,
          bio: formData.bio,
          education: formData.education,
          certifications: formData.certifications,
          work_history: formData.work_history,
          skills: formData.skills,
          languages: formData.languages,
          linkedin_url: formData.linkedin_url,
          portfolio_url: formData.portfolio_url,
          cv_url: formData.cv_url,
          profile_photo_url: formData.profile_photo_url,
          salary_min: formData.salary_min,
          salary_max: formData.salary_max,
          availability: formData.availability,
          status: progress === 100 ? 'complete' : 'incomplete',
          profile_completion: progress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile!.id);
      if (error) throw error;
      onUpdate({ ...profile!, ...formData, status: progress === 100 ? 'complete' : 'incomplete', profile_completion: progress } as TalentProfile);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (isFinishLater) {
        navigate('/talent');
        return;
      }

      // Move to next tab if needed
      const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
      if (currentTabIndex !== -1 && currentTabIndex < tabs.length - 1) {
        setActiveTab(tabs[currentTabIndex + 1].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (currentTabIndex === tabs.length - 1) {
        alert('Profile completed successfully!');
        navigate('/talent');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
      console.error('Save error details:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const currentValues = (formData[name as keyof TalentProfile] as string[]) || [];
      if (checked) {
        setFormData({ ...formData, [name]: [...currentValues, value] });
      } else {
        setFormData({ ...formData, [name]: currentValues.filter(v => v !== value) });
      }
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: value === '' ? 0 : Number(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id || 'new'}-${field}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('talent-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('talent-assets')
        .getPublicUrl(fileName);

      if (field === 'certifications') {
        setFormData(prev => ({
          ...prev,
          certifications: [...(prev.certifications || []), { url: publicUrl, name: file.name }]
        }));
      } else {
        setFormData(prev => ({ ...prev, [field]: publicUrl }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Progress Bar */}
      <div className="bg-slate-900 p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold">Complete Your Profile</h2>
            <p className="text-slate-400 text-sm mt-1">Fill in more details to get better career matches.</p>
          </div>
          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
              <span className="text-sky-400">Profile Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CV auto-fill banner */}
      {pendingCvName && (
        <div className="mx-0 px-6 py-3 bg-sky-50 border-b border-sky-100 flex items-center gap-3">
          <Sparkles size={16} className="text-sky-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sky-800">CV ready to analyze</p>
            <p className="text-[11px] text-sky-600 truncate">{pendingCvName}</p>
          </div>
          {cvError && <p className="text-[11px] text-red-500 shrink-0">{cvError}</p>}
          <button
            type="button"
            onClick={handleCvAutoFill}
            disabled={cvParsing}
            className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-sky-700 disabled:opacity-60 transition-all shrink-0"
          >
            {cvParsing ? <><Loader2 size={12} className="animate-spin" /> Analyzing...</> : <>Auto-fill Profile</>}
          </button>
          <button type="button" onClick={dismissCvBanner} className="text-sky-400 hover:text-sky-600 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {cvFillSuccess && (
        <div className="mx-0 px-6 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
          <CheckCircle size={15} className="text-green-600 shrink-0" />
          <p className="text-xs font-semibold text-green-700">Profile fields filled from your CV. Review each tab and save.</p>
        </div>
      )}

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap min-w-max flex-1 ${
              activeTab === tab.id ? 'border-sky-600 text-sky-600 bg-sky-50/50' : 'border-transparent text-slate-500 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-10">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-600 text-sm font-medium">
            <CheckCircle size={18} />
            Progress saved successfully!
          </div>
        )}

        {activeTab === 'basic' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
               <div className="relative group">
                  <div className="h-32 w-32 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden relative">
                    {formData.profile_photo_url ? (
                      <img src={formData.profile_photo_url} className="h-full w-full object-cover" alt="Profile" />
                    ) : (
                      <>
                        <Camera size={24} className="text-gray-300 mb-2" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Upload Photo</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Upload size={20} />
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'profile_photo_url')} />
                  <p className="mt-2 text-[10px] text-gray-400 text-center font-medium uppercase tracking-wider">Max 5MB • JPG/PNG</p>
               </div>

               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} />
                  <Input label="Email Address" name="email" type="email" value={(formData as any).email} onChange={handleChange} disabled />
                  <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="+234..." />
                  <Input label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} />

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none transition-all">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
               </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Professional Bio</label>
              <textarea name="bio" rows={4} value={formData.bio} onChange={handleChange} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none transition-all" placeholder="Briefly describe your career goals and expertise..." />
            </div>
          </motion.div>
        )}

        {activeTab === 'location' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="City" name="city" value={formData.city} onChange={handleChange} />
              <Input label="State" name="state" value={formData.state} onChange={handleChange} />
              <Input label="Country" name="country" value={formData.country} onChange={handleChange} />
            </div>

            <div className="space-y-4 pt-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Current Work Setup Preference</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['remote', 'hybrid', 'onsite'].map(pref => (
                  <label key={pref} className={`flex items-center justify-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${formData.work_preference === pref ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-gray-50 border-gray-100 text-slate-500 hover:bg-white hover:border-gray-200'}`}>
                    <input type="radio" name="work_preference" value={pref} checked={formData.work_preference === pref} onChange={handleChange} className="hidden" />
                    <span className="text-xs font-bold uppercase tracking-widest">{pref}</span>
                    {formData.work_preference === pref && <CheckCircle size={14} />}
                  </label>
                ))}
              </div>
            </div>

            <Input label="Preferred Work Location (Optional)" name="preferred_work_location" value={formData.preferred_work_location} onChange={handleChange} placeholder="e.g. Lagos, Remote, Global" />
          </motion.div>
        )}

        {activeTab === 'experience' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="Total Years of Experience" name="experience_years" type="number" value={formData.experience_years} onChange={handleChange} />
              <Input label="Min Salary Expectation" name="salary_min" type="number" value={formData.salary_min} onChange={handleChange} placeholder="e.g. 80000" />
              <Input label="Max Salary Expectation" name="salary_max" type="number" value={formData.salary_max} onChange={handleChange} placeholder="e.g. 100000" />
            </div>

            <div className="space-y-4 pt-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Expertise & Roles</label>
              <div className="flex flex-wrap gap-2">
                {['B2B Sales', 'Tech Sales', 'SaaS Sales', 'SDR', 'BDR', 'Account Executive', 'Business Development', 'Sales Ops', 'Merchandiser', 'Field Sales', 'Closer'].map(role => (
                   <Checkbox key={role} label={role} name="role_interests" checked={formData.role_interests?.includes(role)} onChange={handleChange} />
                 ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Key Skills (Comma separated)</label>
              <textarea
                placeholder="Negotiation, Cold Calling, CRM, Pipeline Management..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none transition-all"
                value={formData.skills?.join(', ')}
                onChange={(e:any) => setFormData({...formData, skills: e.target.value.split(',').map((s:string) => s.trim()).filter(Boolean)})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Languages (Comma separated)</label>
              <textarea
                placeholder="English, French, Swahili..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none transition-all"
                value={formData.languages?.join(', ')}
                onChange={(e:any) => setFormData({...formData, languages: e.target.value.split(',').map((s:string) => s.trim()).filter(Boolean)})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Work History (Brief summary)</label>
              <textarea
                placeholder="Company A (2020 - 2022) - Sales Executive&#10;Company B (2018 - 2020) - BDR..."
                rows={4}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none transition-all"
                value={Array.isArray(formData.work_history) && formData.work_history.length ? formData.work_history[0]?.summary : ''}
                onChange={(e:any) => setFormData({...formData, work_history: [{ summary: e.target.value }]})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Education (Brief summary)</label>
              <textarea
                placeholder="BSc Business Administration - University of Lagos (2018)"
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none transition-all"
                value={Array.isArray(formData.education) && formData.education.length ? formData.education[0]?.summary : ''}
                onChange={(e:any) => setFormData({...formData, education: [{ summary: e.target.value }]})}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Available Work Modes</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {['Full-time', 'Part-time', 'Project-based', 'Contract', 'Field Marketing', 'Merchandising'].map(type => (
                   <Checkbox key={type} label={type} name="job_type_preference" checked={formData.job_type_preference?.includes(type)} onChange={handleChange} />
                 ))}
              </div>
            </div>

            <div className="space-y-4 pt-4">
               <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Industry Interests</label>
               <div className="flex flex-wrap gap-2">
                 {['Tech', 'Fintech', 'SaaS', 'Healthtech', 'Financial Services', 'Telecoms', 'Retail', 'FMCG'].map(ind => (
                    <Checkbox key={ind} label={ind} name="industry_experience" checked={formData.industry_experience?.includes(ind)} onChange={handleChange} />
                 ))}
               </div>
            </div>

            <div className="space-y-1.5 pt-4">
               <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Availability Status</label>
               <div className="flex gap-4">
                 {['available', 'looking', 'unavailable'].map(stat => (
                   <label key={stat} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all ${formData.availability === stat ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-slate-500'}`}>
                     <input type="radio" name="availability" value={stat} checked={formData.availability === stat} onChange={handleChange} className="hidden" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">{stat.replace('_', ' ')}</span>
                   </label>
                 ))}
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'links' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="LinkedIn Profile" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} icon={<LinkIcon size={14} />} placeholder="linkedin.com/in/..." />
              <Input label="Portfolio / Personal Site" name="portfolio_url" value={formData.portfolio_url} onChange={handleChange} icon={<LinkIcon size={14} />} placeholder="mywork.com" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* CV Upload */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">CV / Resume (PDF Preferred)</label>
                <div
                  onClick={() => cvInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${formData.cv_url ? 'bg-sky-50 border-sky-200 text-sky-700' : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50'}`}
                >
                  <input ref={cvInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e, 'cv_url')} />
                  {formData.cv_url ? (
                    <>
                      <FileText size={32} className="mb-2" />
                      <span className="text-xs font-bold">Document Uploaded</span>
                      <span className="text-[10px] mt-1 opacity-60">Click to change</span>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="text-gray-300 mb-2" />
                      <span className="text-xs font-bold text-gray-500">Upload CV / Resume</span>
                      <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Max 5MB</span>
                    </>
                  )}
                </div>
              </div>

              {/* Certification Upload */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Certifications (Add primary one)</label>
                <div
                  onClick={() => certInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${formData.certifications?.length ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'}`}
                >
                  <input ref={certInputRef} type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, 'certifications')} />
                  {formData.certifications?.length ? (
                    <>
                      <GraduationCap size={32} className="mb-2" />
                      <span className="text-xs font-bold text-amber-900">Certification Added</span>
                      <span className="text-[10px] mt-1 opacity-60">Click to replace</span>
                    </>
                  ) : (
                    <>
                      <Award size={32} className="text-gray-300 mb-2" />
                      <span className="text-xs font-bold text-gray-500">Upload Certification</span>
                      <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Max 5MB</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-2 text-slate-400">
             {progress === 100 ? (
               <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase tracking-widest">
                 <CheckCircle size={14} /> Profile Complete
               </div>
             ) : (
               <div className="flex items-center gap-1.5 text-sky-600 font-bold text-[10px] uppercase tracking-widest">
                 <AlertCircle size={14} /> Profile {progress}% Complete
               </div>
             )}
           </div>
           <div className="flex items-center gap-3 w-full sm:w-auto">
             <button
               type="button"
               disabled={saving}
               onClick={(e) => handleSubmit(e, true)}
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-6 py-4 text-xs font-bold text-slate-500 hover:bg-gray-50 transition-all uppercase tracking-widest"
             >
               {saving ? 'Saving...' : 'Finish Later'}
             </button>
             <button
               type="submit"
               disabled={saving}
               className="flex-1 sm:flex-none flex items-center justify-center gap-3 rounded-lg bg-sky-600 px-10 py-4 text-xs font-bold text-white hover:bg-sky-700 shadow-lg shadow-sky-100 transition-all uppercase tracking-widest"
             >
               {saving ? 'Saving...' : activeTab === 'links' ? 'Complete Profile' : 'Save & Continue'}
               <Save size={16} />
             </button>
           </div>
        </div>
      </form>
    </div>
  );
}

function Input({ label, name, type = "text", value, onChange, placeholder, disabled, icon }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300">{icon}</div>}
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium focus:bg-white focus:outline-none focus:border-sky-500 transition-all ${icon ? 'pl-11' : ''} ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
        />
      </div>
    </div>
  );
}

function Checkbox({ label, name, checked, onChange }: any) {
  return (
    <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-gray-50 border-gray-100 text-slate-600 hover:border-gray-200'}`}>
      <input type="checkbox" name={name} value={label} checked={checked} onChange={onChange} className="hidden" />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </label>
  );
}

function Award({ size, className }: { size: number, className?: string }) {
  return <GraduationCap size={size} className={className} />;
}
