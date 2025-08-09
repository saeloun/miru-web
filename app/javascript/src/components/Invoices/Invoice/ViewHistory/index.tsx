import React, { useEffect, useState } from "react";

import Loader from "common/Loader/index";
import { useUserContext } from "context/UserContext";
import { ClockIcon, XIcon } from "miruIcons";
import { Button, SidePanel } from "StyledComponents";

import History from "./History";
import { getHistory } from "./utils";

const ViewHistory = ({ setShowHistory, invoice }) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const { company } = useUserContext();

  const getHistoryData = async () => {
    const records = await getHistory(invoice.id, company);
    setLogs(records);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    getHistoryData();
  }, []);

  return (
    <SidePanel WrapperClassname="py-8 px-6" setFilterVisibilty={setShowHistory}>
      <SidePanel.Header className="flex justify-between">
        <div className="flex items-center">
          <ClockIcon className="mr-2" size={16} weight="bold" />
          <span>History</span>
        </div>
        <Button
          style="ternary"
          onClick={() => {
            setShowHistory(false);
          }}
        >
          <XIcon size={16} weight="bold" />
        </Button>
      </SidePanel.Header>
      <SidePanel.Body className="h-full overflow-y-auto py-10">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader />
          </div>
        ) : (
          <History logs={logs} />
        )}
      </SidePanel.Body>
    </SidePanel>
  );
};

export default ViewHistory;
