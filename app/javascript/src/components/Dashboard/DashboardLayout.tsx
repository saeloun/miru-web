import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { useTheme } from "contexts/ThemeContext";
import { Menu, X } from "lucide-react";

interface DashboardLayoutProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  sidebar,
  header,
  children,
  className,
  sidebarCollapsed: controlledCollapsed,
  onSidebarToggle,
}) => {
  const { layoutMode } = useTheme();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const sidebarCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = (collapsed: boolean) => {
    if (onSidebarToggle) {
      onSidebarToggle(collapsed);
    } else {
      setInternalCollapsed(collapsed);
    }
  };

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileOpen && !(event.target as Element).closest(".mobile-sidebar")) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  // Only render admin layout if layout mode is admin
  if (layoutMode !== "admin") {
    return <>{children}</>;
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      {sidebar && (
        <div
          className={cn(
            "mobile-sidebar fixed inset-y-0 left-0 z-30 w-64 transform transition-transform lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="bg-card border-r border-border h-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="font-semibold text-foreground">Menu</div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">{sidebar}</div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {sidebar && (
        <aside
          className={cn(
            "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-10 lg:block lg:bg-card lg:border-r lg:border-border transition-all duration-300",
            sidebarCollapsed ? "lg:w-16" : "lg:w-64"
          )}
        >
          {sidebar}
        </aside>
      )}

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebar ? (sidebarCollapsed ? "lg:ml-16" : "lg:ml-64") : ""
        )}
      >
        {/* Header */}
        {header && (
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex items-center gap-4 p-4">
              {/* Mobile menu button */}
              {sidebar && (
                <button
                  onClick={() => setMobileOpen(true)}
                  className="lg:hidden p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}

              {/* Desktop sidebar toggle */}
              {sidebar && (
                <button
                  onClick={() => handleToggle(!sidebarCollapsed)}
                  className="hidden lg:block p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}

              <div className="flex-1">{header}</div>
            </div>
          </header>
        )}

        {/* Main content area */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
