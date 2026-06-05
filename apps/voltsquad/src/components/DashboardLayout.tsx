import { SidebarProvider, SidebarTrigger } from "@digihire/shared";
import { AppSidebar } from "@/components/AppSidebar";
import { ArrowLeft, Settings, LogOut } from "lucide-react";
import { Button } from "@digihire/shared";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@digihire/shared";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@digihire/shared";
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
  const avatarUrl = profile?.avatar_url || '';
  const dicebearSeed = encodeURIComponent(profile?.name || 'user');
  const dicebearSrc = `https://api.dicebear.com/7.x/lorelei/svg?seed=${dicebearSeed}`;

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
                <Link to="/dashboard" className="flex items-center">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.name} />}
                      <AvatarFallback className="bg-transparent p-0 overflow-hidden">
                        <img src={dicebearSrc} alt={profile?.name || 'user'} className="h-full w-full rounded-full" />
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Profile & Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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


