import React from "react";

import { minToHHMM } from "helpers";
import { Avatar } from "StyledComponents";

import {
  generateLeaveIcon,
  generateLeaveColor,
  generateHolidayIcon,
  generateHolidayColor,
} from "components/Profile/Organization/Leaves/utils";

const LeaveBlock = ({ leaveType, setSelectedLeaveType }) => {
  const { icon, color, name, netDuration, netDays, type, category, label } =
    leaveType;

  const leaveIcon =
    type == "leave" ? generateLeaveIcon(icon) : generateHolidayIcon(icon);

  const leaveColor =
    type == "leave" ? generateLeaveColor(color) : generateHolidayColor(color);

  const formattedDuration =
    netDuration < 0
      ? `-${minToHHMM(-netDuration)} h (${netDays} days)`
      : `${minToHHMM(netDuration)} h (${netDays} days)`;

  return (
    <div
      className="flex w-full cursor-pointer justify-start rounded-lg p-2 text-white lg:flex-col lg:p-6"
      style={{ background: leaveColor.value }}
      onClick={() => setSelectedLeaveType(leaveType)}
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
          {category !== "national" &&
            category != "optional" &&
            formattedDuration}
          {label}
        </span>
      </div>
    </div>
  );
};

export default LeaveBlock;
