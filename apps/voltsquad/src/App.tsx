import { Toaster } from "@digihire/shared";
import { Toaster as Sonner } from "@digihire/shared";
import { TooltipProvider } from "@digihire/shared";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@digihire/shared";
import { AuthProvider } from "@digihire/shared";
import { supabase } from "@digihire/shared";
import { CartProvider } from "@digihire/shared";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";
import { Network } from "@capacitor/network";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PublicProductLayout } from "@/components/PublicProductLayout";
import { MobileOnboarding } from "@/components/native/MobileOnboarding";
import { NativeSplash } from "@/components/native/NativeSplash";
import LandingPage from "@/pages/former/LandingPage";
import AboutStudents from "@/pages/AboutStudents";
import AboutBrands from "@/pages/AboutBrands";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Marketplace from "@/pages/Marketplace";
import ProductPage from "@/pages/ProductPage";
import WalletPage from "@/pages/WalletPage";
import Calculator from "@/pages/Calculator";
import Referrals from "@/pages/Referrals";
import Sales from "@/pages/Sales";
import Leaderboard from "@/pages/Leaderboard";
import Training from "@/pages/Training";
import TrainingCourse from "@/pages/TrainingCourse";
import Profile from "@/pages/Profile";
import SellerShop from "@/pages/SellerShop";
import NotFound from "@/pages/NotFound";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import BuyerOrders from "@/pages/BuyerOrders";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import MyCampaigns from "@/pages/MyCampaigns";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const NativeBlockRoute = ({ children }: { children: React.ReactNode }) => {
  const isNative = Capacitor.isNativePlatform();
  if (isNative) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const LANDING_URL = (import.meta.env.VITE_LANDING_URL ?? 'https://digihire.io').replace(/\/$/, '');

const StaticRedirect = ({ to }: { to: string }) => {
  useEffect(() => {
    window.location.replace(`${LANDING_URL}${to}`);
  }, [to]);
  return null;
};

const NetworkStatusBanner = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let handler: { remove: () => void } | undefined;

    const setup = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);
      handler = await Network.addListener('networkStatusChange', status => {
        setIsOffline(!status.connected);
      });
    };
    setup();
    return () => { 
      if (handler) handler.remove(); 
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-destructive text-destructive-foreground py-1 px-4 text-xs font-medium text-center z-[110] animate-in slide-in-from-top pointer-events-none">
      No Internet Connection. Using cached data.
    </div>
  );
};

const App = () => {
  const isNative = Capacitor.isNativePlatform();
  const [splashVisible, setSplashVisible] = useState(isNative);
  useNativeAuthCallback();

  useEffect(() => {
    if (isNative) {
      SplashScreen.hide();
      
      // Native App Polish
      const configureNative = async () => {
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          if (Capacitor.getPlatform() === 'ios') {
            await Keyboard.setAccessoryBarVisible({ isVisible: true });
          }

          // Handle Android Back Button
          CapApp.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
              CapApp.exitApp();
            } else {
              window.history.back();
            }
          });
        } catch (e) {
          console.warn("Native plugin config skipped (likely web testing)");
        }
      };
      
      configureNative();
    }
  }, [isNative]);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {isNative && splashVisible && <NativeSplash onComplete={() => setSplashVisible(false)} />}
      <NetworkStatusBanner />
      <AuthProvider>
      <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={isNative ? <MobileOnboarding /> : <Navigate to="/login" replace />} />
          <Route path="/former-landing" element={<LandingPage />} />
          <Route path="/blog" element={<StaticRedirect to="/blog" />} />
          <Route path="/about" element={<StaticRedirect to="/about" />} />
          <Route path="/contact" element={<StaticRedirect to="/contact" />} />
          <Route path="/events" element={<StaticRedirect to="/events" />} />
          <Route path="/voltsquad" element={<StaticRedirect to="/voltsquad" />} />
          <Route path="/digihire/blog" element={<StaticRedirect to="/blog" />} />
          <Route path="/digihire/about" element={<StaticRedirect to="/about" />} />
          <Route path="/digihire/contact" element={<StaticRedirect to="/contact" />} />
          <Route path="/digihire/events" element={<StaticRedirect to="/events" />} />
          <Route path="/about/sellers" element={<NativeBlockRoute><AboutStudents /></NativeBlockRoute>} />
          <Route path="/about/students" element={<Navigate to="/about/sellers" replace />} />
          <Route path="/about/brands" element={<NativeBlockRoute><AboutBrands /></NativeBlockRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/join-now" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<PublicProductLayout />}>
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/s/:shopSlug" element={<SellerShop />} />
          </Route>
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/training" element={<Training />} />
            <Route path="/training/:courseId" element={<TrainingCourse />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<BuyerOrders />} />
            <Route path="/dashboard/campaigns" element={<Campaigns />} />
            <Route path="/dashboard/campaigns/mine" element={<MyCampaigns />} />
            <Route path="/dashboard/campaigns/:id" element={<CampaignDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </CartProvider>
    </AuthProvider>
    </ThemeProvider>
    </PersistQueryClientProvider>
  );
};

const useNativeAuthCallback = () => {
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    let handler: { remove: () => void } | undefined;

    const setupListener = async () => {
      handler = await CapApp.addListener('appUrlOpen', async (data: { url: string }) => {
        // Handle the deep link
        const parsedUrl = new URL(data.url);

        // Validate deep-link origin to prevent forged deep links
        const allowedHosts = ["digihire.io", "voltsquad.app", "supabase.co", "localhost"];
        if (!allowedHosts.some(h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith("." + h))) {
          return; // reject forged deep links
        }

        // Check if it's a Supabase callback
        if (parsedUrl.hash && parsedUrl.hash.includes('access_token')) {
          const hash = parsedUrl.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              window.location.href = '/login';
              return;
            }
            window.location.href = '/dashboard';
          }
        }
      });
    };

    setupListener();

    return () => {
      if (handler) {
        handler.remove();
      }
    };
  }, [isNative]);
};

export default App;


