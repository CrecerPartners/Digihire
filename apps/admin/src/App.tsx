import { Toaster } from "@digihire/shared";
import { Toaster as Sonner } from "@digihire/shared";
import { TooltipProvider } from "@digihire/shared";
import { ThemeProvider } from "@digihire/shared";
import { AuthProvider } from "@digihire/shared";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminProducts from "@/pages/AdminProducts";
import AdminSales from "@/pages/AdminSales";
import AdminPayouts from "@/pages/AdminPayouts";
import AdminTraining from "@/pages/AdminTraining";
import AdminReferrals from "@/pages/AdminReferrals";
import AdminLeaderboard from "@/pages/AdminLeaderboard";
import AdminReviews from "@/pages/AdminReviews";
import AdminVerification from "@/pages/AdminVerification";
import AdminOrders from "@/pages/AdminOrders";
import AdminCampaigns from "@/pages/AdminCampaigns";
import AdminCampaignMemberships from "@/pages/AdminCampaignMemberships";
import AdminCampaignEarnings from "@/pages/AdminCampaignEarnings";
import AdminCampaignForm from "@/pages/AdminCampaignForm";
import AdminTalentPool from "@/pages/AdminTalentPool";
import AdminBrands from "@/pages/AdminBrands";
import AdminRecruitment from "@/pages/AdminRecruitment";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<AdminLogin />} />
                <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/users" element={<AdminUsers />} />
                  <Route path="/products" element={<AdminProducts />} />
                  <Route path="/sales" element={<AdminSales />} />
                  <Route path="/payouts" element={<AdminPayouts />} />
                  <Route path="/training" element={<AdminTraining />} />
                  <Route path="/referrals" element={<AdminReferrals />} />
                  <Route path="/leaderboard" element={<AdminLeaderboard />} />
                  <Route path="/reviews" element={<AdminReviews />} />
                  <Route path="/verification" element={<AdminVerification />} />
                  <Route path="/orders" element={<AdminOrders />} />
                  <Route path="/campaigns" element={<AdminCampaigns />} />
                  <Route path="/campaigns/new" element={<AdminCampaignForm />} />
                  <Route path="/campaigns/:id/edit" element={<AdminCampaignForm />} />
                  <Route path="/campaigns/memberships" element={<AdminCampaignMemberships />} />
                  <Route path="/campaigns/earnings" element={<AdminCampaignEarnings />} />
                  <Route path="/talent-pool" element={<AdminTalentPool />} />
                  <Route path="/brands" element={<AdminBrands />} />
                  <Route path="/recruitment" element={<AdminRecruitment />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}


