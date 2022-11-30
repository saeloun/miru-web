import React, { useState } from "react";

import { DownloadSimpleIcon } from "miruIcons";

const TableRow = ({ data }) => {
  const [isSending, setIsSending] = useState<boolean>(false);

  return (
    <tr className="group last:border-b-0 hover:bg-miru-gray-200">
      <td className="px-2 py-4 text-xs font-normal text-miru-dark-purple-1000	">
        {data.date}
      </td>
      <td className="ftracking-wider w-10/12 px-4 py-4 text-xs font-normal text-miru-dark-purple-1000">
        {data.description}
      </td>
      <td className=" px-2 py-4 text-base	font-normal tracking-wider text-miru-dark-purple-1000">
        {data.team_members}
      </td>
      <td className="w-2/12 px-2 py-4 text-center text-xl font-bold tracking-wider text-miru-dark-purple-1000">
        {data.total_bill_amt}
      </td>
      <td className="px-2 py-4 text-xs font-normal text-miru-dark-purple-1000">
        {data.payment_type}
      </td>
      <td className="whitespace-nowrap px-2 py-4 text-right text-sm font-medium">
        <div className="flex h-full items-center">
          <button
            className="hidden text-miru-han-purple-1000 group-hover:block"
            onClick={() => setIsSending(!isSending)}
          >
            <DownloadSimpleIcon size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TableRow;
