import React, { useState } from "react";

import { DownloadSimpleIcon } from "miruIcons";

const TableRow = ({
  data
}) => {
  const [isSending, setIsSending] = useState<boolean>(false);

  return (
    <>
      <tr className="last:border-b-0 hover:bg-miru-gray-200 group">
        <td className="px-2 py-4 text-xs font-normal text-miru-dark-purple-1000	">
          {data.date}
        </td>

        <td className="w-10/12 px-4 py-4 text-xs font-normal text-miru-dark-purple-1000 ftracking-wider">
          {data.description}
        </td>

        <td className=" px-2 py-4 text-base	font-normal tracking-wider text-miru-dark-purple-1000">
          {data.team_members}
        </td>

        <td className="px-2 py-4 w-2/12 text-center text-xl font-bold tracking-wider text-miru-dark-purple-1000">
          {data.total_bill_amt}
        </td>

        <td className="px-2 py-4 text-xs font-normal text-miru-dark-purple-1000">
          {data.payment_type}
        </td>

        <td className="px-2 py-4 text-sm font-medium text-right whitespace-nowrap">
          <div className="flex items-center h-full">
            <button
              className="hidden group-hover:block text-miru-han-purple-1000"
              onClick={() => setIsSending(!isSending)}
            >
              <DownloadSimpleIcon size={16} />
            </button>
          </div>
        </td>
      </tr>
    </>
  );
};

export default TableRow;
