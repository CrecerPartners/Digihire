import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useTalentProfile } from '../../hooks/useTalentProfile';
import ProfileSetup from './ProfileSetup';
import TalentProfileView from './TalentProfileView';
import MyLearning from './MyLearning';

export default function TalentDashboard() {
  const { profile, loading, setProfile } = useTalentProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">
        Loading Profile...
      </div>
    );
  }

  const isProfileComplete = profile?.status !== 'incomplete';

  return (
    <DashboardLayout>
      <Routes>
        <Route
          path="/"
          element={isProfileComplete ? <TalentProfileView profile={profile!} /> : <Navigate to="/talent/setup" />}
        />
        <Route path="/setup" element={<ProfileSetup profile={profile} onUpdate={setProfile} />} />
        <Route path="/learning" element={<MyLearning />} />
      </Routes>
    </DashboardLayout>
  );
}
