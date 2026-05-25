import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@digihire/shared';
import { supabase as _supabase } from '@digihire/shared';
import {
  UserCircle, Zap, Briefcase, CalendarDays,
  Lock, ArrowRight, BookOpen, GraduationCap,
  Users, Wallet, ShoppingBag, Calculator,
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
      { label: 'My Learning', path: '/talent/learning', icon: <GraduationCap size={14} /> },
    ],
  },
  voltsquad: {
    label: 'VoltSquad',
    description: 'Join campaigns, sell products, earn commissions, and grow your income.',
    icon: <Zap size={22} />,
    color: 'text-yellow-500',
    activateLabel: 'Activate VoltSquad',
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
    activateLabel: 'Activate Gigs',
    actions: [
      { label: 'Gig Preferences', path: '/talent/gigs', icon: <Briefcase size={14} /> },
      { label: 'Opportunities', path: '/talent/gigs', icon: <Users size={14} /> },
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

export default function TalentHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activating, setActivating] = useState<ModuleKey | null>(null);

  const activeModules: string[] = (user?.user_metadata?.active_modules as string[] | undefined) ?? [];
  const isActive = (mod: ModuleKey) => activeModules.includes(mod);

  const handleActivate = async (mod: ModuleKey) => {
    setActivating(mod);
    try {
      await supabase.auth.updateUser({
        data: { active_modules: [...activeModules, mod] },
      });
    } finally {
      setActivating(null);
    }
  };

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back, {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your DigiHire talent dashboard. Activate or explore your modules below.</p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MODULE_ORDER.map((mod) => {
          const cfg = MODULE_CONFIG[mod];
          const active = isActive(mod);
          return active
            ? <ActiveModuleCard key={mod} mod={mod} cfg={cfg} onNavigate={navigate} />
            : <LockedModuleCard key={mod} mod={mod} cfg={cfg} activating={activating} onActivate={handleActivate} />;
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
    </div>
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
        {isActivating ? 'Activating...' : <>{cfg.activateLabel} <ArrowRight size={13} /></>}
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
