import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  Building2,
  Search,
  Bell,
  LogOut,
  Timer,
  Receipt,
  TrendingUp,
  UserCheck,
  Briefcase,
  Zap,
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
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useUserContext } from "context/UserContext";
import { useThemeOptional } from "contexts/ThemeContext";
import LayoutToggle from "../Global/LayoutToggle";

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
          isActive:
            location.pathname === "/" || location.pathname === "/dashboard",
        },
        {
          title: "Analytics",
          url: "/reports",
          icon: TrendingUp,
          isActive: location.pathname.startsWith("/reports"),
        },
      ],
    },
    {
      title: "Business",
      items: [
        {
          title: "Invoices",
          url: "/invoices",
          icon: Receipt,
          isActive: location.pathname.startsWith("/invoices"),
        },
        {
          title: "Clients",
          url: "/clients",
          icon: Briefcase,
          isActive: location.pathname.startsWith("/clients"),
        },
        {
          title: "Projects",
          url: "/projects",
          icon: Building2,
          isActive: location.pathname.startsWith("/projects"),
        },
      ],
    },
    {
      title: "Productivity",
      items: [
        {
          title: "Time Tracking",
          url: "/time-tracking",
          icon: Timer,
          isActive: location.pathname.startsWith("/time-tracking"),
        },
        {
          title: "Calendar",
          url: "/calendar",
          icon: Calendar,
          isActive: location.pathname.startsWith("/calendar"),
        },
      ],
    },
    ...(isAdminUser
      ? [
          {
            title: "Administration",
            items: [
              {
                title: "Team",
                url: "/team",
                icon: UserCheck,
                isActive: location.pathname.startsWith("/team"),
              },
              {
                title: "Settings",
                url: "/settings",
                icon: Settings,
                isActive: location.pathname.startsWith("/settings"),
              },
            ],
          },
        ]
      : []),
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
            <div className="flex items-center gap-3 px-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
                <Zap className="h-5 w-5" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <div className="text-xl font-bold text-sidebar-foreground">
                  Miru
                </div>
                <div className="text-xs text-sidebar-foreground/60 font-medium">
                  Professional Time Tracking
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {navigationItems.map(group => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(item => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.isActive}
                          tooltip={item.title}
                        >
                          <a
                            href={item.url}
                            onClick={e => {
                              e.preventDefault();
                              navigate(item.url);
                            }}
                          >
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
                      {user?.first_name?.[0]}
                      {user?.last_name?.[0]}
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
                <SidebarMenuButton onClick={handleLogout} tooltip="Sign out">
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
          <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search anything..."
                    className="pl-9 w-80 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LayoutToggle />
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></span>
                </Button>
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-medium text-primary">
                      {user?.first_name?.[0]}
                      {user?.last_name?.[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ModernLayout;
