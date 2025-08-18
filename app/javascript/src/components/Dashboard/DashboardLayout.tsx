import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { List, X } from "phosphor-react";
import Sidebar from "./Sidebar";
import MiruLogoSVG from "../../../images/miru-logo.svg";
import {
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
} from "phosphor-react";

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

  const navigationGroups = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: House },
        { label: "Time Tracking", href: "/time-tracking", icon: Timer },
        { label: "Clients", href: "/clients", icon: UsersThree },
        { label: "Projects", href: "/projects", icon: Briefcase },
        { label: "Team", href: "/team", icon: Users },
        { label: "Invoices", href: "/invoices", icon: Receipt },
        { label: "Payments", href: "/payments", icon: Wallet },
        { label: "Reports", href: "/reports", icon: ChartLine },
        { label: "Expenses", href: "/expenses", icon: CurrencyCircleDollar },
      ],
    },
    {
      title: "Organization",
      items: [
        { label: "Leaves", href: "/settings/leaves", icon: Tree },
        { label: "Company Settings", href: "/settings/organization", icon: Buildings },
        { label: "Payment Settings", href: "/settings/payment", icon: Wallet },
      ],
    },
    {
      title: "Personal Settings",
      items: [
        { label: "Profile", href: "/settings/profile", icon: User },
        { label: "Preferences", href: "/settings/preferences", icon: Gear },
        { label: "Devices", href: "/settings/devices", icon: Buildings },
        { label: "Allocated Leaves", href: "/settings/leaves", icon: Tree },
        { label: "Bank & Tax Info", href: "/settings/bank-info", icon: CurrencyCircleDollar },
      ],
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileOpen && !(event.target as Element).closest(".mobile-sidebar")) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      
      <div
        className={cn(
          "mobile-sidebar fixed inset-y-0 left-0 z-30 w-64 transform transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="bg-white border-r border-gray-200 h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img src={MiruLogoSVG} alt="Miru" className="h-8 w-8" />
              <span className="font-semibold text-gray-900">Miru</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X size={16} weight="light" />
            </button>
          </div>
          <div className="p-4">
            <Sidebar 
              navigationGroups={navigationGroups} 
              isCollapsed={false}
              logo={
                <div className="flex items-center gap-3">
                  <img src={MiruLogoSVG} alt="Miru" className="h-8 w-8" />
                  <span className="font-semibold text-gray-900">Miru</span>
                </div>
              }
            />
          </div>
        </div>
      </div>

      
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-10 lg:block lg:bg-white lg:border-r lg:border-gray-200 transition-all duration-300",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <Sidebar 
          navigationGroups={navigationGroups} 
          isCollapsed={sidebarCollapsed}
          logo={
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center gap-3 w-full hover:bg-gray-50 rounded-lg p-2 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <img src={MiruLogoSVG} alt="Miru" className="h-8 w-8" />
              {!sidebarCollapsed && (
                <div className="text-left">
                  <span className="font-semibold text-gray-900">Miru</span>
                  <div className="text-xs text-gray-500">Time Tracking</div>
                </div>
              )}
            </button>
          }
        />
      </aside>

      
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        
        {/* Mobile menu button - floating */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-20 p-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-md transition-colors"
        >
          <List size={20} weight="light" />
        </button>

        <main className="p-0">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;