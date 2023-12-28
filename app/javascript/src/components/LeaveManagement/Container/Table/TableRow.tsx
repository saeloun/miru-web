import React from "react";

import { minToHHMM } from "helpers";
import { Avatar } from "StyledComponents";

import {
  generateLeaveIcon,
  generateLeaveColor,
} from "components/Profile/Organization/Leaves/utils";

const TableRow = ({ timeoffEntry }) => {
  const { leaveDate, duration, leaveType } = timeoffEntry;

  const leaveIcon = generateLeaveIcon(leaveType.icon);
  const leaveColor = generateLeaveColor(leaveType.color);

  return (
    <tr className="flex items-center justify-between py-4">
      <td className="flex text-left text-base font-normal tracking-widest lg:w-1/4">
        {leaveDate}
      </td>
      <td className="flex w-1/3 items-center whitespace-pre-wrap py-2.5 text-left text-base font-normal text-miru-dark-purple-1000 lg:table-cell lg:w-4/12">
        <dt className="hidden text-base text-miru-dark-purple-400 lg:inline">
          <Avatar
            classNameImg="mr-2 p-2"
            size="w-8 h-8"
            style={{ backgroundColor: leaveColor.value }}
            url={leaveIcon.icon}
          />
        </dt>
        {leaveType.name}
      </td>
      <td className="flex w-1/3 flex-col whitespace-nowrap pb-2.5 text-right text-base lg:mt-0 lg:table-cell lg:w-3/12 lg:items-center lg:pl-8">
        {minToHHMM(duration)}
      </td>
    </tr>
  );
};

export default TableRow;
