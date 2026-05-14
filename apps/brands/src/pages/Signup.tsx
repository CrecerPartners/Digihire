import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase as _supabase } from '@digihire/shared';
import { motion } from 'motion/react';
import { Building2, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { Button, Input } from '@digihire/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;
const REDIRECT_URL = `${window.location.origin}/verify-email`;

export default function Signup() {
  const [formData, setFormData] = useState({
    companyName: '', contactName: '', email: '', phoneNumber: '', password: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    try {
      const { error: signUpErr } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: REDIRECT_URL,
          data: {
            account_types: ['brand'],
            full_name: formData.contactName,
            company_name: formData.companyName,
            phone: formData.phoneNumber,
          },
        },
      });
      if (signUpErr) throw signUpErr;
      sessionStorage.setItem('pending_verify_email', formData.email);
      navigate('/verify-email');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl grid md:grid-cols-2 overflow-hidden rounded-xl border border-border/50 relative z-10"
      >
        {/* Left panel */}
        <div className="bg-sidebar-background p-10 flex flex-col justify-between border-r border-border/50">
          <div>
            <img src="/assets/logo-color.png" alt="DigiHire" className="h-8 w-auto object-contain mb-10" />
            <h2 className="text-2xl font-normal leading-tight text-foreground">Elite Sales Talent for your Brand</h2>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Create a brand account and start hiring the top 1% of sales experts for your growth.
            </p>
          </div>
          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full border border-primary/30 flex items-center justify-center text-[10px] font-normal text-primary">01</div>
              <div>
                <p className="text-[10px] font-normal uppercase tracking-widest text-primary">Step 01</p>
                <p className="text-xs font-normal text-foreground">Brand Registration</p>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-40">
              <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-[10px] font-normal text-muted-foreground">02</div>
              <div>
                <p className="text-[10px] font-normal uppercase tracking-widest text-muted-foreground">Step 02</p>
                <p className="text-xs font-normal text-foreground">Brand Setup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-card p-10">
          <form className="space-y-4" onSubmit={handleSignup}>
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">{error}</div>
            )}
            <div className="space-y-3">
              <Field label="Company Name" name="companyName" type="text" placeholder="Acme Inc" icon={<Building2 size={15} />} value={formData.companyName} onChange={handleChange} />
              <Field label="Contact Name" name="contactName" type="text" placeholder="John Smith" icon={<User size={15} />} value={formData.contactName} onChange={handleChange} />
              <Field label="Work Email" name="email" type="email" placeholder="hr@acme.com" icon={<Mail size={15} />} value={formData.email} onChange={handleChange} />
              <Field label="Phone" name="phoneNumber" type="tel" placeholder="+234 800 000 0000" icon={<Phone size={15} />} value={formData.phoneNumber} onChange={handleChange} />
              <Field label="Password" name="password" type="password" placeholder="••••••••" icon={<Lock size={15} />} value={formData.password} onChange={handleChange} />
              <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" icon={<Lock size={15} />} value={formData.confirmPassword} onChange={handleChange} />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? 'Registering...' : <>Start Hiring Elite Talent <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground border-t border-border/50 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Login here</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, name, type, placeholder, icon, value, onChange }: {
  label: string; name: string; type: string; placeholder: string;
  icon: React.ReactNode; value: string; onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">{icon}</div>
        <Input name={name} type={type} required placeholder={placeholder} value={value} onChange={onChange} className="pl-9 bg-secondary border-border" />
      </div>
    </div>
  );
}
