import { useEffect, useRef } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@digihire/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@digihire/shared";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@digihire/shared";
import { useIsMobile, useAuth } from "@digihire/shared";
import { TalentSidebar } from "@/components/TalentSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Link, useNavigate } from "react-router-dom";
import { Settings, LogOut } from "lucide-react";

// Sign out after 2 hours of no user interaction
const INACTIVITY_MS = 2 * 60 * 60 * 1000;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '';
  const initials = displayName.charAt(0).toUpperCase();
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) || '';
  const dicebearSeed = encodeURIComponent(displayName || 'user');
  const dicebearSrc = `https://api.dicebear.com/7.x/lorelei/svg?seed=${dicebearSeed}`;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => signOut(), INACTIVITY_MS);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await signOut({ skipRedirect: true });
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <TalentSidebar />
      <SidebarInset>
        <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {isMobile ? (
              <Link to="/talent" className="flex items-center">
                <img
                  src="/assets/logo-color.png"
                  alt="DigiHire"
                  className="h-7 w-auto object-contain"
                />
              </Link>
            ) : (
              <SidebarTrigger />
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-foreground">{displayName}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">talent</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                    <AvatarFallback className="bg-transparent p-0 overflow-hidden">
                      <img src={dicebearSrc} alt={displayName} className="h-full w-full rounded-full" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => navigate("/talent/settings")} className="gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
          {children}
        </main>

        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
