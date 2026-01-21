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
    <tr className="flex items-center justify-between py-4">
      <td className="flex text-left text-base font-normal tracking-widest lg:w-1/4">
        {leaveDate}
      </td>
      <td className="flex w-1/3 items-center whitespace-pre-wrap py-2.5 text-left text-base font-normal text-miru-dark-purple-1000 lg:w-4/12">
        <div
          className="mr-2 hidden h-6 w-6 items-center justify-center rounded-full text-white lg:flex"
          style={{ backgroundColor: leaveColor?.value }}
        >
          {leaveIcon?.icon}
        </div>
        <span>{leaveName}</span>
      </td>
      <td className="flex w-1/3 flex-col whitespace-nowrap pb-2.5 text-right text-base lg:mt-0 lg:table-cell lg:w-3/12 lg:items-center lg:pl-8">
        {minToHHMM(duration)}
      </td>
    </tr>
  );
};

export default TableRow;
