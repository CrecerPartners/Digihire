import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { AuthProvider, ThemeProvider, TooltipProvider, ToastNotifier, Toaster as Sonner, CartProvider } from '@digihire/shared';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import TalentDashboard from './pages/talent/TalentDashboard';
import AcademyPage from './pages/academy/AcademyPage';
import CourseDetailPage from './pages/academy/CourseDetailPage';
import TalentTimetable from './pages/academy/TalentTimetable';
import { PublicLayout } from './components/voltsquad/PublicLayout';
import ProductPage from './pages/voltsquad/ProductPage';
import SellerShop from './pages/voltsquad/SellerShop';
import Checkout from './pages/voltsquad/Checkout';
import OrderConfirmation from './pages/voltsquad/OrderConfirmation';

const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: 1000 * 60 * 60 * 24, staleTime: 1000 * 60 * 5 } },
});
const persister = createSyncStoragePersister({ storage: window.localStorage });

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthProvider signOutRedirect="/login">
          <CartProvider>
          <TooltipProvider>
            <ToastNotifier />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/join-now" element={<Navigate to="/signup?module=voltsquad" replace />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/academy" element={<AcademyPage />} />
                <Route path="/academy/course/:id" element={<CourseDetailPage />} />
                <Route path="/academy/timetable" element={<TalentTimetable />} />
                <Route path="/talent/*" element={<ProtectedRoute><TalentDashboard /></ProtectedRoute>} />

                {/* Public VoltSquad routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/product/:slug" element={<ProductPage />} />
                  <Route path="/s/:shopSlug" element={<SellerShop />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation" element={<OrderConfirmation />} />
                </Route>

                <Route path="*" element={<Signup />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
