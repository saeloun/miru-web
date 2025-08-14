const RevenueByClientReportContext = {
  filterOptions: {
    clients: [],
  },
  selectedFilter: {
    dateRange: { label: "All", value: "" },
    clients: [],
  },
  customDateFilter: {
    from: "",
    to: "",
  },
  filterCounter: 0,
  clientList: [],
  currency: "",
  summary: {
    totalPaidAmount: 0,
    totalOutstandingAmount: 0,
    totalRevenue: 0,
  },
  handleRemoveSingleFilter: (key, value) => {},
};

export default RevenueByClientReportContext;
