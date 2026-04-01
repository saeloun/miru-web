import React, { useEffect, useState } from "react";

import { useUserContext } from "context/UserContext";
import { XIcon } from "miruIcons";
import { Button } from "StyledComponents";

import History from "./History";
import { getHistory } from "./utils";
import { i18n } from "../../../../i18n";

const HistoryMobileView = ({ setShowHistory, invoice }) => {
  const [logs, setLogs] = useState([]);
  const { company } = useUserContext();

  const getHistoryData = async () => {
    const records = await getHistory(invoice.id, company);
    setLogs(records);
  };

  useEffect(() => {
    getHistoryData();
  }, []);

  return (
    <div className="h-full">
      <div className="sticky top-0 left-0 right-0 z-50 flex h-12 items-center bg-primary px-4 shadow-c1">
        <div className="flex w-full items-center justify-between">
          <span className="ml-4 flex w-full justify-center text-base font-medium text-white">
            {i18n.t("invoices.history")}
          </span>
          <Button
            className=""
            style="ternary"
            onClick={() => {
              setShowHistory(false);
            }}
          >
            <XIcon className="text-white" size={16} weight="bold" />
          </Button>
        </div>
      </div>
      <div className="h-full overflow-y-auto px-4 pt-6">
        <History logs={logs} />
      </div>
    </div>
  );
};

export default HistoryMobileView;
