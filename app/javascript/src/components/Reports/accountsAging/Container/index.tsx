import React, { Fragment, useState, useEffect } from "react";

import { SummaryDashboard } from "StyledComponents";

import { useEntry } from "components/Reports/context/EntryContext";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import TableTotal from "./TableTotal";

const Container = () => {
  const { accountsAgingReport } = useEntry();
  const [clientList, setClientList] = useState<any>(
    accountsAgingReport.clientList
  );

  useEffect(() => {
    setClientList(accountsAgingReport.clientList);
  }, [accountsAgingReport]);

  const sortClientList = () => {
    const temp = clientList.reverse();
    setClientList(temp);
  };

  return (
    <>
      <SummaryDashboard
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
      <table className="mt-4 min-w-full divide-y divide-gray-200">
        <TableHeader sortClientList={sortClientList} />
        <tbody className="divide-y divide-gray-200 bg-white">
          {clientList.length &&
            clientList.map((client, index) => (
              <Fragment key={index}>
                <TableRow
                  currency={accountsAgingReport.currency}
                  key={index}
                  report={client}
                />
              </Fragment>
            ))}
          <TableTotal
            currency={accountsAgingReport.currency}
            report={accountsAgingReport.summary}
          />
        </tbody>
      </table>
    </>
  );
};

export default Container;
