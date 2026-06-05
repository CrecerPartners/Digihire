import { Outlet, Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@digihire/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@digihire/shared";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@digihire/shared";
import { useIsMobile, useAuth, cn } from "@digihire/shared";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminMobileBottomNav } from "@/components/AdminMobileBottomNav";
import { Settings, LogOut } from "lucide-react";

export function AdminLayout() {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.user_metadata?.name || user?.email || "?").charAt(0).toUpperCase();
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) || '';
  const dicebearSeed = encodeURIComponent(user?.user_metadata?.name || user?.email || 'admin');
  const dicebearSrc = `https://api.dicebear.com/7.x/lorelei/svg?seed=${dicebearSeed}`;

  const handleSignOut = async () => {
    await signOut({ skipRedirect: true });
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {isMobile ? (
              <Link to="/" className="flex items-center">
                <img
                  src={`${import.meta.env.BASE_URL}assets/logo-color.png`}
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
              <span className="text-xs font-normal text-foreground">
                {user?.user_metadata?.name || user?.email}
              </span>
              <span className="text-[10px] text-muted-foreground font-normal uppercase tracking-widest">admin</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={user?.user_metadata?.name || "admin"} />}
                    <AvatarFallback className="bg-transparent p-0 overflow-hidden">
                      <img src={dicebearSrc} alt={user?.user_metadata?.name || "admin"} className="h-full w-full rounded-full" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer">
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

        <main className={cn("flex-1 p-4 md:p-6 overflow-auto", isMobile && "pb-20")}>
          <Outlet />
        </main>

        <AdminMobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
