import React from "react";

import EmptyStates from "common/EmptyStates";
import { useEntry } from "components/Reports/context/EntryContext";
import { SummaryDashboard } from "StyledComponents";

import Table from "./Table";

const Container = () => {
  const { accountsAgingReport } = useEntry();

  return accountsAgingReport.clientList.length ? (
    <div className="bg-white p-4 lg:p-0">
      <SummaryDashboard
        currency={accountsAgingReport.currency}
        showPointer={false}
        wrapperClassName="lg:mt-3"
        summaryList={[
          {
            label: "0 - 30 DAYS",
            value: accountsAgingReport.summary.zero_to_thirty_days,
          },
          {
            label: "31 - 60 DAYS",
            value: accountsAgingReport.summary.thirty_one_to_sixty_days,
          },
          {
            label: "61 - 90 DAYS",
            value: accountsAgingReport.summary.sixty_one_to_ninety_days,
          },
          {
            label: "90+ DAYS",
            value: accountsAgingReport.summary.ninety_plus_days,
          },
        ]}
      />
      <div>
        <Table accountsAgingReport={accountsAgingReport} />
      </div>
    </div>
  ) : (
    <EmptyStates
      showNoSearchResultState={accountsAgingReport.filterCounter > 0}
      Message={
        accountsAgingReport.filterCounter > 0
          ? "No results match current filters. Try removing some filters."
          : "No data found. We will display relevant data once it becomes available"
      }
    />
  );
};

export default Container;
