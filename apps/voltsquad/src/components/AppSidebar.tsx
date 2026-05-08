import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Users,
  BarChart3,
  Trophy,
  User,
  Zap,
  Calculator,
  GraduationCap,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { cn } from "@digihire/shared";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@digihire/shared";

const navItems = [
  { title: "Talent Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Marketplace", url: "/marketplace", icon: ShoppingBag },
  { title: "My Orders", url: "/orders", icon: ShoppingBag },
  { title: "Calculator", url: "/calculator", icon: Calculator },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Referrals", url: "/referrals", icon: Users },
  { title: "Campaigns", url: "/dashboard/campaigns", icon: Megaphone },
  { title: "Sales", url: "/sales", icon: BarChart3 },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Training", url: "/training", icon: GraduationCap },
  { title: "Settings", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useAdminRole();

  const allNavItems = [...navItems];
  if (isAdmin) {
    allNavItems.push({ title: "Admin Panel", url: "https://admin.digihire.io", icon: ShieldCheck });
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 overflow-hidden h-8">
          <img 
            src="/assets/logo-color.png" 
            alt="DigiHire" 
            className={cn(
              "h-8 object-contain transition-all duration-300",
              collapsed ? "w-8 object-left" : "w-auto"
            )} 
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={!item.url.startsWith("http") && (location.pathname === item.url || (item.url !== "/dashboard" && location.pathname.startsWith(item.url)))}
                    tooltip={item.title}
                  >
                    {item.url.startsWith("http") ? (
                      <a href={item.url} className="hover:bg-sidebar-accent">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </a>
                    ) : (
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="rounded-lg bg-secondary p-3 text-center">
            <div className="flex items-center justify-center mt-1 scale-90 opacity-80">
              <img src="/assets/logo-color.png" alt="DigiHire" className="h-5 w-auto object-contain" />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}


