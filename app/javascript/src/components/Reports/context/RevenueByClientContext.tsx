const RevenueByClientReportContext =  {
  filterOptions: {
    clients: []
  },
  selectedFilter: {
    dateRange: { label: "All", value: "" },
    clients: []
  },
  customDateFilter: {
    from: "",
    to: ""
  },
  filterCounter: 0,
    handleRemoveSingleFilter: (key, value) => { }, //eslint-disable-line
};

export default RevenueByClientReportContext;
