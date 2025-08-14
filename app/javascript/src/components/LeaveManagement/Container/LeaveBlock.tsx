import React from "react";

import {
  generateLeaveIcon,
  generateLeaveColor,
  generateHolidayIcon,
  generateHolidayColor,
} from "components/Profile/Organization/Leaves/utils";
import { minToHHMM } from "helpers";

const LeaveBlock = ({ leaveType, selectedLeaveType, setSelectedLeaveType }) => {
  const { icon, color, name, netDuration, type, category, label } = leaveType;

  const leaveIcon =
    type == "leave" ? generateLeaveIcon(icon) : generateHolidayIcon(icon);

  const leaveColor =
    type == "leave" ? generateLeaveColor(color) : generateHolidayColor(color);

  const formattedDuration =
    category == "national" || category == "optional"
      ? label
      : netDuration < 0
      ? `-${minToHHMM(-netDuration)} h (-${label})`
      : `${minToHHMM(netDuration)} h (${label})`;

  const selectedDiv =
    selectedLeaveType?.name == name
      ? "flex w-full cursor-pointer justify-between rounded-lg p-2 text-white lg:p-6 shadow-2xl border-2 border-miru-dark-purple-1000 border-opacity-20 relative"
      : "flex w-full cursor-pointer justify-between rounded-lg p-2 text-white lg:p-6 hover:opacity-80 relative";

  return (
    <div
      className={selectedDiv}
      style={{ background: leaveColor.value }}
      onClick={() => setSelectedLeaveType(leaveType)}
    >
      <div className="z-10 w-3/4 flex-col">
        <div
          className="hidden h-8 w-8 items-center justify-center rounded-full lg:flex"
          style={{ backgroundColor: "white", color: leaveColor.value }}
        >
          {leaveIcon?.icon}
        </div>
        <div className="mt-4 flex flex-col">
          <span className="text-xs font-semibold lg:text-sm">{name}</span>
          <span className="mt-2 text-base font-semibold lg:text-2xl">
            {formattedDuration}
          </span>
        </div>
      </div>
      <div className="absolute right-0 hidden h-3/4 w-1/4 items-end justify-end p-2 text-white opacity-10 lg:flex">
        {leaveIcon?.icon}
      </div>
    </div>
  );
};

export default LeaveBlock;
