import React from "react";

import { minToHHMM } from "helpers";
import { Avatar } from "StyledComponents";

import {
  generateLeaveColor,
  generateLeaveIcon,
} from "components/Profile/Organization/Leaves/utils";

const LeaveBlock = ({ leaveType }) => {
  const { icon, color, name, netDuration, netDays } = leaveType;

  const leaveIcon = generateLeaveIcon(icon);
  const leaveColor = generateLeaveColor(color);

  return (
    <div
      className="flex w-full justify-start rounded-lg p-2 text-white lg:flex-col lg:p-6"
      style={{ background: leaveColor.value }}
    >
      <Avatar
        classNameImg="mr-2 p-2"
        size="w-8 h-8"
        style={{ backgroundColor: "white" }}
        url={leaveIcon.icon}
      />
      <div className="mt-4 flex flex-col">
        <span className="text-xs font-semibold lg:text-sm">{name}</span>
        <span className="mt-2 text-base font-semibold lg:text-2xl">
          {`${minToHHMM(netDuration)} h (${netDays} days)`}
        </span>
      </div>
    </div>
  );
};

export default LeaveBlock;
