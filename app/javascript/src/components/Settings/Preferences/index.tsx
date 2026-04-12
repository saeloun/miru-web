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
import { i18n } from "../../../i18n";

interface PreferenceItem {
  id: string;
  titleKey:
    | "weeklyReminderTitle"
    | "timesheetReminderTitle"
    | "invoiceNotificationsTitle"
    | "paymentNotificationsTitle"
    | "monthlyDigestTitle";
  descriptionKey:
    | "weeklyReminderDescription"
    | "timesheetReminderDescription"
    | "invoiceNotificationsDescription"
    | "paymentNotificationsDescription"
    | "monthlyDigestDescription";
  enabled: boolean;
  iconKey: "mail" | "clock" | "fileText";
  categoryKey: "timesheet" | "billing";
  badgeKey?: "active" | "important" | "monthly";
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

  const clonePreferences = (items: PreferenceItem[]) =>
    items.map(item => ({ ...item }));

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
          titleKey: "weeklyReminderTitle",
          descriptionKey: "weeklyReminderDescription",
          enabled: !isUnsubscribed && (res.data.notification_enabled || false),
          iconKey: "mail",
          categoryKey: "timesheet",
          badgeKey: "active",
          dbField: "notification_enabled",
        },
        {
          id: "timesheet_reminder",
          titleKey: "timesheetReminderTitle",
          descriptionKey: "timesheetReminderDescription",
          enabled:
            !isUnsubscribed && res.data.timesheet_reminder_enabled !== false,
          iconKey: "clock",
          categoryKey: "timesheet",
          dbField: "timesheet_reminder_enabled",
        },
        {
          id: "invoice_notifications",
          titleKey: "invoiceNotificationsTitle",
          descriptionKey: "invoiceNotificationsDescription",
          enabled:
            !isUnsubscribed && res.data.invoice_email_notifications !== false,
          iconKey: "fileText",
          categoryKey: "billing",
          badgeKey: "important",
          dbField: "invoice_email_notifications",
        },
        {
          id: "payment_notifications",
          titleKey: "paymentNotificationsTitle",
          descriptionKey: "paymentNotificationsDescription",
          enabled:
            !isUnsubscribed && res.data.payment_email_notifications !== false,
          iconKey: "fileText",
          categoryKey: "billing",
          dbField: "payment_email_notifications",
        },
        {
          id: "monthly_report_digest",
          titleKey: "monthlyDigestTitle",
          descriptionKey: "monthlyDigestDescription",
          enabled:
            !isUnsubscribed && res.data.monthly_report_digest_enabled === true,
          iconKey: "fileText",
          categoryKey: "billing",
          badgeKey: "monthly",
          dbField: "monthly_report_digest_enabled",
        },
      ].filter(pref => {
        if (companyRole === "employee") {
          return pref.categoryKey !== "billing";
        }

        return true;
      });

      setPreferences(prefs);
      setSavedPreferences(clonePreferences(prefs));
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

      setSavedPreferences(clonePreferences(preferences));
      setHasChanges(false);
      setIsSaving(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPreferences(clonePreferences(savedPreferences));
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
    setPreferences(
      preferences.map(p => ({
        ...p,
        enabled:
          p.badgeKey === "important" ||
          p.badgeKey === "active" ||
          p.badgeKey === "monthly" ||
          p.dbField === "timesheet_reminder_enabled",
      }))
    );
    setHasChanges(true);
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.categoryKey]) {
      acc[pref.categoryKey] = [];
    }
    acc[pref.categoryKey].push(pref);

    return acc;
  }, {} as Record<PreferenceItem["categoryKey"], PreferenceItem[]>);

  const getCategoryIcon = (categoryKey: PreferenceItem["categoryKey"]) => {
    if (categoryKey === "timesheet") {
      return <Clock className="h-5 w-5 text-primary" />;
    } else if (categoryKey === "billing") {
      return <FileText className="h-5 w-5 text-primary" />;
    }

    return <Bell className="h-5 w-5 text-muted-foreground" />;
  };

  const getCategoryTitle = (categoryKey: PreferenceItem["categoryKey"]) => {
    if (categoryKey === "timesheet") {
      return i18n.t("preferencesSettings.timesheetNotifications");
    }

    return i18n.t("preferencesSettings.billingNotifications");
  };

  const getCategoryDescription = (
    categoryKey: PreferenceItem["categoryKey"]
  ) => {
    if (categoryKey === "timesheet") {
      return i18n.t("preferencesSettings.timesheetNotificationsDescription");
    } else if (categoryKey === "billing") {
      return i18n.t("preferencesSettings.billingNotificationsDescription");
    }

    return "";
  };

  const getBadgeLabel = (badgeKey?: PreferenceItem["badgeKey"]) => {
    if (!badgeKey) return null;

    return i18n.t(`preferencesSettings.badges.${badgeKey}`);
  };

  const getPreferenceIcon = (iconKey: PreferenceItem["iconKey"]) => {
    if (iconKey === "mail") return <Mail className="h-4 w-4" />;

    if (iconKey === "clock") return <Clock className="h-4 w-4" />;

    return <FileText className="h-4 w-4" />;
  };

  const getPreferenceLabel = (
    key: PreferenceItem["titleKey"] | PreferenceItem["descriptionKey"]
  ) => i18n.t(`preferencesSettings.${key}`);

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
                {i18n.t("preferencesSettings.title")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {i18n.t("preferencesSettings.description")}
              </p>
            </div>
            {hasChanges && (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  {i18n.t("cancel")}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {i18n.t("preferencesSettings.saving")}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {i18n.t("preferencesSettings.saveChanges")}
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
                {i18n.t("preferencesSettings.confirmUnsubscribeTitle")}
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                <p className="mb-4">
                  {i18n.t("preferencesSettings.confirmUnsubscribeDescription")}
                </p>
                <div className="flex space-x-3">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={confirmUnsubscribeAll}
                  >
                    {i18n.t("preferencesSettings.confirmUnsubscribeAction")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUnsubscribeConfirm(false)}
                  >
                    {i18n.t("cancel")}
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
                {i18n.t("preferencesSettings.unsubscribedTitle")}
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                <p className="mb-4">
                  {i18n.t("preferencesSettings.unsubscribedDescription")}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResubscribe}
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {i18n.t("preferencesSettings.resubscribeAction")}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Preference Categories */}
          {Object.entries(groupedPreferences).map(([categoryKey, items]) => (
            <Card
              key={categoryKey}
              className={cn(
                "border-border shadow-sm overflow-hidden",
                unsubscribedAll && "opacity-60"
              )}
            >
              <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(
                      categoryKey as PreferenceItem["categoryKey"]
                    )}
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {getCategoryTitle(
                          categoryKey as PreferenceItem["categoryKey"]
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {getCategoryDescription(
                          categoryKey as PreferenceItem["categoryKey"]
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {!unsubscribedAll && (
                    <Badge variant="secondary" className="text-xs">
                      {i18n.t("preferencesSettings.enabledCount", {
                        count: items.filter(i => i.enabled).length,
                        total: items.length,
                      })}
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
                        {getPreferenceIcon(preference.iconKey)}
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
                            {getPreferenceLabel(preference.titleKey)}
                          </Label>
                          {preference.badgeKey && !unsubscribedAll && (
                            <Badge
                              variant={
                                preference.badgeKey === "important"
                                  ? "destructive"
                                  : preference.badgeKey === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {getBadgeLabel(preference.badgeKey)}
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
                          {getPreferenceLabel(preference.descriptionKey)}
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
                {i18n.t("preferencesSettings.deliveryTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {i18n.t("preferencesSettings.emailAddress")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  {i18n.t("preferencesSettings.deliveryDescription")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Unsubscribe Section */}
          {!unsubscribedAll && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">
                  {i18n.t("preferencesSettings.unsubscribeTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {i18n.t("preferencesSettings.unsubscribeDescription")}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleUnsubscribeAll}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {i18n.t("preferencesSettings.unsubscribeAction")}
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
