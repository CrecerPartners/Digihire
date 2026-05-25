import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useBrandProfile } from '../../hooks/useBrandProfile';
import BrandSetup from './BrandSetup';
import BrandHome from './BrandHome';
import CampaignLaunch from './CampaignLaunch';
import CampaignList from './CampaignList';
import CampaignDetail from './CampaignDetail';
import RecruitmentRequest from './RecruitmentRequest';
import RecruitmentDashboard from './RecruitmentDashboard';
import ActivationRequest from './ActivationRequest';
import ActivationList from './ActivationList';
import ActivationDetail from './ActivationDetail';
import Reports from './Reports';
import BrandSettings from './BrandSettings';

export default function BrandDashboard() {
  const { profile, loading } = useBrandProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  const isProfileComplete = !!profile?.industry;

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={isProfileComplete ? <BrandHome /> : <BrandSetup />} />
        <Route path="/setup" element={<BrandSetup />} />
        <Route path="/campaigns" element={<CampaignList />} />
        <Route path="/campaigns/new" element={<CampaignLaunch />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/recruitment" element={<RecruitmentDashboard />} />
        <Route path="/recruitment/new" element={<RecruitmentRequest />} />
        <Route path="/activations" element={<ActivationList />} />
        <Route path="/activations/new" element={<ActivationRequest />} />
        <Route path="/activations/:id" element={<ActivationDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<BrandSettings />} />
      </Routes>
    </DashboardLayout>
  );
}
