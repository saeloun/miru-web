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

  const [total, setTotal] = useState<any>({
    zero_to_thirty_days: 0,
    thirty_one_to_sixty_days: 0,
    sixty_one_to_ninety_days: 0,
    ninety_plus_days: 0,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const sortedClients = accountsAgingReport.clientList.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    if (accountsAgingReport.selectedFilter.clients.length > 0) {
      const temp = accountsAgingReport.selectedFilter.clients.map(
        client => client.name
      );

      const filterd = sortedClients.filter(client =>
        temp.includes(client.name)
      );

      setClientList(filterd);
      setLoading(false);
    } else {
      setClientList(sortedClients);
      setLoading(false);
    }
  }, [accountsAgingReport]);

  useEffect(() => calculateTotal(), [clientList]);

  const sortClientList = () => {
    const temp = clientList.reverse();
    setClientList(temp);
  };

  const calculateTotal = () => {
    const result = clientList.reduce((acc, n) => {
      for (const key in n.amount_overdue) {
        if (acc.hasOwn(key)) acc[key] += n.amount_overdue[key];
        else acc[key] = n.amount_overdue[key];
      }

      return acc;
    }, {});
    setTotal(result);
  };

  return (
    <>
      <SummaryDashboard
        currency={accountsAgingReport.currency}
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
        <tbody className="divide-y divide-gray-200 overflow-scroll bg-white">
          {loading ? (
            <p className="tracking-wide flex items-center justify-center text-base font-medium text-miru-han-purple-1000">
              Loading...
            </p>
          ) : clientList.length ? (
            clientList.map((client, index) => (
              <Fragment key={index}>
                <TableRow
                  currency={accountsAgingReport.currency}
                  key={index}
                  report={client}
                />
              </Fragment>
            ))
          ) : (
            <p className="tracking-wide flex items-center justify-center text-base font-medium text-miru-han-purple-1000 md:h-50">
              No Data Found
            </p>
          )}
          {clientList.length > 0 && (
            <TableTotal
              currency={accountsAgingReport.currency}
              report={total}
            />
          )}
        </tbody>
      </table>
    </>
  );
};

export default Container;
