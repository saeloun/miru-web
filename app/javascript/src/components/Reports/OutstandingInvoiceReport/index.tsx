import React, { useEffect } from "react";
import { sendGAPageView } from "utils/googleAnalytics";
import OutstandingInvoicesWorkspaceView from "./WorkspaceView";

const OutstandingInvoiceReport = () => {
  useEffect(() => {
    sendGAPageView();
  }, []);

  return <OutstandingInvoicesWorkspaceView />;
};

export default OutstandingInvoiceReport;
