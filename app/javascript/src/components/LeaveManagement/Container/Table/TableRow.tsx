import React from "react";

import { Avatar } from "StyledComponents";

const TableRow = ({ leave }) => {
  const { date, description, status, hours } = leave;

  return (
    <tr className="flex items-center py-4">
      <td className="flex w-1/3 cursor-pointer items-center pt-2.5 lg:w-3/12 lg:pr-8 ">
        {date}
      </td>
      <td className="flex w-1/3 items-center whitespace-pre-wrap py-2.5 text-left text-base font-normal text-miru-dark-purple-1000 lg:table-cell lg:w-4/12">
        <dt className="hidden text-xs font-medium text-miru-dark-purple-400 lg:inline">
          <Avatar classNameImg="mr-2 lg:mr-6" />
        </dt>
        {description}
      </td>
      <td className="hidden items-center whitespace-nowrap py-2.5 text-left lg:table-cell lg:w-2/12">
        {status}
      </td>
      <td className="flex w-1/3 flex-col whitespace-nowrap pb-2.5 text-right text-xl font-bold text-miru-dark-purple-1000 lg:mt-0 lg:table-cell lg:w-3/12 lg:items-center lg:pl-8">
        {hours}
        <dt className="text-xs font-medium text-miru-dark-purple-400 lg:hidden">
          {status}
        </dt>
      </td>
    </tr>
  );
};

export default TableRow;
