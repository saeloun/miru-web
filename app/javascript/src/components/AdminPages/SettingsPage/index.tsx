import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Settings,
  User,
  Building2,
  CreditCard,
  Calendar,
  Smartphone,
  Bell,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "../../../lib/utils";

interface SettingsPageProps {
  currentComponent?: React.ComponentType<any>;
  settingsConfig: Array<{
    label: string;
    path: string;
    icon: React.ReactNode;
    authorisedRoles: string[];
    Component: React.ComponentType<any>;
    category: string;
    isTab: boolean;
  }>;
  userRole: string;
  className?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  currentComponent: CurrentComponent,
  settingsConfig,
  userRole,
  className,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Get current path for active state
  const currentPath = location.pathname.replace("/settings/", "");

  // Filter settings based on role and tab visibility
  const personalSettings = settingsConfig.filter(
    setting =>
      setting.category === "personal" &&
      setting.isTab &&
      setting.authorisedRoles.includes(userRole)
  );

  const organizationSettings = settingsConfig.filter(
    setting =>
      setting.category === "organization" &&
      setting.isTab &&
      setting.authorisedRoles.includes(userRole)
  );

  // Filter settings based on search
  const filteredPersonalSettings = personalSettings.filter(setting =>
    setting.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrganizationSettings = organizationSettings.filter(setting =>
    setting.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconForSetting = (originalIcon: React.ReactNode, label: string) => {
    const iconMap = {
      "PROFILE SETTINGS": <User className="w-5 h-5" />,
      "EMPLOYMENT DETAILS": <Building2 className="w-5 h-5" />,
      "ALLOCATED DEVICES": <Smartphone className="w-5 h-5" />,
      "NOTIFICATION SETTINGS": <Bell className="w-5 h-5" />,
      "ORG. SETTINGS": <Building2 className="w-5 h-5" />,
      "PAYMENT SETTINGS": <CreditCard className="w-5 h-5" />,
      LEAVES: <Calendar className="w-5 h-5" />,
      HOLIDAYS: <Calendar className="w-5 h-5" />,
    };

    return iconMap[label] || <Settings className="w-5 h-5" />;
  };

  const handleSettingClick = (path: string) => {
    navigate(`/settings/${path}`);
  };

  const renderSettingCard = (setting: any) => {
    const isActive = currentPath === setting.path;

    return (
      <Card
        key={setting.path}
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-md border-2",
          isActive
            ? "border-[#5B34EA] bg-[#5B34EA]/5 dark:bg-[#5B34EA]/10"
            : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
        )}
        onClick={() => handleSettingClick(setting.path)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  isActive
                    ? "bg-[#5B34EA] text-white"
                    : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                {getIconForSetting(setting.icon, setting.label)}
              </div>
              <div>
                <h3
                  className={cn(
                    "font-semibold text-sm",
                    isActive
                      ? "text-[#5B34EA]"
                      : "text-gray-900 dark:text-gray-100"
                  )}
                >
                  {setting.label.replace(
                    /^(PROFILE|ORG\.|EMPLOYMENT|ALLOCATED|NOTIFICATION|PAYMENT)\s+/,
                    ""
                  )}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Manage your {setting.label.toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isActive && (
                <Badge
                  variant="secondary"
                  className="bg-[#5B34EA] text-white text-xs"
                >
                  Active
                </Badge>
              )}
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform group-hover:translate-x-1",
                  isActive ? "text-[#5B34EA]" : "text-gray-400"
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50/50 dark:bg-gray-900/50",
        className
      )}
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#5B34EA]/10 rounded-lg">
                <Settings className="h-6 w-6 text-[#5B34EA]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Settings
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your account and organization preferences
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B34EA] focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>

              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Settings */}
            {filteredPersonalSettings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#5B34EA]" />
                  Personal Settings
                </h2>
                <div className="space-y-3">
                  {filteredPersonalSettings.map(renderSettingCard)}
                </div>
              </div>
            )}

            {/* Organization Settings */}
            {filteredOrganizationSettings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#5B34EA]" />
                  Organization Settings
                </h2>
                <div className="space-y-3">
                  {filteredOrganizationSettings.map(renderSettingCard)}
                </div>
              </div>
            )}

            {/* No results */}
            {searchQuery &&
              filteredPersonalSettings.length === 0 &&
              filteredOrganizationSettings.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    No settings found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your search query
                  </p>
                </div>
              )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {CurrentComponent ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <CurrentComponent />
              </div>
            ) : (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Welcome to Settings
                  </CardTitle>
                  <CardDescription>
                    Select a setting from the sidebar to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Choose a setting to configure
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Use the navigation on the left to access your profile
                      settings, organization configuration, and more.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
