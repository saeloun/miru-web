import reports from "apis/reports";

const isValuePresent = (filterValue) => filterValue.value && filterValue.value !== "";
const isNotEmptyArray = (value) => value && value.length > 0;

const apiKeys = {
  clients: "client",
  dateRange: "date_range",
  groupBy: "groupBy",
  status: "status",
  teamMember: "team_member"
};

const getQueryParams = (selectedFilter) => {
  let params = "";
  for (const filterKey in selectedFilter) {
    const filterValue = selectedFilter[filterKey];
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

const applyFilter = async (selectedFilter, setTimeEntries, setNavFilters, setFilterVisibilty) => {
  const queryParams = getQueryParams(selectedFilter);
  if (queryParams !== "") {
    const sanitizedParam = queryParams.substring(1);
    const sanitizedQuery = `?${sanitizedParam}`;
    const res = await reports.get(sanitizedQuery);
    setTimeEntries(res.data.entries);
    setNavFilters(true);
    setFilterVisibilty(false);
  }
};

export default applyFilter;
