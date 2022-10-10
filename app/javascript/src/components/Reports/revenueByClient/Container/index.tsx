import React, { Fragment } from "react";

import { cashFormatter, currencySymbol } from "helpers"; // TODO: Formatter

import TotalHeader from "common/TotalHeader";
import { useEntry } from "components/Reports/context/EntryContext";

import TableRow from "./TableRow";

const TableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center">
      <th
        scope="col"
        className="w-3/5 pr-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        CLIENT
      </th>
      <th
        scope="col"
        className="w-2/5 px-0 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        UNPAID AMOUNT
      </th>
      <th
        scope="col"
        className="w-1/5 px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        PAID AMOUNT
      </th>
      <th
        scope="col"
        className="w-1/5 pl-6 py-5 text-right text-xs font-normal text-miru-dark-purple-600 tracking-widest"
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
        firstTitle={"TOTAL UNPAID AMOUNT"}
        firstAmount={`${currencySymb}${cashFormatter(revenueByClientReport.summary.totalUnpaidAmount)}`}
        secondTitle={"TOTAL PAID AMOUNT"}
        secondAmount={`${currencySymb}${cashFormatter(revenueByClientReport.summary.totalPaidAmount)}`}
        thirdTitle={"TOTAL REVENUE"}
        thirdAmount={`${currencySymb}${cashFormatter(revenueByClientReport.summary.totalRevenue)}`}
      />
      <div>
      </div>
      <table className="min-w-full divide-y divide-gray-200 mt-4">
        <TableHeader />
        <tbody className="bg-white divide-y divide-gray-200">
          {
            revenueByClientReport.clientList.length && revenueByClientReport.currency && revenueByClientReport.clientList.map((client, index) => (
              <Fragment key={index}>
                <TableRow key={index} currency={revenueByClientReport.currency} report={client} />
              </Fragment>
            ))
          }
        </tbody>
      </table>
    </Fragment>
  );
};

export default Container;
