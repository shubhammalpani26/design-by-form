import { Home, Package, TrendingUp, User, Settings, PlusCircle, Sparkles, BarChart3 } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/creator/dashboard", icon: Home },
  { title: "My Designs", url: "/creator/designs", icon: Package },
  { title: "Create New", url: "/design-studio", icon: PlusCircle },
  { title: "Success Kit", url: "/creator/success-kit", icon: Sparkles },
  { title: "Earnings", url: "/creator/earnings", icon: TrendingUp },
  { title: "Analytics", url: "/creator/analytics", icon: BarChart3 },
  { title: "Profile", url: "/creator/profile", icon: User },
  { title: "Settings", url: "/creator/settings", icon: Settings },
];

export function CreatorSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "text-xs" : ""}>
            {collapsed ? "Menu" : "Creator Portal"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}