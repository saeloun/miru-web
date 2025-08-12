import React, { Fragment, useEffect, useState } from "react";

import preferencesApi from "apis/preferences";
import CustomToggle from "common/CustomToggle";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { ReminderIcon } from "miruIcons";
import { useParams } from "react-router-dom";

const NotificationPreferences = () => {
  const { user, isDesktop } = useUserContext();
  const { memberId } = useParams();
  const { isCalledFromSettings } = useProfileContext();

  // Force correct context based on URL path
  const isFromSettings = window.location.pathname.startsWith("/settings");
  const currentUserId = isFromSettings ? user?.id : memberId;

  const [isLoading, setIsLoading] = useState<boolean>(false);
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
    if (user?.id || memberId) {
      setIsLoading(true);
      getPreferences();
    }
  }, [user?.id, memberId, isFromSettings]);

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
      {isLoading ? (
        <div className="flex min-h-70v items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="mt-4 space-y-6 px-4 md:px-10 lg:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
                <ReminderIcon
                  className="mr-2"
                  color="#1D1A31"
                  size={16}
                  weight="bold"
                />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Manage your email notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-base font-bold text-miru-dark-purple-1000">
                    Weekly Email Reminder
                  </p>
                  <p className="text-sm text-miru-dark-purple-600">
                    Receive weekly email reminders about timesheet entries and
                    project updates
                  </p>
                </div>
                <CustomToggle
                  id={currentUserId}
                  isChecked={isSelected}
                  setIsChecked={setIsSelected}
                  toggleCss=""
                  onToggle={updatePreferences}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Fragment>
  );
};

export default NotificationPreferences;
