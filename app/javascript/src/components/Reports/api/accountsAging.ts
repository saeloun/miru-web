/* eslint-disable @typescript-eslint/no-unused-vars */
import accountsAgingApi from "apis/reports/accountsAging";
import { Toastr } from "common/Toastr";

const getReportData = async ({ setClientList, setTotalAmount }) => {
  try {
    const res = await accountsAgingApi.get();
    setClientList(res.data.report.clients);
    setTotalAmount(res.data.report.total_amount_overdue);
    //setCurrency(res.data.currency);
    //setSummary(res.data.summary);
    //setShowNavFilters(true);
    //setIsFilterVisible(false);
  } catch (error) {
    Toastr.error(error.message);
  }
};

export default getReportData;
