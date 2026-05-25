import {
  LayoutDashboard,
  Megaphone,
  Users,
  Zap,
  BarChart3,
  Target,
  Lock,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@digihire/shared";
import { useAuth } from "@digihire/shared";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@digihire/shared";

type ModuleKey = 'voltsquad' | 'recruitment' | 'activations';

const navItems = [
  { label: "Overview", path: "/brand", icon: LayoutDashboard, exact: true, module: null as ModuleKey | null },
  { label: "Campaigns", path: "/brand/campaigns", icon: Megaphone, exact: false, module: 'voltsquad' as ModuleKey },
  { label: "Recruitment", path: "/brand/recruitment", icon: Users, exact: false, module: 'recruitment' as ModuleKey },
  { label: "Activations", path: "/brand/activations", icon: Zap, exact: false, module: 'activations' as ModuleKey },
  { label: "Reports", path: "/brand/reports", icon: BarChart3, exact: false, module: null as ModuleKey | null },
  { label: "Company Profile", path: "/brand/setup", icon: Target, exact: false, module: null as ModuleKey | null },
];

export function BrandSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const activeModules: string[] = (user?.user_metadata?.active_modules as string[] | undefined) ?? [];
  const isModuleActive = (mod: ModuleKey | null) => mod === null || activeModules.includes(mod);

  const isActive = (path: string, exact: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path) && location.pathname !== "/brand";

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
              {navItems.map((item) => {
                const unlocked = isModuleActive(item.module);

                if (!unlocked) {
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        tooltip={`${item.label} (locked — activate from Overview)`}
                        onClick={() => navigate("/brand")}
                        className="opacity-50 cursor-pointer hover:opacity-70 transition-opacity"
                      >
                        <div className="relative">
                          <item.icon className="h-4 w-4" />
                          <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
                        </div>
                        {!collapsed && (
                          <span className="flex items-center gap-1.5">
                            {item.label}
                            <Lock className="h-3 w-3 text-muted-foreground/70" />
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path, item.exact)}
                      tooltip={item.label}
                    >
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
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname.startsWith('/brand/settings')}
              tooltip="Settings"
            >
              <NavLink
                to="/brand/settings"
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
              onClick={handleSignOut}
              tooltip="Sign Out"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
