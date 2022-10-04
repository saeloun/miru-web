import React from "react";

import { currencyFormat } from "helpers";

const TableRow = ({ payment, baseCurrency }) => {
  const getStatusCss = (status) => {
    const STATUS_LIST = {
      paid: "bg-miru-han-purple-100 text-miru-han-purple-1000",
      partially_paid: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
      failed: "bg-miru-alert-pink-400 text-miru-alert-red-1000"
    };
    const lowerCaseStatus = status.toLowerCase();
    return `rounded-lg px-1 ${STATUS_LIST[lowerCaseStatus]}`;
  };

  const formattedAmount = baseCurrency && currencyFormat({
    baseCurrency: baseCurrency,
    amount: payment.amount
  });

  return (
    <tr className="last:border-b-0 hover:bg-miru-gray-100 group">
      <td className="pr-6 pl-0 py-2.5 text-left">
        <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
          {payment.clientName}
        </h1>
        <h3 className="pt-1 font-normal text-sm text-miru-dark-purple-400 leading-5">
          {payment.invoiceNumber}
        </h3>
      </td>

      <td className="px-6 py-2.5 text-sm font-normal leading-4 text-miru-dark-purple-1000 text-left">
        {payment.transactionDate}
      </td>

      <td className="px-6 py-2.5 text-left">
        <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
          {payment.transactionType}
        </h1>
        <h3 className="pt-1 font-normal text-sm text-miru-dark-purple-400 leading-5">
          {payment.note}
        </h3>
      </td>

      <td className="px-6 py-2.5 text-xl font-bold text-miru-dark-purple-1000 leading-7 text-right">
        {formattedAmount}
      </td>

      <td className="pl-6 pr-0 py-2.5 text-sm font-semibold tracking-wider leading-4 text-right">
        <span className={getStatusCss(payment.status) + " uppercase"}>
          {payment.status}
        </span>
      </td>
    </tr>
  );
};

export default TableRow;
