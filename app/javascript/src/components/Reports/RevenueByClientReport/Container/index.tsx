import React, { Fragment } from "react";

import { cashFormatter, currencySymbol } from "helpers"; // TODO: Formatter

import EmptyStates from "common/EmptyStates";
import TotalHeader from "common/TotalHeader";
import { useEntry } from "components/Reports/context/EntryContext";
import { useUserContext } from "context/UserContext";

import MobileRow from "./MobileRow";
import TableRow from "./TableRow";

const TableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center">
      <th
        className="w-4/12 py-5 pr-6 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        CLIENT
      </th>
      <th
        className="w-2/12 px-0 py-5 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        OVERDUE <br /> AMOUNT
      </th>
      <th
        className="w-2/12 px-0 py-5 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        OUTSTANDING <br /> AMOUNT
      </th>
      <th
        className="w-2/12 px-6 py-5 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        PAID <br /> AMOUNT
      </th>
      <th
        className="w-2/12 py-5 pl-6 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        TOTAL <br /> REVENUE
      </th>
    </tr>
  </thead>
);

const Container = () => {
  const { revenueByClientReport } = useEntry();
  const currencySymb = currencySymbol(revenueByClientReport.currency);
  const { isDesktop } = useUserContext();

  return revenueByClientReport.clientList.length ? (
    <Fragment>
      <TotalHeader
        firstTitle={isDesktop ? "TOTAL PENDING AMOUNT" : "PENDING"}
        secondTitle={isDesktop ? "TOTAL PAID AMOUNT" : "PAID"}
        thirdTitle={isDesktop ? "TOTAL REVENUE" : "TOTAL"}
        firstAmount={`${currencySymb}${cashFormatter(
          revenueByClientReport.summary.totalOutstandingAmount
        )}`}
        secondAmount={`${currencySymb}${cashFormatter(
          revenueByClientReport.summary.totalPaidAmount
        )}`}
        thirdAmount={`${currencySymb}${cashFormatter(
          revenueByClientReport.summary.totalRevenue
        )}`}
      />
      <div />
      {isDesktop ? (
        <table className="mt-4 min-w-full table-auto divide-y divide-gray-200">
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
      ) : (
        <div className="my-6 mx-4">
          {revenueByClientReport.clientList.length > 0 &&
            revenueByClientReport.currency &&
            revenueByClientReport.clientList.map((client, index) => (
              <Fragment key={index}>
                <MobileRow
                  currency={revenueByClientReport.currency}
                  key={index}
                  report={client}
                />
                <hr />
              </Fragment>
            ))}
        </div>
      )}
    </Fragment>
  ) : (
    <EmptyStates
      showNoSearchResultState={revenueByClientReport.filterCounter > 0}
      Message={
        revenueByClientReport.filterCounter > 0
          ? "No results match current filters. Try removing some filters."
          : " No data found. We will display relevant data once it becomes available"
      }
    />
  );
};

export default Container;
