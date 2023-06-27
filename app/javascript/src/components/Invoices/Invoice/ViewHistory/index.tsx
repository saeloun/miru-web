import React, { useEffect, useState } from "react";

import { ClockIcon, XIcon } from "miruIcons";
import { Button, SidePanel } from "StyledComponents";

import invoicesApi from "apis/invoices";

import History from "./History";
import { createData } from "./utils";

const ViewHistory = ({ setShowHistory, invoice }) => {
  const [historyData, setHistoryData] = useState([]);
  const [logs, setLogs] = useState([]);

  const getHistory = async () => {
    const { data } = await invoicesApi.invoiceLogs(invoice.id);
    setHistoryData(data.trails);
  };

  useEffect(() => {
    getHistory();
  }, []);

  useEffect(() => {
    const invoiceHistory = createData(historyData);
    setLogs(invoiceHistory);
  }, [historyData]);

  return (
    <SidePanel WrapperClassname="py-8 px-6" setFilterVisibilty={setShowHistory}>
      <SidePanel.Header className="flex justify-between">
        <div className="flex items-center">
          <ClockIcon className="mr-2" size={16} weight="bold" />
          <span>History</span>
        </div>
        <Button
          className="rounded p-2 hover:bg-miru-dark-purple-100"
          onClick={() => {
            setShowHistory(false);
          }}
        >
          <XIcon size={16} weight="bold" />
        </Button>
      </SidePanel.Header>
      <SidePanel.Body className="py-10">
        <History logs={logs} />
      </SidePanel.Body>
    </SidePanel>
  );
};

export default ViewHistory;
