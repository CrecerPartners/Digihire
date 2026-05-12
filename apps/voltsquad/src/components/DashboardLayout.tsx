import { SidebarProvider, SidebarTrigger } from "@digihire/shared";
import { AppSidebar } from "@/components/AppSidebar";
import { LogOut, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@digihire/shared";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@digihire/shared";
import { useIsMobile } from "@digihire/shared";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { NotificationsPopover } from "@/components/NotificationsPopover";

export function DashboardLayout() {
  const { data: profile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();

  const initials = (profile?.name || "?").split(" ").map(n => n[0]).join("").toUpperCase();

  const handleLogout = async () => {
    await signOut({ skipRedirect: true });
    navigate("/login", { replace: true });
  };

  const handleBack = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    segments.pop();
    navigate('/' + (segments.join('/') || 'dashboard'));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar — desktop only */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2">
              {/* Mobile: Volt logo — Desktop: sidebar trigger */}
              {isMobile ? (
                <Link to="/" className="flex items-center">
                  <img
                    src="/assets/logo-color.png"
                    alt="DigiHire"
                    className="h-7 w-auto object-contain"
                  />
                </Link>
              ) : (
                <SidebarTrigger />
              )}
              {location.pathname !== '/dashboard' && (
                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationsPopover />
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/20 text-sm font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              {/* Logout button — desktop only */}
              {!isMobile && (
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div key={location.pathname} className="animate-page-in">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}


