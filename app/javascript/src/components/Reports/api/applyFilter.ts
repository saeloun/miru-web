import reports from "apis/reports";
import dayjs from "dayjs";
import { unmapper } from "../../../mapper/report.mapper";

const isValuePresent = (filterValue) => filterValue.value && filterValue.value !== "";
const isNotEmptyArray = (value) => value && value.length > 0;

const apiKeys = {
  clients: "client",
  dateRange: "date_range",
  groupBy: "group_by",
  status: "status",
  teamMember: "team_member"
};

export const getQueryParams = (selectedFilter) => {
  let params = "";
  for (const filterKey in selectedFilter) {
    const filterValue = selectedFilter[filterKey];

    if (filterKey === "customDateFilter" && filterValue.from !== "" && filterValue.to !== "") {
      params += `&from=${dayjs(filterValue.from).format("DD/MM/YYYY")}&to=${dayjs(filterValue.to).format("DD/MM/YYYY")}`;
    }
    if (Array.isArray(filterValue) && isNotEmptyArray(filterValue)) {
      filterValue.forEach(item => {
        params += `&${apiKeys[filterKey]}[]=${item.value}`;
      });
    }
    if (!Array.isArray(filterValue) && isValuePresent(filterValue)) {
      params += `&${apiKeys[filterKey]}=${filterValue.value}`;
    }
  }
  return params;
};

const applyFilter = async (selectedFilter, setTimeEntries, setNavFilters, setFilterVisibilty, getFilterOptions) => {
  const queryParams = getQueryParams(selectedFilter);
  const sanitizedParam = queryParams.substring(1);
  const sanitizedQuery = `?${sanitizedParam}`;
  const res = await reports.get(sanitizedQuery);
  const sanitizedData = unmapper(res.data);
  setTimeEntries(sanitizedData.reports);
  getFilterOptions(sanitizedData.filterOptions);
  setNavFilters(true);
  setFilterVisibilty(false);
};

export default applyFilter;
