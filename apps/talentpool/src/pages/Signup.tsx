import { useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase as _supabase } from '@digihire/shared';
import { motion } from 'motion/react';
import {
  Mail, Lock, User, Phone, ArrowRight, Linkedin, FileText, Upload, X,
  CheckCircle, TrendingUp, Users, Zap, Briefcase, CalendarDays,
  Wallet, Target, ShoppingBag, Trophy, MapPin, Star, BarChart3,
} from 'lucide-react';
import { Button, Input } from '@digihire/shared';
import { readFileAsBase64, CV_SESSION_KEY, CV_NAME_SESSION_KEY, LINKEDIN_SESSION_KEY } from '../lib/cv-parser';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;
const REDIRECT_URL = `${window.location.origin}/verify-email`;
const MAX_CV_SIZE = 4 * 1024 * 1024;

type ModuleKey = 'talent_pool' | 'voltsquad' | 'gigs' | 'events';

const MODULE_FORM: Record<ModuleKey, { cta: string; showCv: boolean; showLinkedin: boolean }> = {
  talent_pool: { cta: 'Join the Talent Pool', showCv: true, showLinkedin: true },
  voltsquad: { cta: 'Join VoltSquad', showCv: false, showLinkedin: false },
  gigs: { cta: 'Apply for Gigs', showCv: true, showLinkedin: false },
  events: { cta: 'Register for Events', showCv: false, showLinkedin: false },
};

