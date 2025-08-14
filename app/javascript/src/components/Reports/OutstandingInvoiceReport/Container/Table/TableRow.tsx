import React from "react";

import { currencyFormat } from "helpers";
import AnimatedAvatar from "components/ui/animated-avatar";
import StatusBadge from "components/ui/status-badge";

import { OutstandingOverdueInvoice } from "../../interface";

const TableRow = ({ reportData, logo }) => {
  const {
    id,
    clientName,
    currency,
    dueDate,
    amount,
    status,
    invoiceNo,
    issueDate,
  }: OutstandingOverdueInvoice = reportData;

  return (
    <tr className="flex items-center hover:bg-miru-gray-100" key={id}>
      <td className="w-1/2 whitespace-nowrap pt-3 pb-4 text-left lg:w-4/12 lg:py-2.5">
        <span className="flex items-center">
          <AnimatedAvatar
            url={logo}
            name={clientName}
            size="md"
            animation="scale"
          />
          <span className="ml-2 lg:ml-4">
            <p className="whitespace-normal text-sm font-semibold text-miru-dark-purple-1000 lg:text-base lg:font-semibold">
              {clientName}
            </p>
            <p className="text-xs font-normal text-miru-dark-purple-400 lg:text-sm">
              {invoiceNo}
            </p>
          </span>
        </span>
        <dl className="text-left text-xs leading-5 lg:hidden">
          <dt className="mt-3 font-medium text-miru-dark-purple-400">
            Issued on <span className="font-bold">{issueDate}</span>
          </dt>
        </dl>
      </td>
      <td className="hidden w-3/12 whitespace-pre-wrap pt-3 pb-4 text-left text-base font-normal lg:table-cell lg:py-2.5">
        <h1 className="text-xs font-medium text-miru-dark-purple-1000 lg:text-sm lg:font-semibold">
          {issueDate}
        </h1>
        <h3 className="text-xs font-normal text-miru-dark-purple-400 lg:text-sm">
          Due on {dueDate}
        </h3>
      </td>
      <td className="hidden w-2/12 pt-3 pb-4 text-right text-xl font-bold tracking-wider text-miru-dark-purple-1000 lg:table-cell lg:py-4">
        {currencyFormat(currency, amount)}
      </td>
      <td className="w-1/2 self-start pt-3 pb-4 text-right font-medium lg:w-3/12 lg:self-center lg:py-6 lg:pr-2">
        <StatusBadge status={status} />
        <dl className="text-right text-sm font-medium leading-5 lg:hidden">
          <dt className="mt-1">{currencyFormat(currency, amount)}</dt>
        </dl>
      </td>
    </tr>
  );
};

export default TableRow;
