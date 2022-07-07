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
  clientList: [],
  currency: "",
  summary: {
    totalPaidAmount: 0,
    totalUnpaidAmount: 0,
    totalRevenue: 0
  },
  handleRemoveSingleFilter: (key, value) => { }, //eslint-disable-line
};

export default RevenueByClientReportContext;
