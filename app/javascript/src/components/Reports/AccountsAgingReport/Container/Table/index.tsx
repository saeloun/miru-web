import React, { useState, useEffect, Fragment } from "react";

import { useUserContext } from "context/UserContext";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import TableTotal from "./TableTotal";

const Table = ({ accountsAgingReport }) => {
  const [clientList, setClientList] = useState<any>(
    accountsAgingReport.clientList
  );

  const { isDesktop } = useUserContext();

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

  const sortClientList = () => {
    const temp = clientList.reverse();
    setClientList(temp);
  };

  return (
    <table className="mt-4 min-w-full divide-y divide-gray-200">
      {isDesktop && <TableHeader sortClientList={sortClientList} />}
      <tbody className="flex flex-col divide-y divide-gray-200 overflow-scroll bg-white">
        {loading ? (
          <tr className="tracking-wide flex items-center justify-center text-base font-medium text-miru-han-purple-1000">
            <td>Loading...</td>
          </tr>
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
          <tr className="tracking-wide flex items-center justify-center text-base font-medium text-miru-han-purple-1000 md:h-50">
            <td>No Data Found</td>
          </tr>
        )}
        {clientList.length > 0 && isDesktop && (
          <TableTotal
            clientList={clientList}
            currency={accountsAgingReport.currency}
          />
        )}
      </tbody>
    </table>
  );
};

export default Table;
