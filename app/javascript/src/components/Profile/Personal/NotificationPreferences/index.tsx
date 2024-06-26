/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import preferencesApi from "apis/preferences";
import CustomCheckbox from "common/CustomCheckbox";
import Loader from "common/Loader/index";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";

const NotificationPreferences = () => {
  const { user } = useUserContext();
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
    const res = await preferencesApi.updatePreference(currentUserId, {
      notification_enabled: !isSelected,
    });
    setIsSelected(res.data.notification_enabled);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getPreferences();
  }, []);

  return (
    <Fragment>
      <DetailsHeader subTitle="" title="Notification Settings" />
      {isLoading ? (
        <Loader className="min-h-70v" />
      ) : (
        <CustomCheckbox
          isUpdatedDesign
          checkboxValue={isSelected}
          handleCheck={updatePreferences}
          handleOnClick={e => e.stopPropagation()}
          id={currentUserId}
          isChecked={isSelected}
          labelClassName="ml-4"
          text="Weekly Email Reminder"
          wrapperClassName="py-3 px-5 flex items-center hover:bg-miru-gray-100"
        />
      )}
    </Fragment>
  );
};

export default NotificationPreferences;
