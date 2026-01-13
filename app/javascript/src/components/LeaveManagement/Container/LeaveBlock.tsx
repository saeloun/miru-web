import React from "react";

import { minToHHMM } from "helpers";

import {
  generateLeaveIcon,
  generateLeaveColor,
  generateHolidayIcon,
  generateHolidayColor,
} from "components/Profile/Organization/Leaves/utils";

// Default color for custom leaves
const CUSTOM_LEAVE_COLOR = { value: "#9B59B6", label: "custom" };
const CUSTOM_LEAVE_ICON = { icon: null, value: "custom" };

const LeaveBlock = ({ leaveType, selectedLeaveType, setSelectedLeaveType }) => {
  const { icon, color, name, netDuration, type, category, label } = leaveType;

  const getLeaveIcon = () => {
    if (type === "custom_leave") {
      return generateLeaveIcon(icon) || CUSTOM_LEAVE_ICON;
    }

    return type === "leave"
      ? generateLeaveIcon(icon)
      : generateHolidayIcon(icon);
  };

  const getLeaveColor = () => {
    if (type === "custom_leave") {
      return generateLeaveColor(color) || CUSTOM_LEAVE_COLOR;
    }

    return type === "leave"
      ? generateLeaveColor(color)
      : generateHolidayColor(color);
  };

  const leaveIcon = getLeaveIcon();
  const leaveColor = getLeaveColor();

  const formattedDuration =
    category === "national" || category === "optional"
      ? label
      : netDuration < 0
      ? `-${minToHHMM(-netDuration)} h (-${label})`
      : `${minToHHMM(netDuration)} h (${label})`;

  const isSelected = selectedLeaveType?.name === name;

  // Show appropriate text when this leave type is selected
  // For holidays (national/optional), show "Utilized" since the data represents usage
  // For regular leaves and custom leaves, show "Available"
  const getSelectedText = () => {
    if (!isSelected) return name;

    if (category === "national" || category === "optional") {
      return `${name} Utilized`;
    }

    return `${name} Available`;
  };

  const displayName = getSelectedText();

  const selectedDiv = isSelected
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
          <span className="text-xs font-semibold lg:text-sm">
            {displayName}
          </span>
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
