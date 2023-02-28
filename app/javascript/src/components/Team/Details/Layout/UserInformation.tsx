/* eslint-disable no-unused-vars */

import React, { useEffect } from "react";

import { UserAvatarSVG } from "miruIcons";
import { useParams } from "react-router-dom";
import { Tooltip } from "StyledComponents";

import teamsApi from "apis/teams";
import Toastr from "common/Toastr";
import { useTeamDetails } from "context/TeamDetailsContext";
import { teamsMapper } from "mapper/teams.mapper";

export const UserInformation = () => {
  const {
    details: { personalDetails },
    updateDetails,
  } = useTeamDetails();
  const { memberId } = useParams();
  const getDetails = async () => {
    try {
      const res: any = await teamsApi.get(memberId);
      const addRes = await teamsApi.getAddress(memberId);
      const teamsObj = teamsMapper(res.data, addRes.data.addresses[0]);
      updateDetails("personal", teamsObj);
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
            content={`${personalDetails.first_name} ${personalDetails.last_name}`}
            wrapperClassName="relative block max-w-full "
          >
            <div className="mb-1 max-w-full overflow-hidden truncate whitespace-nowrap px-4">
              <span className="text-xl font-bold text-white">
                {`${personalDetails.first_name} ${personalDetails.last_name}`}
              </span>
            </div>
          </Tooltip>
          <span className="text-xs leading-4 tracking-wider text-miru-dark-purple-1000" />
        </div>
      </div>
    </div>
  );
};
