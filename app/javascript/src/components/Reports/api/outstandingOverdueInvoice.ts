/* eslint-disable @typescript-eslint/no-unused-vars */
import { Toastr } from "StyledComponents";

import reports from "apis/reports/outstandingOverdueInvoice";

const getReportData = async ({
  setClientList,
  setShowNavFilters,
  setIsFilterVisible,
  setSummary,
  setCurrency,
}) => {
  try {
    const res = await reports.get();
    setClientList(res.data.clients);
    setCurrency(res.data.currency);
    setSummary(res.data.summary);
    setShowNavFilters(true);
    setIsFilterVisible(false);
  } catch (error) {
    Toastr.error(error.message);
  }
};

export default getReportData;
