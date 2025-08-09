import { allocationFrequency as allocationFrequencyProp } from "constants/leaveType";

import React from "react";

const TableRow = ({ leave, key }) => {
  const {
    leaveType,
    leaveIcon,
    leaveColor,
    total,
    allocationPeriod,
    allocationFrequency,
    carryForwardDays,
  } = leave;

  const allocationFrequencyLabel = allocationFrequencyProp.find(
    item => item.value === allocationFrequency
  )?.label;

  return (
    <tr className="flex w-full" key={key}>
      <td className="flex w-4/12 cursor-pointer items-center border-b border-miru-gray-400 py-6 pr-2">
        <div
          className="mr-2 flex h-8 w-8 items-center justify-center rounded-full p-px text-white"
          style={{ backgroundColor: leaveColor?.value }}
        >
          {leaveIcon?.icon}
        </div>
        <span className="text-left text-sm font-medium text-miru-dark-purple-1000">
          {leaveType}
        </span>
      </td>
      <td
        className="flex w-4/12 items-center border-b border-miru-gray-400 py-6 pr-2 text-left text-sm font-medium text-miru-dark-purple-1000"
        scope="col"
      >
        {total} {allocationPeriod} {allocationFrequencyLabel}
      </td>
      <td
        className="flex w-4/12 items-center border-b border-miru-gray-400 py-6 pr-2 text-left text-sm font-medium text-miru-dark-purple-1000"
        scope="col"
      >
        {carryForwardDays} days
      </td>
    </tr>
  );
};

export default TableRow;
