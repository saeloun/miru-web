import React, { useEffect, useState } from "react";
import { preferencesApi } from "apis/api";
import { useUserContext } from "context/UserContext";
import {
  Bell,
  Envelope,
  Calendar,
  Clock,
  Users,
  FileText,
} from "phosphor-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import { Separator } from "../../ui/separator";

interface PreferenceItem {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  category: string;
}

const Preferences: React.FC = () => {
  const { user } = useUserContext();
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const res = await preferencesApi.get(user.id);

      // Map API response to our preference items
      const prefs: PreferenceItem[] = [
        {
          id: "weekly_reminder",
          title: "Weekly Email Reminder",
          description:
            "Receive weekly reminders about timesheet entries and project updates",
          enabled: res.data.notification_enabled || false,
          icon: <Envelope className="h-4 w-4" />,
          category: "Email Notifications",
        },
        {
          id: "daily_summary",
          title: "Daily Summary",
          description: "Get a daily summary of your tasks and activities",
          enabled: res.data.daily_summary || false,
          icon: <Calendar className="h-4 w-4" />,
          category: "Email Notifications",
        },
        {
          id: "timesheet_reminder",
          title: "Timesheet Reminders",
          description: "Remind me to fill timesheet entries",
          enabled: res.data.timesheet_reminder || true,
          icon: <Clock className="h-4 w-4" />,
          category: "Email Notifications",
        },
        {
          id: "team_updates",
          title: "Team Updates",
          description: "Notify me about team member activities and updates",
          enabled: res.data.team_updates || false,
          icon: <Users className="h-4 w-4" />,
          category: "Team",
        },
        {
          id: "invoice_updates",
          title: "Invoice Updates",
          description: "Notify me when invoices are created, sent, or paid",
          enabled: res.data.invoice_updates || true,
          icon: <FileText className="h-4 w-4" />,
          category: "Billing",
        },
        {
          id: "desktop_notifications",
          title: "Desktop Notifications",
          description: "Show desktop notifications for important events",
          enabled: res.data.desktop_notifications || false,
          icon: <Bell className="h-4 w-4" />,
          category: "System",
        },
      ];

      setPreferences(prefs);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      setIsLoading(false);
    }
  };

  const handleToggle = async (preferenceId: string) => {
    const updatedPreferences = preferences.map(pref =>
      pref.id === preferenceId ? { ...pref, enabled: !pref.enabled } : pref
    );
    setPreferences(updatedPreferences);

    // Update on the backend
    try {
      const updatedPref = updatedPreferences.find(p => p.id === preferenceId);
      if (preferenceId === "weekly_reminder") {
        await preferencesApi.updatePreference(user.id, {
          notification_enabled: updatedPref?.enabled,
        });
      }
      // Add other API calls for different preferences as needed
    } catch (error) {
      console.error("Error updating preference:", error);
      // Revert on error
      setPreferences(preferences);
    }
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);

    return acc;
  }, {} as Record<string, PreferenceItem[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Preferences</h1>
          <p className="mt-1 text-gray-600">
            Manage your notification and system preferences
          </p>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedPreferences).map(([category, items]) => (
            <Card key={category} className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>
                  Configure your {category.toLowerCase()} settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {items.map((preference, index) => (
                  <div key={preference.id}>
                    {index > 0 && <Separator className="mb-6" />}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          {preference.icon}
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor={preference.id}
                            className="text-sm font-medium text-gray-900 cursor-pointer"
                          >
                            {preference.title}
                          </Label>
                          <p className="text-sm text-gray-500">
                            {preference.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={preference.id}
                        checked={preference.enabled}
                        onCheckedChange={() => handleToggle(preference.id)}
                        className="data-[state=checked]:bg-gray-900"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Additional Settings Info */}
          <Card className="border-gray-200 shadow-sm bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notification Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Email notifications are sent to: <strong>{user?.email}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                To change your email address, please update it in your profile
                settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
