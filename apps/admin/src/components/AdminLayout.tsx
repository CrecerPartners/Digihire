import { Outlet, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset, Avatar, AvatarFallback } from "@digihire/shared";
import { useIsMobile, useAuth, cn } from "@digihire/shared";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminMobileBottomNav } from "@/components/AdminMobileBottomNav";

export function AdminLayout() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const initials = (user?.user_metadata?.name || user?.email || "?").charAt(0).toUpperCase();

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
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-sm font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
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
