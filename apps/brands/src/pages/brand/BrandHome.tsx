import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@digihire/shared';
import { useAuth, supabase as _supabase } from '@digihire/shared';
import {
  Megaphone,
  Users,
  Zap,
  BarChart3,
  Target,
  Briefcase,
  MapPin,
  FileText,
  ChevronRight,
  Lock,
  Unlock,
} from 'lucide-react';
import { useBrandProfile } from '../../hooks/useBrandProfile';
import { useBrandCampaigns } from '../../hooks/useBrandCampaigns';
import { useRecruitmentRequests } from '../../hooks/useRecruitmentRequests';
import { useActivationRequests } from '../../hooks/useActivationRequests';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = _supabase as any;

type ModuleKey = 'voltsquad' | 'recruitment' | 'activations';

const MODULE_CONFIG: Record<ModuleKey, {
  label: string;
  description: string;
  actions: { label: string; icon: React.FC<{ className?: string }>; subtitle: string; path: string }[];
}> = {
  voltsquad: {
    label: 'VoltSquad Campaigns',
    description: 'Deploy sellers to promote your products and track performance live.',
    actions: [
      { label: 'Launch a Campaign', icon: Megaphone, subtitle: 'Deploy sellers to promote your product', path: '/brand/campaigns/new' },
      { label: 'Browse Campaigns', icon: BarChart3, subtitle: 'View and manage all campaigns', path: '/brand/campaigns' },
    ],
  },
  recruitment: {
    label: 'Sales Recruitment',
    description: 'Request pre-vetted sales professionals and manage your hiring pipeline.',
    actions: [
      { label: 'Recruitment Request', icon: Users, subtitle: 'Request pre-vetted sales talent', path: '/brand/recruitment/new' },
      { label: 'Recruitment Pipeline', icon: Briefcase, subtitle: 'Track open requests & candidates', path: '/brand/recruitment' },
    ],
  },
  activations: {
    label: 'Field Activations',
    description: 'Book trained activation staff for on-ground brand activations and field marketing.',
    actions: [
      { label: 'Book an Activation', icon: MapPin, subtitle: 'Request field marketing support', path: '/brand/activations' },
    ],
  },
};

const MODULE_ORDER: ModuleKey[] = ['voltsquad', 'recruitment', 'activations'];

export default function BrandHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useBrandProfile();
  const { campaigns } = useBrandCampaigns();
  const { requests: recruitmentRequests } = useRecruitmentRequests();
  const { requests: activationRequests } = useActivationRequests();
  const [activating, setActivating] = useState<ModuleKey | null>(null);

  const activeModules: string[] = (user?.user_metadata?.active_modules as string[] | undefined) ?? [];
  const isModuleActive = (mod: ModuleKey) => activeModules.includes(mod);

  const handleActivate = async (mod: ModuleKey) => {
    setActivating(mod);
    try {
      await supabase.auth.updateUser({
        data: { active_modules: [...activeModules, mod] },
      });
      // onAuthStateChange fires USER_UPDATED → auth context re-renders
    } finally {
      setActivating(null);
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalCampaigns = campaigns.length;
  const openRecruitment = recruitmentRequests.filter(r => r.status === 'open' || r.status === 'in_review').length;
  const pendingActivations = activationRequests.filter(a => a.status === 'pending').length;

  const stats = [
    { label: 'Active Campaigns', value: String(activeCampaigns), icon: Megaphone },
    { label: 'Total Campaigns', value: String(totalCampaigns), icon: BarChart3 },
    { label: 'Open Recruitment', value: String(openRecruitment), icon: Users },
    { label: 'Pending Activations', value: String(pendingActivations), icon: Zap },
  ];

  const recentCampaigns = campaigns.slice(0, 5);
  const isProfileComplete = !!profile?.industry;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display">
          Welcome back, {profile?.company_name ?? 'Brand'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's a snapshot of your brand activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl md:text-2xl font-bold font-display">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module Sections */}
      <div className="space-y-5">
        <h2 className="text-lg font-semibold font-display">Quick Actions</h2>

        {MODULE_ORDER.map(mod => {
          const config = MODULE_CONFIG[mod];
          const unlocked = isModuleActive(mod);

          return (
            <div key={mod} className="space-y-2">
              <div className="flex items-center gap-2">
                {unlocked
                  ? <Unlock className="h-3.5 w-3.5 text-green-500" />
                  : <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />}
                <span className={`text-xs font-semibold uppercase tracking-wider ${unlocked ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                  {config.label}
                </span>
              </div>

              {unlocked ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {config.actions.map(action => (
                    <Card
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <action.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.subtitle}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-border/40 bg-muted/30">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Lock className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">{config.label} not activated</p>
                        <p className="text-xs text-muted-foreground/70">{config.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      disabled={activating === mod}
                      onClick={() => handleActivate(mod)}
                    >
                      {activating === mod ? 'Activating...' : `Activate`}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}

        {/* Always accessible */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Unlock className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Reports</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <Card
              onClick={() => navigate('/brand/reports')}
              className="border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">View Reports</p>
                  <p className="text-xs text-muted-foreground">Performance & activity insights</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Recent Campaigns + Get Started */}
      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 border-border/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Recent Campaigns</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/brand/campaigns')} className="text-xs">
                View all <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {recentCampaigns.length === 0 && (
                <p className="text-sm text-muted-foreground">No campaigns yet. Launch your first one to get started.</p>
              )}
              {recentCampaigns.map(c => (
                <Link
                  key={c.id}
                  to={`/brand/campaigns/${c.id}`}
                  className="flex items-center justify-between rounded-lg p-3 hover:bg-secondary/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{c.campaign_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/50 bg-primary/5 border-primary/20">
          <CardContent className="p-4 md:p-6 space-y-3 h-full flex flex-col">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Target className="h-4 w-4" />
              {isProfileComplete ? 'Ready to grow' : 'Finish your setup'}
            </div>
            <p className="text-sm text-muted-foreground flex-1">
              {isProfileComplete
                ? 'Your brand profile is live. Launch a campaign, request talent, or book an activation when you\'re ready.'
                : 'Complete your brand profile to unlock campaigns, recruitment, and activations.'}
            </p>
            <Button
              onClick={() => navigate(isProfileComplete ? '/brand/campaigns/new' : '/brand/setup')}
              className="w-full"
              size="sm"
            >
              {isProfileComplete ? 'Launch a Campaign' : 'Complete Profile'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
