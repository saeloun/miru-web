import React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { Badge } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

import { OutstandingOverdueInvoice } from "../interface";

const TableRow = ({ currency, reportData }) => {
  const {
    id,
    clientName,
    dueDate,
    amount,
    status,
    invoiceNo,
    issueDate,
  }: OutstandingOverdueInvoice = reportData;

  const formattedDate = date => dayjs(date).format("DD.MM.YYYY");

  const formattedAmount = currencyFormat({
    baseCurrency: currency,
    amount,
  });

  return (
    <tr
      className="grid grid-cols-12 items-center gap-4 hover:bg-miru-gray-100"
      key={id}
    >
      <td className="col-span-4 whitespace-nowrap py-2 text-left">
        <p className="whitespace-normal text-base font-semibold text-miru-dark-purple-1000">
          {clientName}
        </p>
        <p className="text-sm font-normal text-miru-dark-purple-400">
          {invoiceNo}
        </p>
      </td>
      <td className="col-span-3 whitespace-pre-wrap py-2 text-left text-base font-normal">
        <h1 className="font-semibold text-miru-dark-purple-1000">
          {formattedDate(issueDate)}
        </h1>
        <h3 className="text-sm font-normal text-miru-dark-purple-400">
          Due on {formattedDate(dueDate)}
        </h3>
      </td>
      <td className="col-span-2 py-2 text-right text-xl font-bold tracking-wider text-miru-dark-purple-1000">
        {formattedAmount}
      </td>
      <td className="col-span-3 py-2 text-right font-medium">
        <Badge
          className={`${getStatusCssClass(status)} uppercase`}
          text={status}
        />
      </td>
    </tr>
  );
};

export default TableRow;
