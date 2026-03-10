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
  Gear,
  User,
  Buildings,
  CreditCard,
  Calendar,
  DeviceMobile,
  Bell,
  CaretRight,
  MagnifyingGlass,
  Funnel,
  DotsThree,
} from "phosphor-react";
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

  // Funnel settings based on role and tab visibility
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

  // Funnel settings based on search
  const filteredPersonalSettings = personalSettings.filter(setting =>
    setting.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrganizationSettings = organizationSettings.filter(setting =>
    setting.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconForSetting = (originalIcon: React.ReactNode, label: string) => {
    const iconMap = {
      "PROFILE SETTINGS": <User className="w-5 h-5" />,
      "EMPLOYMENT DETAILS": <Buildings className="w-5 h-5" />,
      "ALLOCATED DEVICES": <DeviceMobile className="w-5 h-5" />,
      "NOTIFICATION SETTINGS": <Bell className="w-5 h-5" />,
      "ORG. SETTINGS": <Buildings className="w-5 h-5" />,
      "PAYMENT SETTINGS": <CreditCard className="w-5 h-5" />,
      LEAVES: <Calendar className="w-5 h-5" />,
      HOLIDAYS: <Calendar className="w-5 h-5" />,
    };

    return iconMap[label] || <Gear className="w-5 h-5" />;
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
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/30"
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
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
                )}
              >
                {getIconForSetting(setting.icon, setting.label)}
              </div>
              <div>
                <h3
                  className={cn(
                    "font-semibold text-sm",
                    isActive ? "text-primary" : "text-foreground"
                  )}
                >
                  {setting.label.replace(
                    /^(PROFILE|ORG\.|EMPLOYMENT|ALLOCATED|NOTIFICATION|PAYMENT)\s+/,
                    ""
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage your {setting.label.toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isActive && (
                <Badge
                  variant="secondary"
                  className="bg-primary text-primary-foreground text-xs"
                >
                  Active
                </Badge>
              )}
              <CaretRight
                className={cn(
                  "w-4 h-4 transition-transform group-hover:translate-x-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("min-h-screen bg-muted/30", className)}>
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gear className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Gear
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your account and organization preferences
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:flex-nowrap">
              {/* MagnifyingGlass */}
              <div className="relative w-full sm:flex-1 lg:w-72 lg:flex-none">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search Settings..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <Button className="w-full sm:w-auto" variant="outline" size="sm">
                <Funnel className="mr-2 h-4 w-4" />
                Funnel
              </Button>

              <Button
                className="w-full sm:w-auto"
                variant="outline"
                size="icon"
              >
                <DotsThree className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Gear */}
            {filteredPersonalSettings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Gear
                </h2>
                <div className="space-y-3">
                  {filteredPersonalSettings.map(renderSettingCard)}
                </div>
              </div>
            )}

            {/* Organization Gear */}
            {filteredOrganizationSettings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Buildings className="w-5 h-5 text-primary" />
                  Organization Gear
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
                  <MagnifyingGlass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">
                    No settings found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search query
                  </p>
                </div>
              )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {CurrentComponent ? (
              <div className="bg-background rounded-xl border border-border shadow-sm">
                <CurrentComponent />
              </div>
            ) : (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Welcome to Gear
                  </CardTitle>
                  <CardDescription>
                    Select a setting from the sidebar to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Gear className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Choose a setting to configure
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
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
