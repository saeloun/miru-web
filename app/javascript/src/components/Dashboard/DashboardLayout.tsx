import React, { useMemo, useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import Sidebar from "./Sidebar";
import MiruLogoSVG from "../../../images/miru-logo.svg";
import {
  List,
  X,
  Timer,
  Receipt,
  UsersThree,
  Briefcase,
  Wallet,
  Users,
  ChartLine,
  Calendar,
  Gear,
  Buildings,
  User,
  House,
  CurrencyCircleDollar,
  Tree,
  SignOut,
} from "phosphor-react";
import { useLocation } from "react-router-dom";
import { useUserContext } from "context/UserContext";
import { logoutApi } from "apis/api";
import ThemeToggle from "../../common/ThemeToggle";
import useThemeMode from "../../common/useThemeMode";
import { hasProAccess } from "../../lib/planAccess";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { companyRole, user, company, avatarUrl } = useUserContext();
  const themeMode = useThemeMode();
  const logoStyle = useMemo(
    () => ({
      filter: themeMode === "dark" ? "brightness(0) invert(1)" : "none",
    }),
    [themeMode]
  );

  const navigationGroups = [
    {
      title: "Main",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: House,
          roles: ["admin", "owner", "book_keeper"],
        },
        {
          label: "Time Tracking",
          href: "/time-tracking",
          icon: Timer,
          roles: ["admin", "owner", "employee"],
        },
        {
          label: "Clients",
          href: "/clients",
          icon: UsersThree,
          roles: ["admin", "owner"],
        },
        {
          label: "Projects",
          href: "/projects",
          icon: Briefcase,
          roles: ["admin", "owner", "employee"],
        },
        {
          label: "Team",
          href: "/team",
          icon: Users,
          roles: ["admin", "owner"],
        },
        {
          label: "Invoices",
          href: "/invoices",
          icon: Receipt,
          roles: ["admin", "owner", "book_keeper", "client"],
        },
        {
          label: "Payments",
          href: "/payments",
          icon: Wallet,
          roles: ["admin", "owner", "book_keeper"],
        },
        {
          label: "Reports",
          href: "/reports",
          icon: ChartLine,
          roles: ["admin", "owner", "book_keeper"],
        },
        {
          label: "Expenses",
          href: "/expenses",
          icon: CurrencyCircleDollar,
          roles: ["admin", "owner", "book_keeper", "employee"],
        },
      ],
    },
    {
      title: "Organization",
      items: [
        {
          label: "Holiday Calendar",
          href: "/settings/holidays",
          icon: Calendar,
          roles: ["admin", "owner"],
        },
        {
          label: "Company Settings",
          href: "/settings/organization",
          icon: Buildings,
          roles: ["admin", "owner"],
        },
        {
          label: "Payment Settings",
          href: "/settings/payment",
          icon: Wallet,
          roles: ["admin", "owner"],
        },
        {
          label: "Billing",
          href: "/settings/billing",
          icon: Wallet,
          roles: ["admin", "owner"],
        },
      ],
    },
    {
      title: "Personal Settings",
      items: [
        { label: "Profile", href: "/settings/profile", icon: User },
        {
          label: "Preferences",
          href: "/settings/preferences",
          icon: Gear,
          roles: ["admin", "owner", "book_keeper", "employee"],
        },
        {
          label: "Devices",
          href: "/settings/devices",
          icon: Buildings,
          roles: ["admin", "owner"],
        },
        {
          label: "My Leaves",
          href: "/settings/leaves",
          icon: Tree,
          roles: ["admin", "owner", "employee"],
        },
        {
          label: "Bank & Tax Info",
          href: "/settings/bank-info",
          icon: CurrencyCircleDollar,
          roles: ["admin", "owner"],
        },
      ],
    },
  ];

  const filterNavigationGroup = group => ({
    ...group,
    items: group.items.filter(
      item =>
        (!item.roles || item.roles.includes(companyRole)) &&
        !(item.href === "/reports" && !hasProAccess(company))
    ),
  });

  // prettier-ignore
  const filteredNavigation = useMemo(() => navigationGroups.map(filterNavigationGroup), [companyRole, company?.pro_access]);

  const pageTitle = useMemo(() => {
    const item = filteredNavigation
      .flatMap(group => group.items)
      .find(navItem => location.pathname.startsWith(navItem.href));

    return item?.label || "Dashboard";
  }, [location.pathname, filteredNavigation]);

  const handleLogout = async () => {
    try {
      await logoutApi();
      window.location.href = "/";
    } catch (error) {
      window.location.href = "/";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileOpen && !(event.target as Element).closest(".mobile-sidebar")) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  // prettier-ignore
  const mobileSidebarClasses = cn("mobile-sidebar fixed inset-y-0 left-0 z-30 w-64 transform transition-transform lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full");
  // prettier-ignore
  const desktopSidebarClasses = cn("hidden transition-all duration-300 lg:fixed lg:inset-y-0 lg:left-0 lg:z-10 lg:block lg:border-r lg:border-border lg:bg-card", sidebarCollapsed ? "lg:w-16" : "lg:w-64");

  return (
    <div
      className={cn("min-h-screen bg-background text-foreground", className)}
    >
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={mobileSidebarClasses}>
        <div className="h-full border-r border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <img
                src={MiruLogoSVG}
                alt="Miru"
                className="h-6 w-6"
                style={logoStyle}
              />
              <span className="font-semibold text-foreground">Miru</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-md p-2 transition-colors hover:bg-accent"
            >
              <X size={16} weight="light" />
            </button>
          </div>
          <div className="p-4">
            <Sidebar
              navigationGroups={filteredNavigation}
              isCollapsed={false}
              logo={
                <div className="flex items-center gap-3">
                  <img
                    src={MiruLogoSVG}
                    alt="Miru"
                    className="h-6 w-6"
                    style={logoStyle}
                  />
                  <span className="font-semibold text-foreground">Miru</span>
                </div>
              }
            />
          </div>
        </div>
      </div>

      <aside className={desktopSidebarClasses}>
        <Sidebar
          navigationGroups={filteredNavigation}
          isCollapsed={sidebarCollapsed}
          logo={
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <img
                src={MiruLogoSVG}
                alt="Miru"
                className="h-6 w-6"
                style={logoStyle}
              />
              {!sidebarCollapsed && (
                <div className="text-left">
                  <span className="font-semibold text-foreground">Miru</span>
                </div>
              )}
            </button>
          }
          user={{
            name:
              `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
              user?.email ||
              "User",
            email: user?.email || "",
            avatar: avatarUrl || user?.avatar_url || "",
          }}
        />
      </aside>

      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-20 rounded-lg border border-border bg-card p-3 shadow-md transition-colors hover:bg-accent lg:hidden"
        >
          <List size={20} weight="light" />
        </button>

        <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground lg:text-xl">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle compact />
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-accent"
              >
                <SignOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 pb-8 pt-4 lg:px-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
