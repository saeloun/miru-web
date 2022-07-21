/* eslint-disable @typescript-eslint/no-unused-vars */
import clientRevenueApi from "apis/reports/clientRevenue";

const getReportData = async ({
  selectedFilter,
  setClientList,
  setNavFilters,
  setFilterVisibilty,
  setSummary,
  setCurrency
}
) => {
  const res = await clientRevenueApi.get("01-01-2022", "01-01-2023", [1, 2]);
  setClientList(res.data.clients);
  setCurrency(res.data.currency);
  setSummary(res.data.summary);
  setNavFilters(true);
  setFilterVisibilty(false);
};

export default getReportData;
