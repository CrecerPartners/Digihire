import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useTalentProfile } from '../../hooks/useTalentProfile';
import ProfileSetup from './ProfileSetup';
import TalentProfileView from './TalentProfileView';
import MyLearning from './MyLearning';
import TalentHome from './TalentHome';
import GigsPage from './GigsPage';
import JobsPage from './JobsPage';
import EventsPage from './EventsPage';
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

export default function TalentDashboard() {
  const { profile, loading, setProfile } = useTalentProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Routes>
        {/* Talent Hub */}
        <Route path="/" element={<TalentHome />} />
        <Route path="/profile" element={<TalentProfileView profile={profile!} />} />
        <Route path="/profile/setup" element={<ProfileSetup profile={profile} onUpdate={setProfile} />} />
        <Route path="/setup" element={<ProfileSetup profile={profile} onUpdate={setProfile} />} />
        <Route path="/learning" element={<MyLearning />} />

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
    </DashboardLayout>
  );
}
