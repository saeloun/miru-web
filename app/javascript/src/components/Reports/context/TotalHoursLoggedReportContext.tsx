const TotalHoursLoggedReportContext = {
  reports: [],
  selectedFilter: {
    dateRange: { label: "All", value: "" },
    clients: [],
    groupBy: { label: "Project", value: "project" }
  },
  filterOptions: {
    clients: []
  },
  filterCounter: 0,
  handleRemoveSingleFilter: (key, value) => { }, //eslint-disable-line
};

export default TotalHoursLoggedReportContext;
