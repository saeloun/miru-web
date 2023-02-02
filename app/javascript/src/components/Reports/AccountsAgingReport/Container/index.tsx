import React from "react";

import { SummaryDashboard } from "StyledComponents";

import { useEntry } from "components/Reports/context/EntryContext";

import Table from "./Table";

const Container = () => {
  const { accountsAgingReport } = useEntry();

  return (
    <div className="bg-white p-4 lg:p-0">
      <SummaryDashboard
        currency={accountsAgingReport.currency}
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
  );
};

export default Container;
