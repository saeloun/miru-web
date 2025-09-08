const TimeEntryReportContext = {
  reports: [],
  selectedFilter: {
    dateRange: { label: "All", value: "" },
    clients: [],
    teamMember: [],
    status: [],
    groupBy: { label: "Client", value: "client" },
    customDateFilter: {
      from: "",
      to: "",
    },
  },
  filterOptions: {
    clients: [],
    teamMembers: [],
    projects: [],
  },
  groupByTotalDuration: {
    groupBy: "",
    groupedDurations: {},
  },
  filterCounter: 0,
  handleRemoveSingleFilter: (key, value) => {},
};

export default TimeEntryReportContext;
