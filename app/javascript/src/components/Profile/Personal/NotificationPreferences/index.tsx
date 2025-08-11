import React, { Fragment, useEffect, useState } from "react";

import preferencesApi from "apis/preferences";
import CustomToggle from "common/CustomToggle";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { useParams } from "react-router-dom";

const NotificationPreferences = () => {
  const { user, isDesktop } = useUserContext();
  const { memberId } = useParams();
  const { isCalledFromSettings } = useProfileContext();
  const currentUserId = isCalledFromSettings ? user.id : memberId;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSelected, setIsSelected] = useState<boolean>(false);

  const getPreferences = async () => {
    const res = await preferencesApi.get(currentUserId);
    setIsSelected(res.data.notification_enabled);
    setIsLoading(false);
  };

  const updatePreferences = async () => {
    setIsLoading(true);
    await preferencesApi.updatePreference(currentUserId, {
      notification_enabled: !isSelected,
    });
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getPreferences();
  }, []);

  return (
    <Fragment>
      {isDesktop ? (
        <DetailsHeader subTitle="" title="Notification Settings" />
      ) : (
        <MobileEditHeader
          backHref={isCalledFromSettings ? "/settings/" : `/team/${memberId}`}
          href=""
          showEdit={false}
          title="Notification Settings"
        />
      )}
      {isLoading ? (
        <Loader className="min-h-70v" />
      ) : (
        <div className="mt-10 flex h-full items-center justify-between bg-miru-gray-100 p-10 lg:mt-4">
          <span className="w-1/2">Weekly Email Reminder</span>
          <CustomToggle
            id={currentUserId}
            isChecked={isSelected}
            setIsChecked={setIsSelected}
            toggleCss="mt-5"
            onToggle={updatePreferences}
          />
        </div>
      )}
    </Fragment>
  );
};

export default NotificationPreferences;
