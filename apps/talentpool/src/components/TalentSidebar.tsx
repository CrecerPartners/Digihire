import { UserCircle, Settings, GraduationCap, LogOut, CalendarDays, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn, useAuth } from "@digihire/shared";
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
  { label: "My Profile", path: "/talent", icon: UserCircle, exact: true },
  { label: "Settings", path: "/talent/setup", icon: Settings, exact: false },
  { label: "My Learning", path: "/talent/learning", icon: BookOpen, exact: false },
  { label: "Course Catalog", path: "/academy", icon: GraduationCap, exact: true },
  { label: "Live Sessions", path: "/academy/timetable", icon: CalendarDays, exact: false },
];

export function TalentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string, exact: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

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
              {navItems.map((item) => (
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border">
        <SidebarMenu>
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
