import {
  UserCircle, Settings, GraduationCap, LogOut, CalendarDays, BookOpen,
  Zap, Briefcase, ShoppingBag, Wallet, Calculator, Users, Trophy,
  BarChart3, Lock, LayoutDashboard,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { cn, useAuth } from "@digihire/shared";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@digihire/shared";

type ModuleKey = 'talent_pool' | 'voltsquad' | 'gigs' | 'events';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  exact: boolean;
}

const TALENT_HUB_ITEMS: NavItem[] = [
  { label: "My Profile", path: "/talent/profile", icon: UserCircle, exact: true },
  { label: "Edit Profile", path: "/talent/profile/setup", icon: Settings, exact: false },
  { label: "My Learning", path: "/talent/learning", icon: BookOpen, exact: false },
];

const VOLTSQUAD_ITEMS: NavItem[] = [
  { label: "Campaigns", path: "/talent/voltsquad/campaigns", icon: Zap, exact: false },
  { label: "Marketplace", path: "/talent/voltsquad/marketplace", icon: ShoppingBag, exact: false },
  { label: "Wallet", path: "/talent/voltsquad/wallet", icon: Wallet, exact: false },
  { label: "Calculator", path: "/talent/voltsquad/calculator", icon: Calculator, exact: false },
  { label: "Referrals", path: "/talent/voltsquad/referrals", icon: Users, exact: false },
  { label: "Leaderboard", path: "/talent/voltsquad/leaderboard", icon: Trophy, exact: false },
  { label: "Sales", path: "/talent/voltsquad/sales", icon: BarChart3, exact: false },
];

const GIGS_ITEMS: NavItem[] = [
  { label: "Gig Preferences", path: "/talent/gigs", icon: Briefcase, exact: false },
];

const EVENTS_ITEMS: NavItem[] = [
  { label: "Events", path: "/talent/events", icon: CalendarDays, exact: false },
];

const GENERAL_ITEMS: NavItem[] = [
  { label: "Course Catalog", path: "/academy", icon: GraduationCap, exact: true },
  { label: "Live Sessions", path: "/academy/timetable", icon: CalendarDays, exact: false },
];

export function TalentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const activeModules: string[] = (user?.user_metadata?.active_modules as string[] | undefined) ?? [];
  const isModuleActive = (mod: ModuleKey) => activeModules.includes(mod);

  const isActive = (path: string, exact: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton asChild isActive={isActive(item.path, item.exact)} tooltip={item.label}>
          <NavLink
            to={item.path}
            end={item.exact}
            className="hover:bg-sidebar-accent"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="h-4 w-4" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  const renderLockedItem = (label: string, mod: ModuleKey) => (
    <SidebarMenuItem key={`locked-${mod}`}>
      <SidebarMenuButton
        tooltip={`Activate ${label}`}
        onClick={() => navigate('/talent')}
        className="opacity-50 cursor-pointer"
      >
        <Lock className="h-4 w-4" />
        {!collapsed && <span>{label} — Activate</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 overflow-hidden h-8">
          <img
            src="/assets/logo-color.png"
            alt="DigiHire"
            className={cn("h-8 object-contain transition-all duration-300", collapsed ? "w-8 object-left" : "w-auto")}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/talent', true)} tooltip="Overview">
                  <NavLink to="/talent" end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span>Overview</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Talent Hub */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Talent Hub</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {isModuleActive('talent_pool')
                ? renderItems(TALENT_HUB_ITEMS)
                : renderLockedItem('Talent Hub', 'talent_pool')}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* VoltSquad */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>VoltSquad</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {isModuleActive('voltsquad')
                ? renderItems(VOLTSQUAD_ITEMS)
                : renderLockedItem('VoltSquad', 'voltsquad')}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Short-Term Gigs */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Short-Term Gigs</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {isModuleActive('gigs')
                ? renderItems(GIGS_ITEMS)
                : renderLockedItem('Gigs', 'gigs')}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Events */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Events</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {isModuleActive('events')
                ? renderItems(EVENTS_ITEMS)
                : renderLockedItem('Events', 'events')}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* General / Academy */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Academy</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItems(GENERAL_ITEMS)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/talent/settings', false)}
              tooltip="Settings"
            >
              <NavLink
                to="/talent/settings"
                className="hover:bg-sidebar-accent"
                activeClassName="bg-sidebar-accent text-primary font-medium"
              >
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign Out"
              onClick={() => signOut()}
              className="hover:bg-destructive/10 hover:text-destructive w-full cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
