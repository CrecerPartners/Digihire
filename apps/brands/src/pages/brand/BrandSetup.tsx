import React, { useState, useRef } from 'react';
import { BrandProfile } from '../../types';
import { useBrandProfile } from '../../hooks/useBrandProfile';
import { useAuth, supabase as _supabase } from '@digihire/shared';
import { motion } from 'motion/react';
import { Save, Building2, Globe, MapPin, Upload, X, ImageIcon } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

export default function BrandSetup() {
  const { user } = useAuth();
  const { profile, updateProfile } = useBrandProfile();
  const [formData, setFormData] = useState<Partial<BrandProfile>>(profile || {});
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (profile) setFormData(profile);
  }, [profile]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null;
    setLogoUploading(true);
    try {
      const ext = logoFile.name.split('.').pop();
      const path = `logos/${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('brand-assets')
        .upload(path, logoFile, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('brand-assets').getPublicUrl(path);
      return data.publicUrl as string;
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let logoUrl = formData.logo_url;
      if (logoFile) {
        const uploaded = await uploadLogo();
        if (uploaded) logoUrl = uploaded;
      }

      const { error: err } = await updateProfile({
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        phone: formData.phone,
        website: formData.website,
        company_type: formData.company_type,
        industry: formData.industry,
        company_size: formData.company_size,
        city: formData.city,
        country: formData.country,
        primary_goal: formData.primary_goal,
        description: formData.description,
        logo_url: logoUrl,
      });
      if (err) {
        alert('Failed to update company profile.');
      } else {
        if (logoUrl) setFormData(prev => ({ ...prev, logo_url: logoUrl ?? undefined }));
        setLogoFile(null);
        alert('Company profile updated!');
      }
    } finally {
      setSaving(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const currentLogo = logoPreview || formData.logo_url;

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50/50 p-6">
        <h2 className="text-xl font-normal text-[#1a1a1a]">Company Onboarding</h2>
        <p className="text-sm text-[#8e8e8e]">Tell us about your brand so we can match the best talent.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-normal uppercase text-gray-500">Brand Logo</label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
              {currentLogo ? (
                <img src={currentLogo} alt="Brand logo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-gray-300" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoSelect}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                <Upload size={15} />
                {currentLogo ? 'Change Logo' : 'Upload Logo'}
              </button>
              {currentLogo && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                    setFormData(prev => ({ ...prev, logo_url: undefined }));
                    if (logoInputRef.current) logoInputRef.current.value = '';
                  }}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400">PNG, JPG, WebP or SVG. Recommended: 200×200px or larger.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput label="Company Name" name="company_name" value={formData.company_name} onChange={handleChange} icon={<Building2 size={18} />} />
          <FormInput label="Website" name="website" value={formData.website} onChange={handleChange} icon={<Globe size={18} />} placeholder="https://company.com" />
          <FormInput label="Contact Person" name="contact_name" value={formData.contact_name} onChange={handleChange} />
          <FormInput label="Industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. SaaS, E-commerce, Fintech" />

          <div className="space-y-1">
            <label className="block text-xs font-normal uppercase text-gray-500">Company Size</label>
            <select name="company_size" value={formData.company_size || ''} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:outline-none">
              <option value="">Select Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-normal uppercase text-gray-500">Primary Goal</label>
            <select name="primary_goal" value={formData.primary_goal || ''} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:outline-none">
              <option value="">Select Goal</option>
              <option value="campaigns">Sales Campaigns</option>
              <option value="recruitment">Long-term Recruitment</option>
              <option value="activations">Brand Activations</option>
            </select>
          </div>

          <FormInput label="City" name="city" value={formData.city} onChange={handleChange} icon={<MapPin size={18} />} />
          <FormInput label="Country" name="country" value={formData.country} onChange={handleChange} icon={<MapPin size={18} />} />
        </div>

        {/* Description — full width */}
        <div className="space-y-1">
          <label className="block text-xs font-normal uppercase text-gray-500">Company Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Tell potential talent about your brand, culture, and what makes you a great place to work with..."
            rows={4}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:outline-none transition-all resize-none"
          />
          <p className="text-xs text-gray-400">Shown to candidates and sellers reviewing your brand profile.</p>
        </div>

        <div className="pt-8 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving || logoUploading}
            className="flex items-center gap-2 rounded-xl bg-[#2563eb] px-8 py-3 text-sm font-normal text-white hover:bg-[#1d4ed8] transition-all shadow-lg shadow-blue-100 disabled:opacity-60"
          >
            {saving || logoUploading ? 'Saving...' : 'Save Company Details'}
            <Save size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

function FormInput({ label, name, type = "text", value, onChange, placeholder, icon }: {
  label: string; name: string; type?: string; value?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (e: any) => void; placeholder?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-normal uppercase text-gray-500">{label}</label>
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>}
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:outline-none transition-all ${icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
}
