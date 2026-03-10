import React, { Fragment, useEffect, useState } from "react";

import { preferencesApi } from "apis/api";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Switch } from "components/ui/switch";
import { Label } from "components/ui/label";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { Bell } from "phosphor-react";
import { useParams } from "react-router-dom";

const NotificationPreferences = () => {
  const { user, isDesktop, loading: userLoading } = useUserContext();
  const { memberId } = useParams();
  const { isCalledFromSettings } = useProfileContext();

  // Force correct context based on URL path
  const isFromSettings = window.location.pathname.startsWith("/settings");
  const currentUserId = isFromSettings ? user?.id : memberId;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSelected, setIsSelected] = useState<boolean>(false);

  const getPreferences = async () => {
    if (!currentUserId) {
      console.error("No currentUserId available", {
        isCalledFromSettings,
        isFromSettings,
        userId: user?.id,
        memberId,
      });
      setIsLoading(false);

      return;
    }

    try {
      const res = await preferencesApi.get(currentUserId);
      setIsSelected(res.data.notification_enabled);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      setIsLoading(false);
    }
  };

  const updatePreferences = async () => {
    if (!currentUserId) {
      console.error("No currentUserId available for update");

      return;
    }

    setIsLoading(true);
    try {
      await preferencesApi.updatePreference(currentUserId, {
        notification_enabled: !isSelected,
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating preferences:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Don't fetch if user context is still loading
    if (userLoading) {
      return;
    }

    // Only fetch preferences if we have a currentUserId
    if (currentUserId) {
      setIsLoading(true);
      getPreferences();
    } else {
      // No user ID available after loading completes
      setIsLoading(false);
    }
  }, [userLoading, currentUserId, isFromSettings]);

  return (
    <Fragment>
      {isDesktop ? (
        <DetailsHeader subTitle="" title="Notification Settings" />
      ) : (
        <MobileEditHeader
          backHref={isFromSettings ? "/settings/" : `/team/${memberId}`}
          href=""
          showEdit={false}
          title="Notification Settings"
        />
      )}
      {isLoading || userLoading ? (
        <div className="flex min-h-70v items-center justify-center">
          <Loader />
        </div>
      ) : currentUserId ? (
        <div className="mt-6 px-4 md:px-0">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/40">
              <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                <Bell className="mr-2 h-5 w-5 text-muted-foreground" />
                Email Notifications
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your email notification preferences
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label
                    htmlFor="weekly-reminder"
                    className="cursor-pointer text-sm font-medium text-foreground"
                  >
                    Weekly Email Reminder
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly email reminders about timesheet entries and
                    project updates
                  </p>
                </div>
                <Switch
                  id="weekly-reminder"
                  checked={isSelected}
                  onCheckedChange={checked => {
                    setIsSelected(checked);
                    updatePreferences();
                  }}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex min-h-70v items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No user data available</p>
            <p className="text-sm text-muted-foreground">
              Please log in to manage notification preferences
            </p>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default NotificationPreferences;
