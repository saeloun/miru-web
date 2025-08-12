import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  FolderOpen,
  FileText,
  BarChart3,
  CreditCard,
  Calendar,
  Receipt,
  Settings,
  LogOut,
  Building2,
  Menu,
} from "lucide-react";

import { Paths, Roles } from "constants/index";
import { useUserContext } from "context/UserContext";
import { MiruLogoSVG } from "miruIcons";
import WorkspaceApi from "apis/workspaces";
import { handleLogout } from "./utils";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  allowedRoles: string[];
  badge?: string | number;
}

const ModernSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);

  const location = useLocation();
  const { user, companyRole, avatarUrl } = useUserContext();

  const navItems: NavItem[] = [
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Time Tracking",
      path: Paths.TIME_TRACKING,
      allowedRoles: ["admin", "employee", "owner"],
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Clients",
      path: Paths.CLIENTS,
      allowedRoles: ["admin", "employee", "owner"],
    },
    {
      icon: <FolderOpen className="h-5 w-5" />,
      label: "Projects",
      path: Paths.PROJECTS,
      allowedRoles: ["admin", "employee", "owner"],
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Team",
      path: Paths.TEAMS,
      allowedRoles: ["admin", "owner"],
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Invoices",
      path: "/invoices",
      allowedRoles: ["admin", "owner", "book_keeper", "client"],
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Reports",
      path: Paths.REPORTS,
      allowedRoles: ["admin", "owner", "book_keeper"],
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Payments",
      path: Paths.PAYMENTS,
      allowedRoles: ["admin", "owner", "book_keeper"],
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Leaves & Holidays",
      path: Paths.Leave_Management,
      allowedRoles: ["admin", "owner", "employee"],
    },
    {
      icon: <Receipt className="h-5 w-5" />,
      label: "Expenses",
      path: Paths.EXPENSES,
      allowedRoles: ["admin", "owner", "book_keeper"],
    },
  ];

  useEffect(() => {
    // Only fetch workspaces if user is authenticated with a token
    const authToken = localStorage.getItem("authToken");
    if (user && authToken) {
      fetchWorkspaces();
    }
  }, [user]);

  const fetchWorkspaces = async () => {
    try {
      const res = await WorkspaceApi.get();
      const { workspaces } = res.data;
      setWorkspaces(workspaces);
      const current = workspaces.find(w => w.id === user?.current_workspace_id);
      if (current) {
        setCurrentWorkspace(current);
      }
    } catch (error) {
      // Only log error if it's not a 401 (which is expected when not authenticated)
      if (error.response?.status !== 401) {
        console.error("Failed to fetch workspaces:", error);
      }
    }
  };

  const handleWorkspaceSwitch = async (workspaceId: number) => {
    try {
      await WorkspaceApi.update(workspaceId);
      window.location.reload();
    } catch (error) {
      console.error("Failed to switch workspace:", error);
    }
  };

  const getRootPath = () => {
    if (!user) return Paths.SIGN_IN;

    switch (companyRole) {
      case Roles.BOOK_KEEPER:
        return Paths.PAYMENTS;
      case Roles.OWNER:
      case Roles.CLIENT:
        return "/invoices";
      default:
        return Paths.TIME_TRACKING;
    }
  };

  const filteredNavItems = navItems.filter(item =>
    item.allowedRoles.includes(companyRole)
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const SidebarContent = () => (
    <>
      {/* Logo Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link className="flex items-center gap-2" to={getRootPath()}>
          <img
            alt="Miru"
            src={MiruLogoSVG}
            className={cn(
              "transition-all",
              isCollapsed ? "h-8 w-8" : "h-10 w-10"
            )}
          />
          {!isCollapsed && <span className="text-xl font-bold">Miru</span>}
        </Link>
        <Button
          className="hidden lg:flex"
          size="icon"
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <Button
          className="lg:hidden"
          size="icon"
          variant="ghost"
          onClick={() => setIsMobileOpen(false)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {filteredNavItems.map(item => {
            const isActive = location.pathname === item.path;

            return (
              <TooltipProvider key={item.path}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-primary/10 text-primary",
                        isCollapsed && "justify-center"
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {item.icon}
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </ScrollArea>
      {/* Bottom Section */}
      <div className="border-t p-2 space-y-2">
        {/* Settings Link */}
        <NavLink
          to="/settings/profile"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            location.pathname.startsWith("/settings") &&
              "bg-primary/10 text-primary",
            isCollapsed && "justify-center"
          )}
          onClick={() => setIsMobileOpen(false)}
        >
          <Settings className="h-5 w-5" />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
        {/* Workspace Switcher */}
        {workspaces.length > 1 && currentWorkspace && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 px-3",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Building2 className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate text-sm">
                    {currentWorkspace.name}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map(workspace => (
                <DropdownMenuItem
                  className="cursor-pointer"
                  key={workspace.id}
                  onClick={() => handleWorkspaceSwitch(workspace.id)}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>{workspace.name}</span>
                  {workspace.id === currentWorkspace.id && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Current
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id="userDropdownTrigger"
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 px-3 py-2 h-auto",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>
                  {user && getInitials(`${user.first_name} ${user.last_name}`)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && user && (
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link className="cursor-pointer" to="/settings/profile">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              id="logoutBtn"
              onClick={() => handleLogout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        className="fixed top-4 left-4 z-40 lg:hidden"
        size="icon"
        variant="outline"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed top-0 left-0 z-30 h-full flex-col border-r bg-background transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-background lg:hidden">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
};

export default ModernSidebar;
