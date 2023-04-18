import React from "react";

import { currencyFormat } from "helpers";
import { Badge } from "StyledComponents";

import { TableRowProps } from "../interfaces";

const TableRow = ({ payment, baseCurrency }: TableRowProps) => {
  const {
    clientName,
    invoiceNumber,
    status,
    amount,
    transactionType,
    transactionDate,
    note,
  } = payment;

  const getStatusCss = status => {
    const STATUS_LIST = {
      paid: "bg-miru-han-purple-100 text-miru-han-purple-1000",
      partially_paid: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
      failed: "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    };
    const lowerCaseStatus = status.toLowerCase();

    return `rounded-lg px-1 ${STATUS_LIST[lowerCaseStatus]}`;
  };

  return (
    <tr className="group last:border-b-0 hover:bg-miru-gray-100">
      <td className="py-2.5 pr-6 pl-0 text-left">
        <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
          {clientName}
        </h1>
        <h3 className="pt-1 text-sm font-normal leading-5 text-miru-dark-purple-400">
          {invoiceNumber}
        </h3>
      </td>
      <td className="px-6 py-2.5 text-left text-sm font-normal leading-4 text-miru-dark-purple-1000">
        {transactionDate}
      </td>
      <td className="px-6 py-2.5 text-left">
        <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
          {transactionType}
        </h1>
        <h3 className="pt-1 text-sm font-normal leading-5 text-miru-dark-purple-400">
          {note}
        </h3>
      </td>
      <td className="px-6 py-2.5 text-right text-xl font-bold leading-7 text-miru-dark-purple-1000">
        {baseCurrency && currencyFormat(baseCurrency, amount)}
      </td>
      <td className="py-2.5 pl-6 pr-0 text-right text-sm font-semibold leading-4 tracking-wider">
        <Badge className={`${getStatusCss(status)} uppercase`} text={status} />
      </td>
    </tr>
  );
};

export default TableRow;
