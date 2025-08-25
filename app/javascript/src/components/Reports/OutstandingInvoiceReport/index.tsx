import React, { useEffect } from "react";
import { sendGAPageView } from "utils/googleAnalytics";
import ModernOutstandingInvoiceReport from "./ModernOutstandingInvoiceReport";

const OutstandingInvoiceReport = () => {
  useEffect(() => {
    sendGAPageView();
  }, []);

  return <ModernOutstandingInvoiceReport />;
};

export default OutstandingInvoiceReport;
