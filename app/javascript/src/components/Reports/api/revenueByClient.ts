import clientRevenueApi from "apis/reports/clientRevenue";
import dayjs from "dayjs";
import Logger from "js-logger";

dayjs.Ls.en.weekStart = 1;

const getReportData = async ({
  selectedFilter,
  setClientList,
  setShowNavFilters,
  setIsFilterVisible,
  setSummary,
  setCurrency,
  customDate,
}) => {
  try {
    let fromDate, toDate;
    let clientIds = [];

    const currentYear = dayjs().year();
    const lastMonthOfQuarter = dayjs()["quarter"]() * 3 - 1;
    const firstMonthOfQuarter = dayjs()["quarter"]() * 3 - 3;
    const thisQuarterFirstDate = dayjs(dayjs().month(firstMonthOfQuarter))
      .startOf("month")
      .format("DD-MM-YYYY");

    const thisQuarterLastDate = dayjs(dayjs().month(lastMonthOfQuarter))
      .endOf("month")
      .format("DD-MM-YYYY");

    switch (selectedFilter.dateRange.value) {
      case "this_quarter":
        fromDate = thisQuarterFirstDate;
        toDate = thisQuarterLastDate;
        break;

      case "last_quarter":
        fromDate = dayjs(dayjs().month(firstMonthOfQuarter))
          .subtract(3, "month")
          .startOf("month")
          .format("DD-MM-YYYY");

        toDate = dayjs(dayjs().month(lastMonthOfQuarter))
          .subtract(3, "month")
          .endOf("month")
          .format("DD-MM-YYYY");
        break;

      case "this_year":
        fromDate = `01-01-${currentYear}`;
        toDate = `31-12-${currentYear}`;
        break;

      case "last_year":
        fromDate = `01-01-${currentYear - 1}`;
        toDate = `31-12-${currentYear - 1}`;
        break;

      case "custom":
        if (customDate.from && customDate.to) {
          fromDate = dayjs(customDate.from).format("DD-MM-YYYY");
          toDate = dayjs(customDate.to).format("DD-MM-YYYY");
        } else {
          fromDate = "01-01-2022";
          toDate = dayjs().format("DD-MM-YYYY");
        }
        break;

      default:
        fromDate = "01-01-2022";
        toDate = dayjs().format("DD-MM-YYYY");
        break;
    }
    if (!(selectedFilter.clients[0]["label"] === "All Clients")) {
      clientIds = selectedFilter.clients.map(client => client.value);
    }

    const res = await clientRevenueApi.get(fromDate, toDate, clientIds);
    setClientList(res.data.clients);
    setCurrency(res.data.currency);
    setSummary(res.data.summary);
    setShowNavFilters(true);
    setIsFilterVisible(false);
  } catch (e) {
    Logger.error(e.message);
  }
};

export default getReportData;
