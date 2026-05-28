import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@digihire/shared';
import { supabase as _supabase } from '@digihire/shared';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@digihire/shared';
import {
  UserCircle, Zap, Briefcase, CalendarDays,
  Lock, ArrowRight, BookOpen, GraduationCap,
  Users, Wallet, ShoppingBag, Calculator, FileText,
  CheckCircle2, Loader2,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

type ModuleKey = 'talent_pool' | 'voltsquad' | 'gigs' | 'events';

const MODULE_CONFIG: Record<ModuleKey, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  activateLabel: string;
  actions: { label: string; path: string; icon: React.ReactNode }[];
}> = {
  talent_pool: {
    label: 'Talent Hub',
    description: 'Build your professional profile, upload your CV, and get matched with top roles.',
    icon: <UserCircle size={22} />,
    color: 'text-blue-500',
    activateLabel: 'Activate Talent Hub',
    actions: [
      { label: 'My Profile', path: '/talent/profile', icon: <UserCircle size={14} /> },
      { label: 'Edit Profile', path: '/talent/profile/setup', icon: <BookOpen size={14} /> },
      { label: 'My Applications', path: '/talent/applications', icon: <FileText size={14} /> },
      { label: 'My Learning', path: '/talent/learning', icon: <GraduationCap size={14} /> },
    ],
  },
  voltsquad: {
    label: 'VoltSquad',
    description: 'Join campaigns, sell products, earn commissions, and grow your income.',
    icon: <Zap size={22} />,
    color: 'text-yellow-500',
    activateLabel: 'Join VoltSquad',
    actions: [
      { label: 'Campaigns', path: '/talent/voltsquad/campaigns', icon: <Zap size={14} /> },
      { label: 'Marketplace', path: '/talent/voltsquad/marketplace', icon: <ShoppingBag size={14} /> },
      { label: 'My Wallet', path: '/talent/voltsquad/wallet', icon: <Wallet size={14} /> },
      { label: 'Calculator', path: '/talent/voltsquad/calculator', icon: <Calculator size={14} /> },
    ],
  },
  gigs: {
    label: 'Short-Term Gigs',
    description: 'Find field marketing, merchandising, and event activation opportunities.',
    icon: <Briefcase size={22} />,
    color: 'text-green-500',
    activateLabel: 'Apply for Gigs',
    actions: [
      { label: 'Jobs & Gigs Board', path: '/talent/jobs', icon: <Briefcase size={14} /> },
      { label: 'Gig Preferences', path: '/talent/gigs', icon: <Users size={14} /> },
    ],
  },
  events: {
    label: 'Events',
    description: 'Register for upcoming DigiHire events, webinars, and training sessions.',
    icon: <CalendarDays size={22} />,
    color: 'text-purple-500',
    activateLabel: 'Activate Events',
    actions: [
      { label: 'Upcoming Events', path: '/talent/events', icon: <CalendarDays size={14} /> },
      { label: 'My Registrations', path: '/talent/events', icon: <BookOpen size={14} /> },
    ],
  },
};

const MODULE_ORDER: ModuleKey[] = ['talent_pool', 'voltsquad', 'gigs', 'events'];

// ── VoltSquad registration data shape ─────────────────────
interface VoltSquadReg {
  experience: string;
  categories: string[];
  hours_per_week: string;
  goal: string;
}

const VS_CATEGORIES = ['Tech Gadgets', 'Fashion & Accessories', 'Health & Beauty', 'Food & Beverages', 'Home & Lifestyle', 'Financial Products', 'Telecom Products'];

// ── Gigs registration data shape ──────────────────────────
interface GigsReg {
  gig_types: string[];
  cities: string;
  availability: string;
  has_transport: string;
}

const GIGS_TYPES = ['Field Sales & Canvassing', 'Brand Activations', 'Merchandising', 'Event Staffing', 'Promotions & Sampling', 'Product Demonstrations'];

