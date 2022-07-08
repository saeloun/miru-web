/* eslint-disable @typescript-eslint/no-unused-vars */
import reports from "apis/reports/clientRevenue";

const getReportData = async ({ selectedFilter, setClientList, setNavFilters, setFilterVisibilty, setSummary, setCurrency }) => {

  const res = await reports.get();
  setClientList(res.data.clients);
  setCurrency(res.data.currency);
  setSummary(res.data.summary);
  setNavFilters(true);
  setFilterVisibilty(false);
};

export default getReportData;
