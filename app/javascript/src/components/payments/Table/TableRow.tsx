import React from "react";

import { currencyFormat } from "helpers";
import { Badge } from "StyledComponents";

const TableRow = ({ payment, baseCurrency }) => {
  const getStatusCss = status => {
    const STATUS_LIST = {
      paid: "bg-miru-han-purple-100 text-miru-han-purple-1000",
      partially_paid: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
      failed: "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    };
    const lowerCaseStatus = status.toLowerCase();

    return `rounded-lg px-1 ${STATUS_LIST[lowerCaseStatus]}`;
  };

  const formattedAmount =
    baseCurrency &&
    currencyFormat({
      baseCurrency,
      amount: payment.amount,
    });

  return (
    <tr className="group last:border-b-0 hover:bg-miru-gray-100">
      <td className="py-2.5 pr-6 pl-0 text-left">
        <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
          {payment.clientName}
        </h1>
        <h3 className="pt-1 text-sm font-normal leading-5 text-miru-dark-purple-400">
          {payment.invoiceNumber}
        </h3>
      </td>
      <td className="px-6 py-2.5 text-left text-sm font-normal leading-4 text-miru-dark-purple-1000">
        {payment.transactionDate}
      </td>
      <td className="px-6 py-2.5 text-left">
        <h1 className="text-base font-bold leading-5 text-miru-dark-purple-1000">
          {payment.transactionType}
        </h1>
        <h3 className="pt-1 text-sm font-normal leading-5 text-miru-dark-purple-400">
          {payment.note}
        </h3>
      </td>
      <td className="px-6 py-2.5 text-right text-xl font-bold leading-7 text-miru-dark-purple-1000">
        {formattedAmount}
      </td>
      <td className="py-2.5 pl-6 pr-0 text-right text-sm font-semibold leading-4 tracking-wider">
        <Badge
          className={`${getStatusCss(payment.status)} uppercase`}
          text={payment.status}
        />
      </td>
    </tr>
  );
};

export default TableRow;
