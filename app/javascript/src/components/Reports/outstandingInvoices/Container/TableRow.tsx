import React from "react";
import dayjs from "dayjs";
import { currencyFormat } from "helpers/currency";
import getStatusCssClass from "utils/getStatusTag";

import { OutstandingOverdueInvoice } from "../interface";

const TableRow = ({
  currency,
  reportData
}) => {
  const { id,
    clientName,
    dueDate,
    amount,
    status,
    invoiceNo,
    issueDate }: OutstandingOverdueInvoice = reportData;

  const formattedDate = (date) =>
    dayjs(date).format("DD.MM.YYYY");

  const formattedAmount = currencyFormat({
    baseCurrency: currency,
    amount: amount
  });

  return (
    <tr key={id} className="flex flex-row items-center">
      <td className="w-2/5 pr-2 py-4 text-left whitespace-nowrap">
        <p className="font-semibold whitespace-normal text-base text-miru-dark-purple-1000">
          {clientName}
        </p>
        <p className="text-sm font-normal text-miru-dark-purple-400">
          {invoiceNo}
        </p>
      </td>
      <td className="w-1/5 px-2 py-4 text-left text-base font-normal whitespace-pre-wrap">
        <h1 className="font-semibold text-miru-dark-purple-1000">
          {formattedDate(issueDate)}
        </h1>
        <h3 className="text-sm font-normal text-miru-dark-purple-400">
          Due on {formattedDate(dueDate)}
        </h3>
      </td>
      <td className="w-1/5 px-6 py-4 text-center text-xl font-bold tracking-wider text-miru-dark-purple-1000">
        {formattedAmount}
      </td>
      <td className="w-1/5 py-4 px-2 font-medium text-right">
        <span className={getStatusCssClass(status) + " uppercase"}>
          {status}
        </span>
      </td>
    </tr>
  );
};

export default TableRow;