export default function TalentHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activating, setActivating] = useState<ModuleKey | null>(null);
  const [openModal, setOpenModal] = useState<'voltsquad' | 'gigs' | null>(null);
  const [successMod, setSuccessMod] = useState<ModuleKey | null>(null);

  const activeModules: string[] = (user?.user_metadata?.active_modules as string[] | undefined) ?? [];
  const isActive = (mod: ModuleKey) => activeModules.includes(mod);

  const saveActivation = async (mod: ModuleKey, registrationData: Record<string, unknown> = {}) => {
    const uid = user?.id;
    if (!uid) return;

    // Record in activations table for backend segmentation
    await supabase.from('talent_module_activations').upsert(
      { talent_id: uid, module: mod, registration_data: registrationData },
      { onConflict: 'talent_id,module' }
    );

    // Update user_metadata active_modules
    await supabase.auth.updateUser({
      data: { active_modules: [...activeModules, mod] },
    });
  };

  const handleActivateClick = (mod: ModuleKey) => {
    if (mod === 'voltsquad') { setOpenModal('voltsquad'); return; }
    if (mod === 'gigs')      { setOpenModal('gigs');      return; }
    // Simple direct activation for talent_pool and events
    setActivating(mod);
    saveActivation(mod).finally(() => setActivating(null));
  };

  const handleVoltSquadSubmit = async (data: VoltSquadReg) => {
    setActivating('voltsquad');
    await saveActivation('voltsquad', data as unknown as Record<string, unknown>);
    setActivating(null);
    setOpenModal(null);
    setSuccessMod('voltsquad');
  };

  const handleGigsSubmit = async (data: GigsReg) => {
    setActivating('gigs');
    // Also update talent profile gig preferences
    await supabase.from('talent_profiles').upsert(
      {
        id: user?.id,
        gig_availability: data.availability,
        gig_cities: data.cities.split(',').map((c: string) => c.trim()).filter(Boolean),
      },
      { onConflict: 'id' }
    );
    await saveActivation('gigs', data as unknown as Record<string, unknown>);
    setActivating(null);
    setOpenModal(null);
    setSuccessMod('gigs');
  };

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back, {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your DigiHire dashboard. Activate or explore your modules below.</p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MODULE_ORDER.map((mod) => {
          const cfg = MODULE_CONFIG[mod];
          const active = isActive(mod);
          const justActivated = successMod === mod;
          return active || justActivated
            ? <ActiveModuleCard key={mod} mod={mod} cfg={cfg} onNavigate={navigate} />
            : (
              <LockedModuleCard
                key={mod}
                mod={mod}
                cfg={cfg}
                activating={activating}
                onActivate={handleActivateClick}
              />
            );
        })}
      </div>

      {/* Always-visible quick links */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Learning & Academy</p>
        <div className="flex flex-wrap gap-3">
          <QuickLink label="Course Catalog" path="/academy" icon={<GraduationCap size={14} />} onNavigate={navigate} />
          <QuickLink label="Live Sessions" path="/academy/timetable" icon={<CalendarDays size={14} />} onNavigate={navigate} />
        </div>
      </div>

      {/* VoltSquad registration modal */}
      <Dialog open={openModal === 'voltsquad'} onOpenChange={open => { if (!open) setOpenModal(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                <Zap size={20} />
              </div>
              <div>
                <DialogTitle>Join VoltSquad</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Tell us about yourself so we can match you to the best campaigns</p>
              </div>
            </div>
          </DialogHeader>
          <VoltSquadRegistrationForm onSubmit={handleVoltSquadSubmit} submitting={activating === 'voltsquad'} />
        </DialogContent>
      </Dialog>

      {/* Gigs registration modal */}
      <Dialog open={openModal === 'gigs'} onOpenChange={open => { if (!open) setOpenModal(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <Briefcase size={20} />
              </div>
              <div>
                <DialogTitle>Apply for Short-Term Gigs</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Set your preferences so brands can match you to the right roles</p>
              </div>
            </div>
          </DialogHeader>
          <GigsRegistrationForm onSubmit={handleGigsSubmit} submitting={activating === 'gigs'} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── VoltSquad Registration Form ────────────────────────────
function VoltSquadRegistrationForm({ onSubmit, submitting }: { onSubmit: (d: VoltSquadReg) => void; submitting: boolean }) {
  const [data, setData] = useState<VoltSquadReg>({
    experience: '',
    categories: [],
    hours_per_week: '',
    goal: '',
  });

  const toggleCategory = (cat: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const valid = data.experience && data.categories.length > 0 && data.hours_per_week && data.goal;

  return (
    <div className="space-y-6 pt-2">
      {/* Experience */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Your selling experience</p>
        <div className="space-y-2">
          {[
            { value: 'beginner', label: "I'm new to selling" },
            { value: 'intermediate', label: "I've sold a few times before" },
            { value: 'experienced', label: "I'm an active seller" },
          ].map(opt => (
            <RadioOption key={opt.value} value={opt.value} label={opt.label} selected={data.experience === opt.value} onSelect={v => setData(p => ({ ...p, experience: v }))} />
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Product categories you want to sell <span className="text-muted-foreground font-normal">(select all that apply)</span></p>
        <div className="flex flex-wrap gap-2">
          {VS_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${data.categories.includes(cat) ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600' : 'bg-secondary border-border/50 text-muted-foreground hover:border-border'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Hours */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">How many hours per week can you dedicate?</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'under_5', label: 'Less than 5 hrs/week' },
            { value: '5_10', label: '5–10 hrs/week' },
            { value: '10_20', label: '10–20 hrs/week' },
            { value: '20_plus', label: '20+ hrs/week' },
          ].map(opt => (
            <RadioOption key={opt.value} value={opt.value} label={opt.label} selected={data.hours_per_week === opt.value} onSelect={v => setData(p => ({ ...p, hours_per_week: v }))} />
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Your primary goal</p>
        <div className="space-y-2">
          {[
            { value: 'extra_income', label: 'Earn extra income on the side' },
            { value: 'full_time', label: 'Build a full-time income' },
            { value: 'learn_sales', label: 'Learn and sharpen my sales skills' },
            { value: 'network', label: 'Grow my business network' },
          ].map(opt => (
            <RadioOption key={opt.value} value={opt.value} label={opt.label} selected={data.goal === opt.value} onSelect={v => setData(p => ({ ...p, goal: v }))} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => valid && onSubmit(data)}
        disabled={!valid || submitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-500 text-white px-6 py-3 text-sm font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
        {submitting ? 'Activating…' : 'Join VoltSquad'}
      </button>
    </div>
  );
}

// ── Gigs Registration Form ─────────────────────────────────
function GigsRegistrationForm({ onSubmit, submitting }: { onSubmit: (d: GigsReg) => void; submitting: boolean }) {
  const [data, setData] = useState<GigsReg>({
    gig_types: [],
    cities: '',
    availability: '',
    has_transport: '',
  });

  const toggleGigType = (type: string) => {
    setData(prev => ({
      ...prev,
      gig_types: prev.gig_types.includes(type)
        ? prev.gig_types.filter(t => t !== type)
        : [...prev.gig_types, type],
    }));
  };

  const valid = data.gig_types.length > 0 && data.cities.trim() && data.availability && data.has_transport;

  return (
    <div className="space-y-6 pt-2">
      {/* Gig types */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Types of gig work you're available for <span className="text-muted-foreground font-normal">(select all that apply)</span></p>
        <div className="flex flex-wrap gap-2">
          {GIGS_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => toggleGigType(type)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${data.gig_types.includes(type) ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'bg-secondary border-border/50 text-muted-foreground hover:border-border'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Cities */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Cities you're available in</p>
        <input
          type="text"
          value={data.cities}
          onChange={e => setData(p => ({ ...p, cities: e.target.value }))}
          placeholder="e.g. Lagos, Abuja, Port Harcourt"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">Separate multiple cities with commas</p>
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">When are you available?</p>
        <div className="space-y-2">
          {[
            { value: 'weekdays', label: 'Weekdays only (Mon–Fri)' },
            { value: 'weekends', label: 'Weekends only (Sat–Sun)' },
            { value: 'both', label: 'Both weekdays and weekends' },
            { value: 'flexible', label: 'Flexible — depends on the gig' },
          ].map(opt => (
            <RadioOption key={opt.value} value={opt.value} label={opt.label} selected={data.availability === opt.value} onSelect={v => setData(p => ({ ...p, availability: v }))} />
          ))}
        </div>
      </div>

      {/* Transport */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Do you have reliable transport?</p>
        <div className="space-y-2">
          {[
            { value: 'personal_vehicle', label: 'Yes — I have a personal vehicle' },
            { value: 'public_transport', label: 'I use public transport' },
            { value: 'on_request', label: 'I can arrange transport when needed' },
          ].map(opt => (
            <RadioOption key={opt.value} value={opt.value} label={opt.label} selected={data.has_transport === opt.value} onSelect={v => setData(p => ({ ...p, has_transport: v }))} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => valid && onSubmit(data)}
        disabled={!valid || submitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white px-6 py-3 text-sm font-bold hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        {submitting ? 'Activating…' : 'Activate Gigs'}
      </button>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────
function RadioOption({ value, label, selected, onSelect }: { value: string; label: string; selected: boolean; onSelect: (v: string) => void }) {
  return (
    <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border/50 bg-secondary/30 hover:border-border'}`}>
      <input type="radio" className="accent-primary" checked={selected} onChange={() => onSelect(value)} />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  );
}

function ActiveModuleCard({ mod, cfg, onNavigate }: {
  mod: ModuleKey;
  cfg: typeof MODULE_CONFIG[ModuleKey];
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{cfg.label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{cfg.description}</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 shrink-0">
          Active
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cfg.actions.map((action) => (
          <button
            key={action.path + action.label}
            onClick={() => onNavigate(action.path)}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors text-left"
          >
            <span className="text-muted-foreground">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LockedModuleCard({ mod, cfg, activating, onActivate }: {
  mod: ModuleKey;
  cfg: typeof MODULE_CONFIG[ModuleKey];
  activating: ModuleKey | null;
  onActivate: (mod: ModuleKey) => void;
}) {
  const isActivating = activating === mod;
  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4 opacity-80">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
          <Lock size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{cfg.label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{cfg.description}</p>
        </div>
      </div>
      <button
        onClick={() => onActivate(mod)}
        disabled={isActivating}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/20 text-primary px-4 py-2.5 text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-60"
      >
        {isActivating ? <><Loader2 size={13} className="animate-spin" /> Activating…</> : <>{cfg.activateLabel} <ArrowRight size={13} /></>}
      </button>
    </div>
  );
}

function QuickLink({ label, path, icon, onNavigate }: { label: string; path: string; icon: React.ReactNode; onNavigate: (p: string) => void }) {
  return (
    <button
      onClick={() => onNavigate(path)}
      className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );
}
