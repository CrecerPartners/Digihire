import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useTalentProfile } from '../../hooks/useTalentProfile';
import ProfileSetup from './ProfileSetup';
import TalentProfileView from './TalentProfileView';
import MyLearning from './MyLearning';
import TalentHome from './TalentHome';
import GigsPage from './GigsPage';
import JobsPage from './JobsPage';
import EventsPage from './EventsPage';
import MyApplications from './MyApplications';
import Campaigns from '../voltsquad/Campaigns';
import CampaignDetail from '../voltsquad/CampaignDetail';
import MyCampaigns from '../voltsquad/MyCampaigns';
import Marketplace from '../voltsquad/Marketplace';
import WalletPage from '../voltsquad/WalletPage';
import Calculator from '../voltsquad/Calculator';
import Referrals from '../voltsquad/Referrals';
import Sales from '../voltsquad/Sales';
import Leaderboard from '../voltsquad/Leaderboard';
import BuyerOrders from '../voltsquad/BuyerOrders';
import TalentSettings from './TalentSettings';

const SETUP_PROMPTED_KEY = 'dh_setup_prompted';

export default function TalentDashboard() {
  const { profile, loading, setProfile } = useTalentProfile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isOnSetupPage = location.pathname.includes('/setup');

    // Once they reach the setup page, mark as prompted for this session
    if (isOnSetupPage) {
      sessionStorage.setItem(SETUP_PROMPTED_KEY, '1');
      return;
    }

    // Only auto-redirect from the root talent page
    if (location.pathname !== '/talent') return;

    // Don't redirect again if they've already been prompted this session
    if (sessionStorage.getItem(SETUP_PROMPTED_KEY)) return;

    const completion = profile?.profile_completion ?? 0;
    if (completion < 80) {
      navigate('/talent/setup', { replace: true });
    }
  }, [loading, profile?.profile_completion, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  const isOnSetupPage = location.pathname.includes('/setup') || location.pathname.startsWith('/talent/profile');
  const completion = profile?.profile_completion ?? 0;
  const showBanner = !isOnSetupPage && completion < 100 && !!profile;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-0">
        {showBanner && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 mb-4">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Your profile is {completion}% complete
              </p>
              <p className="text-xs text-muted-foreground">
                Complete your profile to get matched with top roles and be visible to brands
              </p>
            </div>
            <button
              onClick={() => navigate('/talent/setup')}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-500 shrink-0 transition-colors"
            >
              Complete Profile <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
        <Routes>
          {/* Talent Hub */}
          <Route path="/" element={<TalentHome />} />
          <Route path="/profile" element={<TalentProfileView profile={profile!} />} />
          <Route path="/profile/setup" element={<ProfileSetup profile={profile} onUpdate={setProfile} />} />
          <Route path="/setup" element={<ProfileSetup profile={profile} onUpdate={setProfile} />} />
          <Route path="/learning" element={<MyLearning />} />
          <Route path="/applications" element={<MyApplications />} />

          {/* Jobs & Gigs */}
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/gigs" element={<GigsPage />} />

          {/* Events */}
          <Route path="/events" element={<EventsPage />} />

          {/* VoltSquad */}
          <Route path="/voltsquad/campaigns" element={<Campaigns />} />
          <Route path="/voltsquad/campaigns/mine" element={<MyCampaigns />} />
          <Route path="/voltsquad/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/voltsquad/marketplace" element={<Marketplace />} />
          <Route path="/voltsquad/wallet" element={<WalletPage />} />
          <Route path="/voltsquad/calculator" element={<Calculator />} />
          <Route path="/voltsquad/referrals" element={<Referrals />} />
          <Route path="/voltsquad/sales" element={<Sales />} />
          <Route path="/voltsquad/leaderboard" element={<Leaderboard />} />
          <Route path="/voltsquad/orders" element={<BuyerOrders />} />
          <Route path="/settings" element={<TalentSettings />} />
        </Routes>
      </div>
    </DashboardLayout>
  );
}