function Label({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{children}</h3>;
}

function NextStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function MobileDivider({ text = 'Complete the form below to get started' }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{text}</span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

function MobileDetails({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(v => !v), []);
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className="lg:hidden flex items-center gap-2 text-xs font-semibold text-primary/80 hover:text-primary transition-colors py-1"
      >
        <span>{open ? 'Hide details ▲' : 'Learn more ▼'}</span>
      </button>
      <div className={`${open ? 'block' : 'hidden'} lg:block space-y-8`}>
        {children}
      </div>
    </>
  );
}

function TalentPoolContent() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <User size={11} /> Talent Pool
        </span>
        <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          Join the Digihire<br />Talent Pool
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg">
          Create your profile and get considered for full-time, part-time, contract, and project-based sales roles with brands across tech, fintech, SaaS, healthtech, financial services, telecoms, and other growing industries.
        </p>
      </div>

      <MobileDivider />

      <MobileDetails>
        <div className="grid grid-cols-3 gap-3">
          {[['100+', 'brands hiring'], ['5+', 'role types'], ['10+', 'industries']].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-secondary/80 border border-border/50 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{v}</div>
              <div className="text-xs text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>

        <div>
          <Label>Role types available</Label>
          <div className="space-y-2">
            {([
              [TrendingUp, 'Full-Time Sales Executives', 'B2B, enterprise, and field sales roles'],
              [Users, 'SDRs, BDRs & Business Development', 'Outbound, inside sales, and lead generation'],
              [Briefcase, 'Part-Time & Contract Roles', 'Campaign-based and short-term sales work'],
              [MapPin, 'Field Reps & Merchandisers', 'On-ground sales and distribution roles'],
            ] as const).map(([Icon, label, sub]) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/40">
                <Icon size={14} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Industries hiring now</Label>
          <div className="flex flex-wrap gap-2">
            {['Tech & SaaS', 'Fintech', 'Healthtech', 'Financial Services', 'Telecoms', 'FMCG', 'E-commerce', 'Real Estate'].map(i => (
              <span key={i} className="bg-background border border-border/60 text-muted-foreground text-xs px-3 py-1.5 rounded-full">{i}</span>
            ))}
          </div>
        </div>

        <div>
          <Label>What happens after sign-up</Label>
          <div className="space-y-2.5">
            <NextStep n={1} text="Create your account and verify your email" />
            <NextStep n={2} text="Log in and complete your professional profile" />
            <NextStep n={3} text="Upload your CV to get auto-matched to roles" />
            <NextStep n={4} text="Receive opportunities from brands hiring on Digihire" />
          </div>
        </div>
      </MobileDetails>
    </div>
  );
}

function VoltSquadTalentContent() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Zap size={11} /> VoltSquad
        </span>
        <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          Work with real brands.<br />Earn through real sales.
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg">
          VoltSquad is where you find real brands, real products, and real campaigns you can sell — then start earning every time people buy, sign up, or convert through you.
        </p>
      </div>

      <MobileDivider />

      <MobileDetails>
        <div>
          <Label>How it works</Label>
          <div className="space-y-2">
            {[
              ['01', 'Browse campaigns', 'Find active brand campaigns across the marketplace'],
              ['02', 'Promote & sell', 'Share your unique links and promote products you believe in'],
              ['03', 'Earn commissions', 'Get paid every time someone buys or signs up through you'],
            ].map(([step, title, desc]) => (
              <div key={step} className="flex gap-4 p-3 rounded-lg bg-secondary/50 border border-border/40">
                <div className="text-xs font-bold text-yellow-500 w-5 shrink-0 mt-0.5">{step}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>What you get access to</Label>
          <div className="grid grid-cols-2 gap-2">
            {([
              [Zap, 'Brand Campaigns', 'Live campaigns to join'],
              [Wallet, 'Earnings Wallet', 'Track and withdraw earnings'],
              [Target, 'Target Calculator', 'Set clear income goals'],
              [ShoppingBag, 'Marketplace', 'Browse and promote products'],
              [Users, 'Referrals', 'Earn by referring other sellers'],
              [Trophy, 'Leaderboard', 'Compete and rank against others'],
              [BarChart3, 'Sales Tracker', 'Monitor your performance'],
              [Star, 'Your Own Shop', 'Build a shop with your products'],
            ] as const).map(([Icon, label, desc]) => (
              <div key={label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/50 border border-border/40">
                <Icon size={13} className="text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>What happens after sign-up</Label>
          <div className="space-y-2.5">
            <NextStep n={1} text="Create your account and verify your email" />
            <NextStep n={2} text="Log in to access the VoltSquad dashboard" />
            <NextStep n={3} text="Browse live brand campaigns and join the ones that match your goals" />
            <NextStep n={4} text="Start promoting and earning commissions" />
          </div>
        </div>
      </MobileDetails>
    </div>
  );
}

function GigsContent() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Briefcase size={11} /> Short-Term Gigs
        </span>
        <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          Apply for Merchandising,<br />Activation & Field Roles
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg">
          We're currently looking for sales professionals interested in roles like merchandisers, field marketers, activation staff, event marketers, in-store promoters, shop floor workers, and temporary campaign staff.
        </p>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-lg">
          If you're willing to show up physically, work with different brands, support product launches at events, malls, campuses, and on-ground campaigns — this is for you.
        </p>
      </div>

      <MobileDivider />

      <MobileDetails>
        <div>
          <Label>Roles available</Label>
          <div className="flex flex-wrap gap-2">
            {['Event Promoters', 'Activation Staff', 'Promoters', 'In-Store Promoters', 'Merchandisers', 'Field Marketers', 'Sales Reps', 'Field Reps', 'Shop Floor Workers', 'Temporary Campaign Staff'].map(r => (
              <span key={r} className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-xs font-medium px-3 py-1.5 rounded-full">{r}</span>
            ))}
          </div>
        </div>

        <div>
          <Label>Who this is for</Label>
          <div className="space-y-2">
            {[
              'People who want short-term, project-based, and physical roles',
              'Anyone who can work across malls, campuses, events, and field campaigns',
              'Sales professionals comfortable with on-ground brand activations',
              'Individuals looking for flexible, campaign-based income',
            ].map(item => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckCircle size={13} className="text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>What happens after sign-up</Label>
          <div className="space-y-2.5">
            <NextStep n={1} text="Create your account and verify your email" />
            <NextStep n={2} text="Log in and complete the gigs section of your profile" />
            <NextStep n={3} text="Our team matches you with available roles that fit your location and skills" />
            <NextStep n={4} text="Get deployed on brand activations, events, and field campaigns" />
          </div>
        </div>
      </MobileDetails>
    </div>
  );
}

function EventsContent() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <CalendarDays size={11} /> Events
        </span>
        <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          Sign Up for Upcoming<br />Digihire Events
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg">
          Get access to brand activations, industry workshops, networking sessions, and career events. Sign up to register for events as they go live.
        </p>
      </div>

      <MobileDivider />

      <MobileDetails>
        <div>
          <Label>Event types you can access</Label>
          <div className="space-y-2">
            {([
              [CalendarDays, 'Brand Activations', 'On-ground events and campaigns with leading brands'],
              [Users, 'Networking Events', 'Connect with industry professionals and hiring brands'],
              [Star, 'Career Workshops', 'Skill-building sessions for sales professionals'],
              [Zap, 'Sales Bootcamps', 'Intensive training on closing, field sales, and campaigns'],
            ] as const).map(([Icon, label, sub]) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/40">
                <Icon size={14} className="text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>What happens after sign-up</Label>
          <div className="space-y-2.5">
            <NextStep n={1} text="Create your account and verify your email" />
            <NextStep n={2} text="Log in to view upcoming events" />
            <NextStep n={3} text="Click into any open event and register" />
            <NextStep n={4} text="Receive event details and updates in your dashboard" />
          </div>
        </div>
      </MobileDetails>
    </div>
  );
}

const MODULE_CONTENT: Record<ModuleKey, () => JSX.Element> = {
  talent_pool: TalentPoolContent,
  voltsquad: VoltSquadTalentContent,
  gigs: GigsContent,
  events: EventsContent,
};

export default function Signup() {
  const [searchParams] = useSearchParams();
  const module = (searchParams.get('module') ?? 'talent_pool') as ModuleKey;
  const config = MODULE_FORM[module] ?? MODULE_FORM.talent_pool;
  const ContentComponent = MODULE_CONTENT[module] ?? MODULE_CONTENT.talent_pool;

  const [formData, setFormData] = useState({ fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', linkedinUrl: '' });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountExists, setAccountExists] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    setAccountExists(false);
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: REDIRECT_URL,
          data: { account_types: ['talent'], active_modules: [module], full_name: formData.fullName, phone: formData.phoneNumber },
        },
      });
      if (signUpErr) {
        if (signUpErr.message?.toLowerCase().includes('already registered') || signUpErr.message?.toLowerCase().includes('already exists')) {
          setAccountExists(true);
          return;
        }
        throw signUpErr;
      }
      if (data.user?.identities?.length === 0) {
        setAccountExists(true);
        return;
      }

      if (config.showLinkedin && formData.linkedinUrl.trim()) sessionStorage.setItem(LINKEDIN_SESSION_KEY, formData.linkedinUrl.trim());
      if (config.showCv && cvFile) {
        try {
          const base64 = await readFileAsBase64(cvFile);
          sessionStorage.setItem(CV_SESSION_KEY, base64);
          sessionStorage.setItem(CV_NAME_SESSION_KEY, cvFile.name);
        } catch { /* non-fatal */ }
      }
      sessionStorage.setItem('pending_verify_email', formData.email);
      sessionStorage.setItem('pending_module', module);
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
    if (file.size > MAX_CV_SIZE) { setError('CV must be less than 4MB'); return; }
    setError('');
    setCvFile(file);
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-background">
      <header className="h-14 shrink-0 border-b border-border/50 px-6 flex items-center justify-between">
        <img src="/assets/logo-color.png" alt="DigiHire" className="h-7 w-auto object-contain" />
        <p className="text-sm text-muted-foreground">
          Already registered?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
        </p>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        {/* Left: Landing content */}
        <div className="flex-1 px-6 pt-8 pb-6 lg:px-14 lg:py-14 lg:overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <ContentComponent />
          </motion.div>
        </div>

        {/* Right: Form */}
        <div className="border-t lg:border-t-0 lg:border-l border-border/50 bg-card px-6 py-10 lg:w-[420px] lg:shrink-0 lg:overflow-y-auto">
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <h2 className="text-lg font-bold text-foreground mb-6">Create your account</h2>

            <form className="space-y-4" onSubmit={handleSignup}>
              {accountExists && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">Account already exists</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    An account is already registered with <span className="font-medium text-foreground">{formData.email}</span>. Please log in instead.
                  </p>
                  <Link to="/login" className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors">
                    Log in to your account <ArrowRight size={12} />
                  </Link>
                </div>
              )}
              {error && !accountExists && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">{error}</div>
              )}

              <div className="space-y-3">
                <Field label="Full Name" name="fullName" type="text" placeholder="John Doe" icon={<User size={14} />} value={formData.fullName} onChange={handleChange} />
                <Field label="Email" name="email" type="email" placeholder="john@example.com" icon={<Mail size={14} />} value={formData.email} onChange={handleChange} />
                <Field label="Phone" name="phoneNumber" type="tel" placeholder="+234 800 000 0000" icon={<Phone size={14} />} value={formData.phoneNumber} onChange={handleChange} />
                <Field label="Password" name="password" type="password" placeholder="••••••••" icon={<Lock size={14} />} value={formData.password} onChange={handleChange} />
                <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" icon={<Lock size={14} />} value={formData.confirmPassword} onChange={handleChange} />

                {config.showLinkedin && (
                  <Field label="LinkedIn Profile (Optional)" name="linkedinUrl" type="url" placeholder="linkedin.com/in/yourname" icon={<Linkedin size={14} />} value={formData.linkedinUrl} onChange={handleChange} required={false} />
                )}

                {config.showCv && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      CV / Resume <span className="text-muted-foreground/60">(Optional — auto-fills your profile)</span>
                    </label>
                    <input ref={cvInputRef} type="file" accept=".pdf" className="hidden" onChange={handleCvSelect} />
                    {cvFile ? (
                      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                        <FileText size={14} className="text-primary shrink-0" />
                        <span className="text-xs font-medium text-primary truncate flex-1">{cvFile.name}</span>
                        <button type="button" onClick={() => { setCvFile(null); if (cvInputRef.current) cvInputRef.current.value = ''; }} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => cvInputRef.current?.click()} className="w-full flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all">
                        <Upload size={14} />
                        <span className="text-xs font-medium">Upload PDF CV (max 4MB)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? 'Creating account...' : <>{config.cta} <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs text-muted-foreground border-t border-border/50 pt-4">
              Already registered?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">Login here</Link>
            </p>
          </motion.div>
        </div>
      </div>
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
