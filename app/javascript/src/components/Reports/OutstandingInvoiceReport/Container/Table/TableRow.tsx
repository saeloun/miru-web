import React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { Avatar, Badge } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

import { OutstandingOverdueInvoice } from "../../interface";

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

  return (
    <tr className="flex items-center hover:bg-miru-gray-100" key={id}>
      <td className="w-1/2 whitespace-nowrap pt-3 pb-4 text-left lg:w-4/12 lg:py-2.5">
        <span className="flex items-center">
          <Avatar classNameImg="mr-2 lg:mr-6" />
          <span>
            <p className="whitespace-normal text-sm font-medium text-miru-dark-purple-1000 lg:text-base lg:font-semibold">
              {clientName}
            </p>
            <p className="text-xs font-medium text-miru-dark-purple-400 lg:text-sm">
              {invoiceNo}
            </p>
          </span>
        </span>
        <dl className="text-left text-xs leading-5 lg:hidden">
          <dt className="mt-3 font-medium text-miru-dark-purple-400">
            issued on{" "}
            <span className="font-bold">{formattedDate(issueDate)}</span>
          </dt>
        </dl>
      </td>
      <td className="hidden w-3/12 whitespace-pre-wrap pt-3 pb-4 text-left text-base font-normal lg:table-cell lg:py-2.5">
        <h1 className="font-semibold text-miru-dark-purple-1000">
          {formattedDate(issueDate)}
        </h1>
        <h3 className="text-sm font-normal text-miru-dark-purple-400">
          Due on {formattedDate(dueDate)}
        </h3>
      </td>
      <td className="hidden w-2/12 pt-3 pb-4 text-right text-xl font-bold tracking-wider text-miru-dark-purple-1000 lg:table-cell lg:py-4">
        {currencyFormat(currency, amount)}
      </td>
      <td className="w-1/2 self-start pt-3 pb-4 text-right font-medium lg:w-3/12 lg:self-center lg:py-6 lg:pr-2">
        <Badge
          className={`${getStatusCssClass(status)} uppercase`}
          text={status}
        />
        <dl className="text-right text-sm font-medium leading-5 lg:hidden">
          <dt className="mt-1">{currencyFormat(currency, amount)}</dt>
        </dl>
      </td>
    </tr>
  );
};

export default TableRow;
