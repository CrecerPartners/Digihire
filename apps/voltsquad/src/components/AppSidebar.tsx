import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Users,
  BarChart3,
  Trophy,
  User,
  Calculator,
  GraduationCap,
  ShieldCheck,
  Megaphone,
  Package,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useNavBadges } from "@/hooks/useNavBadges";
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
  { title: "Seller Dashboard", url: "/dashboard", icon: LayoutDashboard, badge: null as string | null },
  { title: "Campaigns", url: "/dashboard/campaigns", icon: Megaphone, badge: null as string | null },
  { title: "Marketplace", url: "/marketplace", icon: ShoppingBag, badge: null as string | null },
  { title: "Wallet", url: "/wallet", icon: Wallet, badge: null as string | null },
  { title: "My Orders", url: "/orders", icon: Package, badge: "orders" as string | null },
  { title: "Calculator", url: "/calculator", icon: Calculator, badge: null as string | null },
  { title: "Sales", url: "/sales", icon: BarChart3, badge: null as string | null },
  { title: "Referrals", url: "/referrals", icon: Users, badge: null as string | null },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy, badge: null as string | null },
  { title: "Training", url: "/training", icon: GraduationCap, badge: null as string | null },
  { title: "Settings", url: "/profile", icon: User, badge: null as string | null },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useAdminRole();
  const badges = useNavBadges();

  const allNavItems = [...navItems];
  if (isAdmin) {
    allNavItems.push({ title: "Admin Panel", url: "https://admin.digihire.io", icon: ShieldCheck, badge: null });
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
              {allNavItems.map((item) => {
                const badgeCount = item.badge ? (badges[item.badge] ?? 0) : 0;
                return (
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
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <span className="flex-1">{item.title}</span>
                          )}
                          {!collapsed && badgeCount > 0 && (
                            <span className="ml-auto h-5 min-w-5 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center px-1">
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </span>
                          )}
                          {collapsed && badgeCount > 0 && (
                            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-destructive" />
                          )}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
