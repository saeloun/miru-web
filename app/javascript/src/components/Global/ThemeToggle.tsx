import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Palette, X, ChevronRight, Monitor, Sparkles, Sun, Moon, Laptop } from "lucide-react";
import { useThemeOptional } from "contexts/ThemeContext";

interface GlobalThemeToggleProps {
  className?: string;
}

const GlobalThemeToggle: React.FC<GlobalThemeToggleProps> = ({ className }) => {
  const themeContext = useThemeOptional();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<"theme" | "layout">("theme");
  
  // Auto-hide after selection - moved before conditional return
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsMinimized(true);
      }, 10000); // Auto-minimize after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Don't render if theme context is not available
  if (!themeContext) {
    console.warn("GlobalThemeToggle: ThemeProvider not found, theme functionality disabled");
    return null;
  }

  const { theme, effectiveTheme, setTheme, layoutMode, setLayoutMode } = themeContext;

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  const handleLayoutChange = (newLayout: "classic" | "admin") => {
    setLayoutMode(newLayout);
  };

  const themeOptions = [
    {
      id: "light",
      name: "Light",
      description: "Light mode",
      icon: Sun,
      preview: "bg-gradient-to-br from-white to-gray-100",
    },
    {
      id: "dark", 
      name: "Dark",
      description: "Dark mode",
      icon: Moon,
      preview: "bg-gradient-to-br from-gray-900 to-gray-800",
    },
    {
      id: "system",
      name: "System",
      description: "Follow system preference",
      icon: Laptop,
      preview: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20",
    },
  ];

  const layoutOptions = [
    {
      id: "classic",
      name: "Classic",
      description: "Traditional Miru interface",
      icon: Monitor,
      preview: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20",
    },
    {
      id: "admin",
      name: "Admin Pro",
      description: "Modern shadcn dashboard",
      icon: Sparkles,
      preview: "bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20",
    },
  ];

  if (isMinimized) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <button
          onClick={() => {
            setIsMinimized(false);
            setIsOpen(true);
          }}
          className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          aria-label="Open theme selector"
        >
          <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-[#5B34EA]" />
        </button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-[#5B34EA]" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
          <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Theme Selector Panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300",
          className
        )}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-80 max-w-[calc(100vw-3rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Appearance Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Customize your interface
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close theme selector"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("theme")}
              className={cn(
                "flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors",
                activeTab === "theme"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              Theme
            </button>
            <button
              onClick={() => setActiveTab("layout")}
              className={cn(
                "flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors",
                activeTab === "layout"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              Layout
            </button>
          </div>

          {/* Theme Options */}
          {activeTab === "theme" && (
            <div className="space-y-3">
              {themeOptions.map(themeOption => {
                const Icon = themeOption.icon;
                const isActive = theme === themeOption.id;

                return (
                  <button
                    key={themeOption.id}
                    onClick={() => {
                      handleThemeChange(themeOption.id as "light" | "dark" | "system");
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all duration-200",
                      isActive
                        ? "border-[#5B34EA] bg-purple-50/50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                    )}
                  >
                    {/* Preview */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        themeOption.preview
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          isActive ? "text-[#5B34EA]" : "text-gray-600 dark:text-gray-400"
                        )}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium",
                            isActive ? "text-[#5B34EA]" : "text-gray-900 dark:text-gray-100"
                          )}
                        >
                          {themeOption.name}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#5B34EA] text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {themeOption.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Layout Options */}
          {activeTab === "layout" && (
            <div className="space-y-3">
              {layoutOptions.map(layoutOption => {
                const Icon = layoutOption.icon;
                const isActive = layoutMode === layoutOption.id;

                return (
                  <button
                    key={layoutOption.id}
                    onClick={() => {
                      handleLayoutChange(layoutOption.id as "classic" | "admin");
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all duration-200",
                      isActive
                        ? "border-[#5B34EA] bg-purple-50/50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                    )}
                  >
                    {/* Preview */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        layoutOption.preview
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          isActive ? "text-[#5B34EA]" : "text-gray-600 dark:text-gray-400"
                        )}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium",
                            isActive ? "text-[#5B34EA]" : "text-gray-900 dark:text-gray-100"
                          )}
                        >
                          {layoutOption.name}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#5B34EA] text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {layoutOption.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Minimize
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">
                  Theme preview active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalThemeToggle;
