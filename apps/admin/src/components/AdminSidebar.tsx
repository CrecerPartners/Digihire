import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Wallet,
  GraduationCap,
  Star,
  ShieldCheck,
  ClipboardList,
  Megaphone,
  UserCheck,
  BadgeDollarSign,
  UserSearch,
  Building2,
  ClipboardCheck,
  Wifi,
  Zap,
  CalendarDays,
  Briefcase,
  MessageSquare,
  Settings,
  BookOpen,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@digihire/shared";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@digihire/shared";

const navGroups = [
  {
    label: "Platform",
    items: [
      { label: "Overview", path: "/", icon: LayoutDashboard },
      { label: "Blog CMS", path: "/blog", icon: BookOpen },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
  },
  {
    label: "Brands",
    items: [
      { label: "Brands", path: "/brands", icon: Building2 },
      { label: "Brand Campaigns", path: "/brand-campaigns", icon: Megaphone },
      { label: "Recruitment", path: "/recruitment", icon: ClipboardCheck },
      { label: "Activations", path: "/activations", icon: Zap },
      { label: "Communication", path: "/communication", icon: MessageSquare },
    ],
  },
  {
    label: "Talent",
    items: [
      { label: "Talent Pool", path: "/talent-pool", icon: UserSearch },
      { label: "VoltSquad", path: "/volt-squad", icon: Briefcase },
      { label: "Gigs", path: "/gigs", icon: ClipboardList },
      { label: "Events", path: "/events", icon: CalendarDays },
      { label: "Talent Academy", path: "/talent-academy", icon: GraduationCap },
      { label: "Webinars", path: "/webinars", icon: Wifi },
    ],
  },
  {
    label: "VoltSquad Commerce",
    items: [
      { label: "Users", path: "/users", icon: Users },
      { label: "Products", path: "/products", icon: Package },
      { label: "Sales", path: "/sales", icon: ShoppingCart },
      { label: "Orders", path: "/orders", icon: ClipboardList },
      { label: "Payouts", path: "/payouts", icon: Wallet },
      { label: "Reviews", path: "/reviews", icon: Star },
      { label: "Verification", path: "/verification", icon: ShieldCheck },
      { label: "Training", path: "/training", icon: GraduationCap },
      { label: "Referrals", path: "/referrals", icon: Users },
      { label: "Leaderboard", path: "/leaderboard", icon: LayoutDashboard },
      { label: "Campaigns", path: "/campaigns", icon: Megaphone },
      { label: "Memberships", path: "/campaigns/memberships", icon: UserCheck },
      { label: "Earnings", path: "/campaigns/earnings", icon: BadgeDollarSign },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 overflow-hidden h-8">
          <img
            src={`${import.meta.env.BASE_URL}assets/logo-color.png`}
            alt="DigiHire"
            className={cn(
              "h-8 object-contain transition-all duration-300",
              collapsed ? "w-8 object-left" : "w-auto"
            )}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map(group => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 pb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                    >
                      <NavLink
                        to={item.path}
                        end={item.path === "/"}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
