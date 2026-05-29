import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase as _supabase } from '@digihire/shared';
import { motion } from 'motion/react';
import {
  Building2, Mail, Lock, User, Phone, ArrowRight, CheckCircle,
  Zap, Users, TrendingUp, Briefcase, MapPin, Star, Target, BarChart3,
} from 'lucide-react';
import { Button, Input } from '@digihire/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;
const REDIRECT_URL = `${window.location.origin}/verify-email`;

type ServiceKey = 'voltsquad' | 'recruitment' | 'recruitment-fulltime' | 'recruitment-parttime' | 'merchandisers' | 'activations';

const SERVICE_FORM: Record<ServiceKey, { cta: string }> = {
  voltsquad: { cta: 'Start Launching Campaigns' },
  recruitment: { cta: 'Start Hiring Sales Talent' },
  'recruitment-fulltime': { cta: 'Start Hiring Full-Time' },
  'recruitment-parttime': { cta: 'Start Hiring Part-Time' },
  merchandisers: { cta: 'Request Staff Now' },
  activations: { cta: 'Book Activation Teams' },
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

function MobileDivider({ text = 'Fill in your details to get started' }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{text}</span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

function VoltSquadBrandContent() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Zap size={11} /> VoltSquad for Brands
        </span>
        <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          Launch Sales Campaigns<br />on VoltSquad
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg">
          VoltSquad helps brands drive real sales and real user growth through a structured distribution network of sellers across campuses, cities, communities, and digitally connected audiences.
        </p>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg leading-relaxed">
          This is not paid ads. This is working with real people to promote your product, drive signups, bring in users, and generate actual sales.
        </p>
      </div>

      <MobileDivider />

      <div className="hidden lg:block space-y-8">
        <div className="grid grid-cols-3 gap-3">
          {[['1K+', 'active sellers'], ['6+', 'seller categories'], ['Real', 'user growth']].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-secondary/80 border border-border/50 p-4 text-center">
              <div className="text-xl font-bold text-yellow-500">{v}</div>
              <div className="text-xs text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>

        <div>
          <Label>Distribution categories</Label>
          <div className="flex flex-wrap gap-2">
            {['Campus Sellers', 'Corps Members', 'Creators', 'Digital Sellers', 'City-Based Sellers', 'Community Sellers'].map(c => (
              <span key={c} className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 text-xs font-medium px-3 py-1.5 rounded-full">{c}</span>
            ))}
          </div>
        </div>

        <div>
          <Label>Campaign use cases</Label>
          <div className="space-y-2">
            {([
              [Target, 'Drive User Signups', 'Get 1K, 10K, or 50K new users through structured distribution'],
              [BarChart3, 'Boost Downloads', 'Deploy sellers to drive app downloads and product trials'],
              [Zap, 'Product Launches', 'Hit the ground running with sellers ready on day one'],
              [Users, 'Community Sales', 'Reach campuses, cities, and niche communities at scale'],
            ] as const).map(([Icon, label, sub]) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/40">
                <Icon size={14} className="text-yellow-500 mt-0.5 shrink-0" />
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
            <NextStep n={1} text="Register your brand account and verify your email" />
            <NextStep n={2} text="Log in and complete your brand setup" />
            <NextStep n={3} text="Our team will be in touch within 48 hours to activate your campaign" />
            <NextStep n={4} text="Launch and monitor your campaign from the brand dashboard" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HireTalentContent({ service }: { service: ServiceKey }) {
  const isFullTime = service === 'recruitment-fulltime';
  const isPartTime = service === 'recruitment-parttime';
  const isMerchandisers = service === 'merchandisers';

  const headline = isFullTime
    ? 'Hire Full-Time Sales Professionals'
    : isPartTime
    ? 'Hire Part-Time & Contract Sales Talent'
    : isMerchandisers
    ? 'Request Merchandisers & Short-Term Field Staff'
    : 'Hire Sales Talent That Can Close and Drive Revenue';

  const sub = isFullTime
    ? 'Find dedicated, full-time sales talent — SDRs, closers, field reps, and B2B executives — ready to grow your revenue.'
    : isPartTime
    ? 'Scale your sales force with flexible part-time or contract professionals built for campaigns, peaks, and market expansions.'
    : isMerchandisers
    ? 'Get trained merchandisers, in-store promoters, and short-term field staff for retail coverage and on-ground distribution.'
    : 'If you want to hire sales talent who can actually close sales and drive revenue to your business, this is for you.';

  const roles = isMerchandisers
    ? ['In-Store Promoters', 'Merchandisers', 'Shop Floor Workers', 'Field Reps', 'Activation Staff', 'Event Staff']
    : isPartTime
    ? ['Part-Time Sales Reps', 'Contract Closers', 'Campaign-Based SDRs', 'Field Merchandisers', 'Project-Based Talent', 'In-Store Sales Agents']
    : ['Full-Time Sales Executives', 'SDRs & BDRs', 'Tech Sales Professionals', 'Senior Sales & Growth', 'Field Reps', 'B2B Sales Executives'];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Users size={11} /> {isMerchandisers ? 'Field Staff' : 'Sales Recruitment'}
        </span>
        <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          {headline}
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg">{sub}</p>
      </div>

      <MobileDivider />

      <div className="hidden lg:block space-y-8">
        <div>
          <Label>Talent categories</Label>
          <div className="flex flex-wrap gap-2">
            {roles.map(r => (
              <span key={r} className="bg-primary/10 text-primary border border-primary/20 text-xs font-medium px-3 py-1.5 rounded-full">{r}</span>
            ))}
          </div>
        </div>

        <div>
          <Label>Full talent catalogue includes</Label>
          <div className="space-y-2">
            {([
              [TrendingUp, 'Full-Time Sales Executives', 'B2B, enterprise, and field roles'],
              [Users, 'SDRs, BDRs & Senior Sales', 'Outbound, inside sales, and growth professionals'],
              [Briefcase, 'Part-Time & Project-Based', 'Campaign-focused and contract talent'],
              [MapPin, 'Field Staff & Merchandisers', 'Mall, campus, in-store, and field coverage'],
            ] as const).map(([Icon, label, s]) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/40">
                <Icon size={14} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Industries we serve</Label>
          <div className="flex flex-wrap gap-2">
            {['Tech & SaaS', 'Fintech', 'Healthtech', 'Financial Services', 'Telecoms', 'FMCG', 'E-commerce', 'Real Estate'].map(i => (
              <span key={i} className="bg-background border border-border/60 text-muted-foreground text-xs px-3 py-1.5 rounded-full">{i}</span>
            ))}
          </div>
        </div>

        <div>
          <Label>What happens after sign-up</Label>
          <div className="space-y-2.5">
            <NextStep n={1} text="Register your brand account and verify your email" />
            <NextStep n={2} text="Log in to your brand dashboard" />
            <NextStep n={3} text="Our recruitment team reviews your requirements and reaches out" />
            <NextStep n={4} text="Monitor the recruitment process stage by stage from your dashboard" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivationsContent() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Star size={11} /> Activations & Field Marketing
        </span>
        <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          Plan Activations with<br />the Right Field Talent
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg">
          If you're running a sales activation in malls, schools, or any field marketing campaign, and you need promoters, merchandisers, or shop floor staff — this is for you.
        </p>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg leading-relaxed">
          Digihire helps brands deploy qualified people who are ready to work on-ground and support real sales activities.
        </p>
      </div>

      <MobileDivider />

      <div className="hidden lg:block space-y-8">
        <div>
          <Label>Field roles available</Label>
          <div className="flex flex-wrap gap-2">
            {['Promoters', 'Merchandisers', 'Skaters Distributing Flyers', 'In-Store Promoters', 'Field Marketers', 'Shop Floor Staff', 'Activation Staff'].map(r => (
              <span key={r} className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs font-medium px-3 py-1.5 rounded-full">{r}</span>
            ))}
          </div>
        </div>

        <div>
          <Label>Activation types we support</Label>
          <div className="space-y-2">
            {([
              [MapPin, 'Mall Activations', 'In-mall product launches, sampling, and promotional campaigns'],
              [Users, 'Campus Campaigns', 'Student-focused activations across universities and polytechnics'],
              [BarChart3, 'Field Marketing', 'Outdoor and community-based brand campaigns'],
              [Star, 'Product Launches', 'Coordinated activation teams for new product rollouts'],
            ] as const).map(([Icon, label, s]) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/40">
                <Icon size={14} className="text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>What happens after sign-up</Label>
          <div className="space-y-2.5">
            <NextStep n={1} text="Register your brand account and verify your email" />
            <NextStep n={2} text="Log in to your brand dashboard" />
            <NextStep n={3} text="Our activations team reaches out to discuss your brief and timeline" />
            <NextStep n={4} text="Monitor your activation request and updates from your dashboard" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultBrandContent() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Building2 size={11} /> Brand Account
        </span>
        <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
          Elite Sales Talent<br />for Your Brand
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg">
          Create a brand account and access the top 1% of sales talent — and a full suite of field marketing, activation, and distribution services — all in one place.
        </p>
      </div>

      <MobileDivider />

      <div className="hidden lg:block space-y-8">
        <div>
          <Label>What brands can do on Digihire</Label>
          <div className="space-y-2">
            {([
              [Zap, 'Launch VoltSquad Campaigns', 'Drive real user growth and sales through a seller network'],
              [Users, 'Hire Sales Talent', 'Full-time, part-time, and contract sales professionals'],
              [MapPin, 'Request Field Staff', 'Merchandisers and short-term staff for ground-level work'],
              [Star, 'Plan Activations', 'Promoters, activation staff, and field marketing teams'],
            ] as const).map(([Icon, label, s]) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/40">
                <Icon size={14} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>What happens after sign-up</Label>
          <div className="space-y-2.5">
            <NextStep n={1} text="Register your brand account and verify your email" />
            <NextStep n={2} text="Log in and complete your brand setup" />
            <NextStep n={3} text="Access your dashboard and explore available services" />
            <NextStep n={4} text="Our team will be in touch to get you started" />
          </div>
        </div>
      </div>
    </div>
  );
}

function getContent(service: ServiceKey | null) {
  if (service === 'voltsquad') return <VoltSquadBrandContent />;
  if (service === 'activations') return <ActivationsContent />;
  if (service === 'recruitment-fulltime' || service === 'recruitment-parttime' || service === 'recruitment' || service === 'merchandisers') {
    return <HireTalentContent service={service} />;
  }
  return <DefaultBrandContent />;
}

export default function Signup() {
  const [searchParams] = useSearchParams();
  const service = searchParams.get('service') as ServiceKey | null;
  const formConfig = (service && SERVICE_FORM[service]) ? SERVICE_FORM[service] : { cta: 'Create Brand Account' };

  const [formData, setFormData] = useState({ companyName: '', firstName: '', lastName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountExists, setAccountExists] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    setAccountExists(false);
    try {
      const activeModules = service ? [service] : [];
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: REDIRECT_URL,
          data: {
            account_types: ['brand'],
            active_modules: activeModules,
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
            company_name: formData.companyName,
            phone: formData.phoneNumber,
          },
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
      sessionStorage.setItem('pending_verify_email', formData.email);
      if (service) sessionStorage.setItem('pending_service', service);
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
            {getContent(service)}
          </motion.div>
        </div>

        {/* Right: Form */}
        <div className="border-t lg:border-t-0 lg:border-l border-border/50 bg-card px-6 py-10 lg:w-[420px] lg:shrink-0 lg:overflow-y-auto">
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <h2 className="text-lg font-bold text-foreground mb-2">Create your brand account</h2>
            <p className="text-sm text-muted-foreground mb-6">Fill in your details to get started.</p>

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
                <Field label="Company Name" name="companyName" type="text" placeholder="Acme Inc" icon={<Building2 size={14} />} value={formData.companyName} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" name="firstName" type="text" placeholder="John" icon={<User size={14} />} value={formData.firstName} onChange={handleChange} />
                  <Field label="Last Name" name="lastName" type="text" placeholder="Smith" icon={<User size={14} />} value={formData.lastName} onChange={handleChange} />
                </div>
                <Field label="Work Email" name="email" type="email" placeholder="hr@acme.com" icon={<Mail size={14} />} value={formData.email} onChange={handleChange} />
                <Field label="Phone" name="phoneNumber" type="tel" placeholder="+234 800 000 0000" icon={<Phone size={14} />} value={formData.phoneNumber} onChange={handleChange} />
                <Field label="Password" name="password" type="password" placeholder="••••••••" icon={<Lock size={14} />} value={formData.password} onChange={handleChange} />
                <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" icon={<Lock size={14} />} value={formData.confirmPassword} onChange={handleChange} />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? 'Registering...' : <>{formConfig.cta} <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-border/50 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle size={13} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Our team reviews your request within 48 hours</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={13} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Access your dashboard after email verification</p>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">Login here</Link>
            </p>
          </motion.div>
        </div>
      </div>
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
