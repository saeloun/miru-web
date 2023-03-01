import React from "react";

import { UserAvatarSVG } from "miruIcons";
import { Tooltip } from "StyledComponents";

export const UserInformation = ({ firstName, lastName }) => (
  <div>
    <div className="flex h-20 w-full items-center bg-miru-han-purple-1000 p-4 text-white" />
    <div className="flex flex-col justify-center bg-miru-gray-100">
      <div className="relative flex h-12 justify-center">
        <div className="userAvatarWrapper">
          <img className="h-24 w-24" src={UserAvatarSVG} />
        </div>
      </div>
      <div className="mt-3 flex flex-col items-center justify-center border-b-8 border-miru-gray-200 pb-8">
        <Tooltip
          content={`${firstName} ${lastName}`}
          wrapperClassName="relative block max-w-full "
        >
          <div className="mb-1 max-w-full overflow-hidden truncate whitespace-nowrap px-4">
            <span className=" text-xl font-bold text-miru-han-purple-1000">
              {`${firstName} ${lastName}`}
            </span>
          </div>
        </Tooltip>
        <span className="text-xs leading-4 tracking-wider text-miru-dark-purple-1000" />
      </div>
    </div>
  </div>
);
