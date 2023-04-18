/* eslint-disable no-unused-vars */

import React, { useEffect } from "react";

import { UserAvatarSVG } from "miruIcons";
import { Tooltip } from "StyledComponents";

import profileApi from "apis/profile";
import Toastr from "common/Toastr";
import { useProfile } from "components/Profile/context/EntryContext";
import { teamsMapper } from "mapper/teams.mapper";

export const UserInformation = () => {
  const { setUserState, profileSettings } = useProfile();
  const getDetails = async () => {
    try {
      if (!profileSettings.first_name && !profileSettings.last_name) {
        const data = await profileApi.index();
        if (data.status && data.status == 200) {
          const addressData = await profileApi.getAddress(data.data.user.id);
          const userObj = teamsMapper(
            data.data.user,
            addressData.data.addresses[0]
          );
          setUserState("profileSettings", userObj);
        }
      }
    } catch {
      Toastr.error("Something went wrong");
    }
  };

  useEffect(() => {
    getDetails();
  }, []);

  return (
    <div>
      <div className="flex h-88 w-full flex-row items-center bg-miru-han-purple-1000 p-4 text-white">
        <div className="relative flex h-14 w-1/5 justify-center">
          <img className="h-14 w-14" src={UserAvatarSVG} />
        </div>
        <div className="flex w-4/5 flex-col items-baseline justify-center px-4">
          <Tooltip
            content={`${profileSettings.first_name} ${profileSettings.last_name}`}
            wrapperClassName="relative block max-w-full "
          >
            <div className="mb-1 max-w-full overflow-hidden truncate whitespace-nowrap px-4">
              <span className="text-xl font-bold text-white">
                {`${profileSettings.first_name} ${profileSettings.last_name}`}
              </span>
            </div>
          </Tooltip>
          <span className="text-xs leading-4 tracking-wider text-miru-dark-purple-1000" />
        </div>
      </div>
    </div>
  );
};
