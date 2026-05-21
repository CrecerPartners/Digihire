import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@digihire/shared';
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
} from 'lucide-react';
import { useBrandProfile } from '../../hooks/useBrandProfile';
import { useBrandCampaigns } from '../../hooks/useBrandCampaigns';
import { useRecruitmentRequests } from '../../hooks/useRecruitmentRequests';
import { useActivationRequests } from '../../hooks/useActivationRequests';

export default function BrandHome() {
  const navigate = useNavigate();
  const { profile } = useBrandProfile();
  const { campaigns } = useBrandCampaigns();
  const { requests: recruitmentRequests } = useRecruitmentRequests();
  const { requests: activationRequests } = useActivationRequests();

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

  const quickActions = [
    { label: 'Launch a Campaign', icon: Megaphone, subtitle: 'Deploy sellers to promote your product', onClick: () => navigate('/brand/campaigns/new') },
    { label: 'Browse Campaigns', icon: BarChart3, subtitle: 'View and manage all campaigns', onClick: () => navigate('/brand/campaigns') },
    { label: 'Recruitment Request', icon: Users, subtitle: 'Request pre-vetted sales talent', onClick: () => navigate('/brand/recruitment/new') },
    { label: 'Recruitment Pipeline', icon: Briefcase, subtitle: 'Track open requests & candidates', onClick: () => navigate('/brand/recruitment') },
    { label: 'Book an Activation', icon: MapPin, subtitle: 'Request field marketing support', onClick: () => navigate('/brand/activations') },
    { label: 'View Reports', icon: FileText, subtitle: 'Performance & activity insights', onClick: () => navigate('/brand/reports') },
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold font-display mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {quickActions.map(action => (
            <Card
              key={action.label}
              onClick={action.onClick}
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
                    <p className="truncate font-medium text-sm">{c.title}</p>
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
                ? 'Your brand profile is live. Launch a campaign, request talent, or book an activation when you’re ready.'
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
