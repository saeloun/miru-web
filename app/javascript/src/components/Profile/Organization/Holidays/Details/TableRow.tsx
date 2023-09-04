import React from "react";

import dayjs from "dayjs";

const TableRow = ({ holiday, key }) => {
  const { date, name } = holiday;
  const dateFormat = "DD.MM.YYYY";

  return (
    <tr className="flex w-full" key={key}>
      <td
        className="flex w-6/12 items-center border-b border-miru-gray-400 py-6 pr-2 text-left text-sm font-medium text-miru-dark-purple-1000 last:border-0"
        scope="col"
      >
        {dayjs(date).format(dateFormat)}
      </td>
      <td
        className="flex w-6/12 items-center border-b border-miru-gray-400 py-6 pr-2 text-left text-sm font-medium text-miru-dark-purple-1000 last:border-0"
        scope="col"
      >
        {name}
      </td>
    </tr>
  );
};

export default TableRow;
