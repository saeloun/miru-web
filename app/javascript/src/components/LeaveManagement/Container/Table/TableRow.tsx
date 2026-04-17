import React from "react";

import {
  generateLeaveIcon,
  generateLeaveColor,
  generateHolidayIcon,
  generateHolidayColor,
} from "components/Profile/Organization/Leaves/utils";
import { minToHHMM } from "helpers";

// Default color for custom leaves
const CUSTOM_LEAVE_COLOR = { value: "#9B59B6", label: "custom" };
const CUSTOM_LEAVE_ICON = { icon: null, value: "custom" };

const TableRow = ({ timeoffEntry }) => {
  const { leaveDate, duration, leaveType, holidayInfo, customLeave } =
    timeoffEntry;

  const getLeaveIcon = () => {
    if (customLeave) {
      return generateLeaveIcon(customLeave.icon) || CUSTOM_LEAVE_ICON;
    }

    if (leaveType?.icon) {
      return generateLeaveIcon(leaveType.icon);
    }

    return generateHolidayIcon(holidayInfo?.category);
  };

  const getLeaveColor = () => {
    if (customLeave) {
      return generateLeaveColor(customLeave.color) || CUSTOM_LEAVE_COLOR;
    }

    if (leaveType?.color) {
      return generateLeaveColor(leaveType.color);
    }

    return generateHolidayColor(holidayInfo?.category);
  };

  const leaveIcon = getLeaveIcon();
  const leaveColor = getLeaveColor();
  const leaveName = customLeave?.name || leaveType?.name || holidayInfo?.name;

  return (
    <tr className="grid w-full grid-cols-[minmax(8rem,1.15fr)_minmax(12rem,1.9fr)_minmax(6rem,0.85fr)] items-center gap-4 px-4 py-4">
      <td className="text-left text-base font-normal tracking-widest">
        {leaveDate}
      </td>
      <td className="flex items-center whitespace-pre-wrap py-2.5 text-left text-base font-normal text-foreground">
        <div
          className="mr-2 hidden h-6 w-6 items-center justify-center rounded-full text-white lg:flex"
          style={{ backgroundColor: leaveColor?.value }}
        >
          {leaveIcon?.icon}
        </div>
        <span>{leaveName}</span>
      </td>
      <td className="whitespace-nowrap pb-2.5 text-right text-base">
        {minToHHMM(duration)}
      </td>
    </tr>
  );
};

export default TableRow;
