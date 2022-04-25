import React from "react";

const TableRow = ({ member }) => (
  <tr className="last:border-b-0 hover:bg-miru-gray-100 group">
    <td className="pr-6 pl-0 py-2.5 text-left">
      <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
        {member.client}
      </h1>
      <h3 className="pt-1 font-normal text-sm text-miru-dark-purple-400 leading-5">
        {member.invoice_number}
      </h3>
    </td>

    <td className="px-6 py-2.5 text-left">
      <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
        {member.time}
      </h1>
      <h3 className="pt-1 font-normal text-sm text-miru-dark-purple-400 leading-5">
        {member.transaction_date}
      </h3>
    </td>

    <td className="px-6 py-2.5 text-sm font-normal leading-4 text-miru-dark-purple-1000 text-left">
      {member.transaction_type}
    </td>

    <td className="px-6 py-2.5 text-xl font-bold text-miru-dark-purple-1000 leading-7 text-right">
        ${member.amount}
    </td>

    <td className="pl-6 pr-0 py-2.5 text-sm font-semibold tracking-wider leading-4 text-right">
      {member.status == "Failed" ? (
        <span className="bg-miru-alert-pink-400 text-miru-alert-red-1000 rounded-lg px-1">
            Failed
        </span>
      ) : (
        <span className="bg-miru-han-purple-100 text-miru-han-purple-1000 rounded-lg px-1">
            Paid
        </span>
      )}
    </td>
  </tr>
);

export default TableRow;
