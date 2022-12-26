import React, { Fragment } from "react";

import { cashFormatter, currencySymbol } from "helpers"; // TODO: Formatter

import TotalHeader from "common/TotalHeader";
import { useEntry } from "components/Reports/context/EntryContext";

import TableRow from "./TableRow";

const TableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center">
      <th
        className="w-3/5 py-5 pr-6 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        CLIENT
      </th>
      <th
        className="w-2/5 px-0 py-5 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        UNPAID AMOUNT
      </th>
      <th
        className="w-1/5 px-6 py-5 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        PAID AMOUNT
      </th>
      <th
        className="w-1/5 py-5 pl-6 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        TOTAL AMOUNT
      </th>
    </tr>
  </thead>
);

const Container = () => {
  const { revenueByClientReport } = useEntry();

  const currencySymb = currencySymbol(revenueByClientReport.currency);

  return (
    <Fragment>
      <TotalHeader
        firstTitle="TOTAL UNPAID AMOUNT"
        secondTitle="TOTAL PAID AMOUNT"
        thirdTitle="TOTAL REVENUE"
        firstAmount={`${currencySymb}${cashFormatter(
          revenueByClientReport.summary.totalUnpaidAmount
        )}`}
        secondAmount={`${currencySymb}${cashFormatter(
          revenueByClientReport.summary.totalPaidAmount
        )}`}
        thirdAmount={`${currencySymb}${cashFormatter(
          revenueByClientReport.summary.totalRevenue
        )}`}
      />
      <div />
      <table className="mt-4 min-w-full divide-y divide-gray-200">
        <TableHeader />
        <tbody className="divide-y divide-gray-200 bg-white">
          {revenueByClientReport.clientList.length &&
            revenueByClientReport.currency &&
            revenueByClientReport.clientList.map((client, index) => (
              <Fragment key={index}>
                <TableRow
                  currency={revenueByClientReport.currency}
                  key={index}
                  report={client}
                />
              </Fragment>
            ))}
        </tbody>
      </table>
    </Fragment>
  );
};

export default Container;
