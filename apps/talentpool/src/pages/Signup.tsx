import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase as _supabase } from '@digihire/shared';
import { motion } from 'motion/react';
import { Mail, Lock, User, Phone, ArrowRight, Linkedin, FileText, Upload, X } from 'lucide-react';
import { Button, Input } from '@digihire/shared';
import { readFileAsBase64, CV_SESSION_KEY, CV_NAME_SESSION_KEY, LINKEDIN_SESSION_KEY } from '../lib/cv-parser';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;
const REDIRECT_URL = `${window.location.origin}/verify-email`;
const MAX_CV_SIZE = 4 * 1024 * 1024; // 4MB (leaves room for base64 in sessionStorage)

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', linkedinUrl: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cvInputRef = useRef<HTMLInputElement>(null);
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
            account_types: ['talent'],
            full_name: formData.fullName,
            phone: formData.phoneNumber,
          },
        },
      });
      if (signUpErr) throw signUpErr;

      // Stash LinkedIn URL for ProfileSetup to pick up
      if (formData.linkedinUrl.trim()) {
        sessionStorage.setItem(LINKEDIN_SESSION_KEY, formData.linkedinUrl.trim());
      }

      // Stash CV as base64 for ProfileSetup to parse
      if (cvFile) {
        try {
          const base64 = await readFileAsBase64(cvFile);
          sessionStorage.setItem(CV_SESSION_KEY, base64);
          sessionStorage.setItem(CV_NAME_SESSION_KEY, cvFile.name);
        } catch {
          // CV storage failure is non-fatal — user can upload in profile setup
        }
      }

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

  const handleCvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_CV_SIZE) {
      setError('CV must be less than 4MB');
      return;
    }
    setError('');
    setCvFile(file);
  };

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
            <h2 className="text-2xl font-bold leading-tight text-foreground">Join the DigiHire Talent Pool</h2>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Create your professional account to start matching with top roles at elite brands.
            </p>
          </div>
          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">01</div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Step 01</p>
                <p className="text-xs font-semibold text-foreground">Account Registration</p>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-40">
              <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">02</div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Step 02</p>
                <p className="text-xs font-semibold text-foreground">Profile Setup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-card p-8 overflow-y-auto max-h-screen">
          <form className="space-y-4" onSubmit={handleSignup}>
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">{error}</div>
            )}
            <div className="space-y-3">
              <Field label="Full Name" name="fullName" type="text" placeholder="John Doe" icon={<User size={15} />} value={formData.fullName} onChange={handleChange} />
              <Field label="Email" name="email" type="email" placeholder="john@example.com" icon={<Mail size={15} />} value={formData.email} onChange={handleChange} />
              <Field label="Phone" name="phoneNumber" type="tel" placeholder="+234 800 000 0000" icon={<Phone size={15} />} value={formData.phoneNumber} onChange={handleChange} />
              <Field label="Password" name="password" type="password" placeholder="••••••••" icon={<Lock size={15} />} value={formData.password} onChange={handleChange} />
              <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" icon={<Lock size={15} />} value={formData.confirmPassword} onChange={handleChange} />

              {/* LinkedIn URL */}
              <Field
                label="LinkedIn Profile (Optional)"
                name="linkedinUrl"
                type="url"
                placeholder="linkedin.com/in/yourname"
                icon={<Linkedin size={15} />}
                value={formData.linkedinUrl}
                onChange={handleChange}
                required={false}
              />

              {/* CV Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  CV / Resume <span className="text-muted-foreground/60">(Optional — auto-fills your profile)</span>
                </label>
                <input
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleCvSelect}
                />
                {cvFile ? (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                    <FileText size={15} className="text-primary shrink-0" />
                    <span className="text-xs font-medium text-primary truncate flex-1">{cvFile.name}</span>
                    <button
                      type="button"
                      onClick={() => { setCvFile(null); if (cvInputRef.current) cvInputRef.current.value = ''; }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => cvInputRef.current?.click()}
                    className="w-full flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <Upload size={15} />
                    <span className="text-xs font-medium">Upload PDF CV (max 4MB)</span>
                  </button>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? 'Creating account...' : <>Create Account <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground border-t border-border/50 pt-4">
            Already registered?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Login here</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, name, type, placeholder, icon, value, onChange, required = true }: {
  label: string; name: string; type: string; placeholder: string;
  icon: React.ReactNode; value: string; onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">{icon}</div>
        <Input name={name} type={type} required={required} placeholder={placeholder} value={value} onChange={onChange} className="pl-9 bg-secondary border-border" />
      </div>
    </div>
  );
}
