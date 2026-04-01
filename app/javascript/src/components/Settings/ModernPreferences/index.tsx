import React, { useEffect, useState } from "react";
import {
  Bell,
  Envelope as Mail,
  Clock,
  FileText,
  Warning as AlertTriangle,
  Check,
  X,
} from "@phosphor-icons/react";
import { preferencesApi } from "apis/api";
import Loader from "common/Loader/index";
import { useUserContext } from "context/UserContext";
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
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { cn } from "../../../lib/utils";

interface PreferenceItem {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  category: string;
  badge?: string;
  dbField: string;
}

const PreferencesSettingsPage: React.FC = () => {
  const { user, companyRole } = useUserContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedPreferences, setSavedPreferences] = useState<PreferenceItem[]>(
    []
  );
  const [unsubscribedAll, setUnsubscribedAll] = useState(false);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const res = await preferencesApi.get(user.id);

      const isUnsubscribed = res.data.unsubscribed_from_all || false;
      setUnsubscribedAll(isUnsubscribed);

      // Map API response to our preference items - only show actual features
      const prefs: PreferenceItem[] = [
        {
          id: "weekly_reminder",
          title: "Weekly Timesheet Reminder",
          description:
            "Receive weekly reminders every Monday about pending timesheet entries",
          enabled: !isUnsubscribed && (res.data.notification_enabled || false),
          icon: <Mail className="h-4 w-4" />,
          category: "Timesheet Notifications",
          badge: "Active",
          dbField: "notification_enabled",
        },
        {
          id: "timesheet_reminder",
          title: "Missing Entry Reminders",
          description:
            "Get notified when you haven't logged time for more than 2 days",
          enabled:
            !isUnsubscribed && res.data.timesheet_reminder_enabled !== false,
          icon: <Clock className="h-4 w-4" />,
          category: "Timesheet Notifications",
          dbField: "timesheet_reminder_enabled",
        },
        {
          id: "invoice_notifications",
          title: "Invoice Email Notifications",
          description:
            "Receive emails when invoices are created, sent, or updated",
          enabled:
            !isUnsubscribed && res.data.invoice_email_notifications !== false,
          icon: <FileText className="h-4 w-4" />,
          category: "Billing Notifications",
          badge: "Important",
          dbField: "invoice_email_notifications",
        },
        {
          id: "payment_notifications",
          title: "Payment Email Notifications",
          description:
            "Get notified when payments are received or payment status changes",
          enabled:
            !isUnsubscribed && res.data.payment_email_notifications !== false,
          icon: <FileText className="h-4 w-4" />,
          category: "Billing Notifications",
          dbField: "payment_email_notifications",
        },
      ].filter(pref => {
        if (companyRole === "employee") {
          return pref.category !== "Billing Notifications";
        }

        return true;
      });

      setPreferences(prefs);
      setSavedPreferences(JSON.parse(JSON.stringify(prefs)));
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      setIsLoading(false);
    }
  };

  const handleToggle = (preferenceId: string) => {
    if (unsubscribedAll) return; // Don't allow toggling if unsubscribed from all

    const updatedPreferences = preferences.map(pref =>
      pref.id === preferenceId ? { ...pref, enabled: !pref.enabled } : pref
    );
    setPreferences(updatedPreferences);

    // Check if there are changes
    const hasChanges =
      JSON.stringify(updatedPreferences) !== JSON.stringify(savedPreferences) ||
      unsubscribedAll;
    setHasChanges(hasChanges);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Build the update payload based on changed preferences
      const payload: any = {
        unsubscribed_from_all: unsubscribedAll,
      };

      if (!unsubscribedAll) {
        preferences.forEach(pref => {
          payload[pref.dbField] = pref.enabled;
        });
      }

      await preferencesApi.updatePreference(user.id, payload);

      setSavedPreferences(JSON.parse(JSON.stringify(preferences)));
      setHasChanges(false);
      setIsSaving(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPreferences(JSON.parse(JSON.stringify(savedPreferences)));
    setHasChanges(false);
    setUnsubscribedAll(false);
    setShowUnsubscribeConfirm(false);
  };

  const handleUnsubscribeAll = () => {
    setShowUnsubscribeConfirm(true);
  };

  const confirmUnsubscribeAll = () => {
    setUnsubscribedAll(true);
    setPreferences(preferences.map(p => ({ ...p, enabled: false })));
    setHasChanges(true);
    setShowUnsubscribeConfirm(false);
  };

  const handleResubscribe = () => {
    setUnsubscribedAll(false);
    // Re-enable default preferences
    setPreferences(
      preferences.map(p => ({
        ...p,
        enabled:
          p.badge === "Important" ||
          p.badge === "Active" ||
          p.dbField === "timesheet_reminder_enabled",
      }))
    );
    setHasChanges(true);
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);

    return acc;
  }, {} as Record<string, PreferenceItem[]>);

  const getCategoryIcon = (category: string) => {
    if (category.includes("Timesheet")) {
      return <Clock className="h-5 w-5 text-primary" />;
    } else if (category.includes("Billing")) {
      return <FileText className="h-5 w-5 text-primary" />;
    }

    return <Bell className="h-5 w-5 text-muted-foreground" />;
  };

  const getCategoryDescription = (category: string) => {
    if (category.includes("Timesheet")) {
      return "Manage notifications related to time tracking and timesheets";
    } else if (category.includes("Billing")) {
      return "Control invoice and payment notifications";
    }

    return "";
  };

  if (isLoading) {
    return <Loader className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Email Preferences
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your email notification settings
              </p>
            </div>
            {hasChanges && (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Unsubscribe Confirmation Dialog */}
          {showUnsubscribeConfirm && (
            <Alert className="border-destructive/30 bg-destructive/5 text-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-foreground">
                Confirm Unsubscribe from All Emails
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                <p className="mb-4">
                  Are you sure you want to unsubscribe from all email
                  notifications? You will not receive any emails including
                  important billing and invoice notifications.
                </p>
                <div className="flex space-x-3">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={confirmUnsubscribeAll}
                  >
                    Yes, Unsubscribe from All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUnsubscribeConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Unsubscribed Status */}
          {unsubscribedAll && (
            <Alert className="border-border bg-card text-foreground">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-foreground">
                You're Unsubscribed from All Emails
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                <p className="mb-4">
                  You are currently unsubscribed from all email notifications.
                  You won't receive any emails from Miru.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResubscribe}
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Re-enable Email Notifications
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Preference Categories */}
          {Object.entries(groupedPreferences).map(([category, items]) => (
            <Card
              key={category}
              className={cn(
                "border-border shadow-sm overflow-hidden",
                unsubscribedAll && "opacity-60"
              )}
            >
              <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(category)}
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {category}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {getCategoryDescription(category)}
                      </CardDescription>
                    </div>
                  </div>
                  {!unsubscribedAll && (
                    <Badge variant="secondary" className="text-xs">
                      {items.filter(i => i.enabled).length} of {items.length}{" "}
                      enabled
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {items.map((preference, index) => (
                  <div
                    key={preference.id}
                    className={cn(
                      "px-6 py-4 flex items-start justify-between",
                      !unsubscribedAll &&
                        "transition-colors hover:bg-accent/40",
                      index !== items.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted">
                        {preference.icon}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <Label
                            htmlFor={preference.id}
                            className={cn(
                              "text-sm font-medium",
                              unsubscribedAll
                                ? "text-muted-foreground"
                                : "cursor-pointer text-foreground"
                            )}
                          >
                            {preference.title}
                          </Label>
                          {preference.badge && !unsubscribedAll && (
                            <Badge
                              variant={
                                preference.badge === "Important"
                                  ? "destructive"
                                  : preference.badge === "Active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {preference.badge}
                            </Badge>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm pr-4",
                            unsubscribedAll
                              ? "text-muted-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {preference.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={preference.id}
                      checked={preference.enabled}
                      onCheckedChange={() => handleToggle(preference.id)}
                      disabled={unsubscribedAll}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Email Delivery Info */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Delivery Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Email Address
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  All notifications will be sent to this email address. To
                  change your email, please update it in your profile settings.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Unsubscribe Section */}
          {!unsubscribedAll && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Unsubscribe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    If you no longer wish to receive any emails from Miru, you
                    can unsubscribe from all notifications. This will stop all
                    email communications including important billing and invoice
                    notifications.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleUnsubscribeAll}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Unsubscribe from All Emails
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreferencesSettingsPage;
