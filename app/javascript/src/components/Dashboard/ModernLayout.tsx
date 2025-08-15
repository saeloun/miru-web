import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Clock,
  Settings,
  BarChart3,
  DollarSign,
  Building2,
  Menu,
  Search,
  Bell,
  User,
  LogOut,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "../ui/sidebar";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useUserContext } from "context/UserContext";
import { useThemeOptional } from "contexts/ThemeContext";

interface ModernLayoutProps {
  children: React.ReactNode;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdminUser } = useUserContext();
  const themeContext = useThemeOptional();
  const effectiveTheme = themeContext?.effectiveTheme || "light";

  // Navigation items
  const navigationItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: LayoutDashboard,
          isActive: location.pathname === "/" || location.pathname === "/dashboard",
        },
        {
          title: "Analytics",
          url: "/reports",
          icon: BarChart3,
          isActive: location.pathname.startsWith("/reports"),
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Invoices",
          url: "/invoices",
          icon: FileText,
          isActive: location.pathname.startsWith("/invoices"),
        },
        {
          title: "Clients",
          url: "/clients",
          icon: Users,
          isActive: location.pathname.startsWith("/clients"),
        },
        {
          title: "Projects",
          url: "/projects",
          icon: Building2,
          isActive: location.pathname.startsWith("/projects"),
        },
        {
          title: "Time Tracking",
          url: "/time-tracking",
          icon: Clock,
          isActive: location.pathname.startsWith("/time-tracking"),
        },
      ],
    },
    ...(isAdminUser ? [{
      title: "Administration",
      items: [
        {
          title: "Team",
          url: "/team",
          icon: Users,
          isActive: location.pathname.startsWith("/team"),
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
          isActive: location.pathname.startsWith("/settings"),
        },
      ],
    }] : []),
  ];

  const handleLogout = async () => {
    try {
      await fetch("/internal_api/v1/users/logout", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/";
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <div className="text-lg font-semibold text-sidebar-foreground">Miru</div>
                <div className="text-xs text-sidebar-foreground/70">Time Tracking</div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {navigationItems.map((group) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.isActive}
                          tooltip={item.title}
                        >
                          <a href={item.url} onClick={(e) => {
                            e.preventDefault();
                            navigate(item.url);
                          }}>
                            <item.icon />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-2 px-2 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                    <span className="text-xs font-medium">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden">
                    <div className="text-sm font-medium text-sidebar-foreground">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-xs text-sidebar-foreground/70">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  tooltip="Sign out"
                >
                  <LogOut />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main content */}
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="w-64 border-0 bg-transparent focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ModernLayout;