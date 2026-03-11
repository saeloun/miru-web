import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  List,
  X,
  CaretRight,
  Clock,
  Users,
  FolderOpen,
  UserPlus,
  FileText,
  BarChart3,
  CreditCard,
  Calendar,
  Receipt,
  Gear,
  SignOut,
  House,
} from "phosphor-react";
import { useUserContext } from "context/UserContext";
import { cn } from "../../lib/utils";
import { Paths } from "constants/index";
// Branding inlined per request
import { logoutApi } from "apis/api";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  allowedRoles: string[];
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: House,
    allowedRoles: ["admin", "employee", "owner", "book_keeper", "client"],
  },
  {
    label: "Time Tracking",
    path: Paths.TIME_TRACKING,
    icon: Clock,
    allowedRoles: ["admin", "employee", "owner"],
  },
  {
    label: "Clients",
    path: Paths.CLIENTS,
    icon: Users,
    allowedRoles: ["admin", "employee", "owner"],
  },
  {
    label: "Projects",
    path: Paths.PROJECTS,
    icon: FolderOpen,
    allowedRoles: ["admin", "employee", "owner"],
  },
  {
    label: "Team",
    path: Paths.TEAM.replace("/*", ""),
    icon: UserPlus,
    allowedRoles: ["admin", "owner"],
  },
  {
    label: "Invoices",
    path: "/invoices",
    icon: FileText,
    allowedRoles: ["admin", "owner", "book_keeper", "client"],
  },
  {
    label: "Reports",
    path: Paths.REPORTS,
    icon: BarChart3,
    allowedRoles: ["admin", "owner", "book_keeper"],
  },
  {
    label: "Payments",
    path: Paths.PAYMENTS,
    icon: CreditCard,
    allowedRoles: ["admin", "owner", "book_keeper"],
  },
  {
    label: "Leaves & Holidays",
    path: Paths.Leave_Management,
    icon: Calendar,
    allowedRoles: ["admin", "owner", "employee"],
  },
  {
    label: "Expenses",
    path: Paths.EXPENSES,
    icon: Receipt,
    allowedRoles: ["admin", "owner", "book_keeper"],
  },
];

export const ModernNavbar: React.FC = () => {
  const { user, companyRole, isDesktop: contextIsDesktop } = useUserContext();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isDesktop]);

  const filteredNavItems = navigationItems.filter(item =>
    item.allowedRoles.includes(companyRole || "")
  );

  const handleLogout = async () => {
    try {
      await logoutApi();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const NavContent = () => (
    <>
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img
            src="/assets/miru-logo.svg"
            alt="Miru"
            className="h-8 w-auto dark:invert"
          />
          <span className="text-xl font-bold text-foreground">Miru</span>
        </div>
        {!isDesktop && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors lg:hidden"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                    "hover:bg-muted hover:text-primary",
                    isActive && [
                      "bg-accent/60",
                      "text-primary",
                      "font-medium",
                      "border-l-4 border-primary",
                      "-ml-4 pl-7",
                    ]
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{item.label}</span>
                  {isActive && <CaretRight className="h-4 w-4 ml-auto" />}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* User Section */}
      <div className="border-t border-border p-4 space-y-2">
        <NavLink
          to={Paths.SETTINGS.replace("/*", "/profile")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
        >
          <Gear className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground">Settings</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <SignOut className="h-5 w-5" />
          <span className="text-sm">Logout</span>
        </button>
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mt-4 bg-background rounded-lg">
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile List Button */}
      {!isDesktop && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-background rounded-lg shadow-md hover:shadow-lg transition-shadow lg:hidden"
        >
          <List className="h-6 w-6 text-foreground" />
        </button>
      )}
      {/* Desktop Sidebar */}
      {isDesktop && (
        <aside className="fixed top-0 left-0 h-full w-64 bg-background border-r border-border shadow-sm flex flex-col">
          <NavContent />
        </aside>
      )}
      {/* Mobile Sidebar */}
      {!isDesktop && (
        <>
          {/* Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-foreground/45 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          {/* Sidebar */}
          <aside
            className={cn(
              "fixed top-0 left-0 h-full w-72 bg-background shadow-2xl z-50 flex flex-col transition-transform duration-300 lg:hidden",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <NavContent />
          </aside>
        </>
      )}
      {/* Mobile Bottom Navigation Bar */}
      {!isDesktop && (
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-30 lg:hidden">
          <div className="flex justify-around items-center h-16 px-2">
            {filteredNavItems.slice(0, 4).map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-lg flex-1",
                    "hover:bg-background",
                    isActive && "text-primary"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      isActive ? "font-medium" : "font-normal"
                    )}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg flex-1 hover:bg-background"
            >
              <List className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs">More</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};

export default ModernNavbar;
