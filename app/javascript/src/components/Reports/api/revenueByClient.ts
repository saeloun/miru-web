/* eslint-disable @typescript-eslint/no-unused-vars */
import clients from "apis/clients";
import clientRevenueApi from "apis/reports/clientRevenue";
import dayjs from "dayjs";

dayjs.Ls.en.weekStart = 1;

const getReportData = async ({
  selectedFilter,
  setClientList,
  setNavFilters,
  setFilterVisibilty,
  setSummary,
  setCurrency
}
) => {
  let fromDate, toDate;
  let clientIds = [];

  const currentYear = dayjs().year();
  const currentMonth = dayjs().month();
  const currentQuarter = dayjs().month();
  const lastMonthOfQuarter = dayjs()["quarter"]() * 3;
  const firstMonthOfQuarter = lastMonthOfQuarter -3;

  switch (selectedFilter.dateRange.label) {
    case "this_quarter":
      fromDate = dayjs(dayjs().month(firstMonthOfQuarter)).endOf("month").format("DD-MM-YYYY");
      toDate = dayjs(dayjs().month(lastMonthOfQuarter)).endOf("month").format("DD-MM-YYYY");
      break;

    case "last_quarter":
      fromDate = dayjs(dayjs().month(firstMonthOfQuarter)).endOf("month").subtract(3, "month").format("DD-MM-YYYY");
      toDate = dayjs(dayjs().month(lastMonthOfQuarter)).endOf("month").subtract(3, "month").format("DD-MM-YYYY");
      break;

    case "this_year":
      fromDate = `01-01-${dayjs().year()}`;
      toDate = `01-01-${dayjs().year()}`;
      break;

    case "last_year":
      fromDate = `01-01-${dayjs().year() -1}`;
      toDate = `01-01-${dayjs().year() -1}`;
      break;

    case "custom":

      break;

    default:
      fromDate = "01-01-2022";
      toDate = dayjs().format("DD-MM-YYYY");
      break;
  }
  if (! (selectedFilter.clients[0]["label"] === "All Clients")) {
    clientIds = selectedFilter.clients.map(client => client.value);
  }
  const res = await clientRevenueApi.get(fromDate, toDate, clientIds);
  setClientList(res.data.clients);
  setCurrency(res.data.currency);
  setSummary(res.data.summary);
  setNavFilters(true);
  setFilterVisibilty(false);
};

export default getReportData;
