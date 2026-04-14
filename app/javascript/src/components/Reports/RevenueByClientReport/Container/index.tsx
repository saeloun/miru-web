import React, { Fragment } from "react";

import { SummaryDashboard } from "StyledComponents";

import EmptyStates from "common/EmptyStates";
import { useEntry } from "components/Reports/context/EntryContext";
import { useUserContext } from "context/UserContext";
import { i18n } from "../../../../i18n";

import MobileRow from "./MobileRow";
import TableRow from "./TableRow";

import { summaryList } from "../util";

const RevenueByClientTableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center">
      <th
        className="w-4/12 py-5 pr-6 text-left text-xs font-normal tracking-widest text-muted-foreground"
        scope="col"
      >
        {i18n.t("reports.clientHeader").toUpperCase()}
      </th>
      <th
        className="w-2/12 px-0 py-5 text-right text-xs font-normal tracking-widest text-muted-foreground"
        scope="col"
      >
        {i18n.t("reports.overdueAmount").toUpperCase()}
      </th>
      <th
        className="w-2/12 px-0 py-5 text-right text-xs font-normal tracking-widest text-muted-foreground"
        scope="col"
      >
        {i18n.t("reports.outstandingAmount").toUpperCase()}
      </th>
      <th
        className="w-2/12 px-6 py-5 text-right text-xs font-normal tracking-widest text-muted-foreground"
        scope="col"
      >
        {i18n.t("reports.paidAmount").toUpperCase()}
      </th>
      <th
        className="w-2/12 py-5 pl-6 text-right text-xs font-normal tracking-widest text-muted-foreground"
        scope="col"
      >
        {i18n.t("reports.totalRevenue").toUpperCase()}
      </th>
    </tr>
  </thead>
);

const RevenueByClientResults = () => {
  const { revenueByClientReport } = useEntry();
  const { isDesktop } = useUserContext();

  return revenueByClientReport.clientList.length ? (
    <Fragment>
      <SummaryDashboard
        currency={revenueByClientReport.currency}
        summaryList={summaryList(revenueByClientReport, isDesktop)}
        wrapperClassName="mt-3 lg:mb-9 mx-4 lg:mx-0"
      />
      <div />
      {isDesktop ? (
        <div className="overflow-x-auto">
          <table className="mt-4 min-w-[56rem] table-auto divide-y divide-gray-200 lg:min-w-full">
            <RevenueByClientTableHeader />
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
        </div>
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
          ? i18n.t("reports.noResultsMatchFilters")
          : i18n.t("reports.noClientRevenueData")
      }
    />
  );
};

export default RevenueByClientResults;
